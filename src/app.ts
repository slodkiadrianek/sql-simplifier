"use strict";
import { DatabaseSync } from "node:sqlite";
import { InsertAndUpdateData } from "./insertData";
type InputData = {
  or: Array<
    | { and: Array<{ [key: string]: any }> } // "and" block with an array of conditions
    | { or: Array<{ [key: string]: any }> } // "or" block with an array of conditions
    | { [key: string]: any } // Single condition like { name: "Adrian" }
  >;
};

export class SqlSimplifier {
  [key: string]: any;
  static invalidColumnNames: string[] = [
    "and",
    "or",
    "neq",
    "gt",
    "lt",
    "gte",
    "lte",
    "between",
  ];
  private sourceDb: DatabaseSync;
  constructor(public pathToDatabase: string) {
    this.sourceDb = new DatabaseSync(pathToDatabase);
  }
  public insertOne(
    tableName: string,
    data: { [key: string]: string | number },
  ): void {
    const dataTypes = this[tableName].columns;
    const result = InsertAndUpdateData.insertOne(tableName, data, dataTypes);
    this.sourceDb.prepare(result.query).run(...result.values);
  }
  public insertMany(
    tableName: string,
    data: { [key: string]: string | number }[],
  ): void {
    const dataTypes = this[tableName].columns;
    const result = InsertAndUpdateData.insertMany(tableName, data, dataTypes);
    this.sourceDb.prepare(result.query).run(...result.values);
  }
  private findMatchingColumns(
    availableColumns: Array<string>,
    data: object,
  ): Array<string> {
    const matchingColumns = [];
    for (const [columnName, columnValues] of Object.entries(data)) {
      if (availableColumns.includes(columnName) && columnValues) {
        matchingColumns.push(columnName);
      }
    }
    return matchingColumns;
  }

  private buildQueryConditions(data: InputData["or"]): string[] {
    const resultArray: string[] = [];

    if (Array.isArray(data)) {
      for (let el of data) {
        let defaultOperator = "=";
        if ("and" in el) {
          const andQuery = this.buildQueryConditions(el.and);
          resultArray.push(andQuery.join(" AND "));
        }
        if ("or" in el) {
          const andQuery = this.buildQueryConditions(el.or);
          resultArray.push(andQuery.join(" OR "));
        }
        if ("neq" in el) {
          defaultOperator = "!=";
          el = el.neq;
        }
        if ("gt" in el) {
          defaultOperator = ">";
          el = el.gt;
        }
        if ("lte" in el) {
          defaultOperator = "<=";
          el = el.lte;
        }
        if ("lt" in el) {
          defaultOperator = "<";
          el = el.lt;
        }
        if ("gte" in el) {
          defaultOperator = ">=";
          el = el.gte;
        }
        for (let [columnName, columnValues] of Object.entries(el)) {
          if (!this.invalidColumnNames.includes(columnName)) {
            if (typeof columnValues === "string") {
              columnValues = `'${columnValues}'`;
            }
            resultArray.push(
              ` ${columnName} ${defaultOperator} ${columnValues} `,
            );
          }
        }
      }
    }
    return resultArray;
  }
  private or(data: InputData["or"]): string {
    let orQuery: Array<string> = this.buildQueryConditions(data);
    const orQueryString = orQuery.join(" OR ");
    return orQueryString;
  }
  private and(data: InputData["or"]): string {
    let andQuery: Array<string> = this.buildQueryConditions(data);
    const andQueryString = andQuery.join(" AND ");
    return andQueryString;
  }
  private between(data: Array<string & Array<string>>): string {
    let columnName: string = data[0];
    const betweenQueryString = ` ${columnName} BETWEEN ${data[1][0]} AND ${data[1][1]} `;
    return betweenQueryString;
  }
  private in(data: Array<string & Array<string>>): string {
    let columnName: string = data[0];
    const inQueryString = ` ${columnName} IN (${data[1].join(", ")}) `;
    return inQueryString;
  }
  private notIn(data: Array<string & Array<string>>): string {
    const notInQueryString = this.in(data).replace("IN", "NOT IN");
    return notInQueryString;
  }
  private notBetween(data: Array<string & Array<string>>): string {
    const notBetweenQueryString = this.between(data).replace(
      "BETWEEN",
      "NOT BETWEEN",
    );
    return notBetweenQueryString;
  }
  private select(
    tableName: string,
    data: { [key: string]: boolean | number | string | object },
  ): string {
    const availableColumns = Object.keys(this[tableName].columns);
    let distinctColumn = "";
    let countColumnsString = "";
    const commonColumns = this.findMatchingColumns(availableColumns, data).join(
      ",",
    );
    if (typeof data.distinct === "object" && data.distinct !== null) {
      distinctColumn = this.findMatchingColumns(
        availableColumns,
        data.distinct,
      )[0];
      distinctColumn.length > 0
        ? (distinctColumn = `DISTINCT ${distinctColumn}`)
        : (distinctColumn = "");
    }
    if (typeof data.count === "object" && data.count !== null) {
      let countColumns = this.findMatchingColumns(availableColumns, data.count);
      countColumns = countColumns.map((el) => `COUNT(${el})`);
      countColumnsString = countColumns.join(", ");
    }
    let selectQuery = ` ${distinctColumn !== "" ? distinctColumn + "," : ""} ${countColumnsString !== "" ? countColumnsString + "," : ""} ${commonColumns !== "" ? commonColumns + " ," : ""} `;
    if (selectQuery.length <= 4) selectQuery = "*   ";
    return selectQuery;
  }

  private notEquals(data: InputData["or"]): string {
    const notEqualArray: string[] = this.buildQueryConditions(data);
    return notEqualArray[0].replace("=", "!=");
  }

  private greaterThan(data: InputData["or"]): string {
    const greaterThanArray: string[] = this.buildQueryConditions(data);
    return greaterThanArray[0].replace("=", ">");
  }
  private lessThan(data: InputData["or"]): string {
    const lessThanArray: string[] = this.buildQueryConditions(data);
    return lessThanArray[0].replace("=", "<");
  }
  private greaterThanOrEqual(data: InputData["or"]): string {
    const greaterThanOrEqualArray: string[] = this.buildQueryConditions(data);
    return greaterThanOrEqualArray[0].replace("=", ">=");
  }
  private lessThanOrEqual(data: InputData["or"]): string {
    const lessThanOrEqualArray: string[] = this.buildQueryConditions(data);
    return lessThanOrEqualArray[0].replace("=", "<=");
  }

  private where(data: {
    where?: boolean | { [key: string]: boolean | number | string | object };
  }): string {
    const resultArray: string[] = [];
    if (typeof data.where !== "object" || data.where === null) {
      console.error("The where clause is not an object");
      return "";
    }
    if ("neq" in data.where && typeof data.where === "object") {
      const notEqualCondition = (
        data.where as {
          neq: InputData["or"];
        }
      ).neq;
      resultArray.push(this.notEquals(notEqualCondition));
    } else if ("gt" in data.where && typeof data.where === "object") {
      const greaterThanCondition = (
        data.where as {
          gt: InputData["or"];
        }
      ).gt;
      resultArray.push(this.greaterThan(greaterThanCondition));
    } else if ("lt" in data.where && typeof data.where === "object") {
      const lessThanCondition = (
        data.where as {
          lt: InputData["or"];
        }
      ).lt;
      resultArray.push(this.lessThan(lessThanCondition));
    } else if ("gte" in data.where && typeof data.where === "object") {
      const greaterThanOrEqualCondition = (
        data.where as {
          gte: InputData["or"];
        }
      ).gte;
      resultArray.push(this.greaterThanOrEqual(greaterThanOrEqualCondition));
    } else if ("lte" in data.where && typeof data.where === "object") {
      const lessThanOrEqualCondition = (
        data.where as {
          lte: InputData["or"];
        }
      ).lte;
      resultArray.push(this.lessThanOrEqual(lessThanOrEqualCondition));
    } else if ("or" in data.where && typeof data.where === "object") {
      const orCondition = (
        data.where as {
          or: InputData["or"];
        }
      ).or;
      resultArray.push(this.or(orCondition));
    } else if ("in" in data.where && typeof data.where === "object") {
      const inCondition = (
        data.where as {
          in: Array<string & Array<string>>;
        }
      ).in;
      resultArray.push(this.in(inCondition));
    } else if ("notBetween" in data.where && typeof data.where === "object") {
      const notBetweenCondition = (
        data.where as {
          notBetween: Array<string & Array<string>>;
        }
      ).notBetween;
      resultArray.push(this.notBetween(notBetweenCondition));
    } else if ("notIn" in data.where && typeof data.where === "object") {
      const notInCondition = (
        data.where as {
          notIn: Array<string & Array<string>>;
        }
      ).notIn;
      resultArray.push(this.notIn(notInCondition));
    } else if ("and" in data.where && typeof data.where === "object") {
      const andCondition = (
        data.where as {
          and: InputData["or"];
        }
      ).and;
      resultArray.push(this.and(andCondition));
    } else if ("between" in data.where && typeof data.where === "object") {
      const betweenCondition = (
        data.where as {
          between: Array<string & Array<string>>;
        }
      ).between;
      resultArray.push(this.between(betweenCondition));
    } else {
      for (let [columnName, columnValues] of Object.entries(data.where)) {
        if (typeof columnValues === "string") {
          columnValues = `'${columnValues}'`;
        }
        resultArray.push(` ${columnName} = ${columnValues} `);
      }
    }
    return resultArray.join(" AND ");
  }

  findOne(
    tableName: string,
    data: {
      where?: boolean | { [key: string]: boolean | number | string | object };
    },
  ): object {
    let selectQuery = this.select(tableName, data);
    let whereQuery = this.where(data);
    console.log(whereQuery);
    selectQuery = selectQuery.slice(0, -3);
    const query = `SELECT ${selectQuery} FROM ${tableName} ${whereQuery === "" ? "" : `WHERE ${whereQuery}`} `;
    console.log(query);
    const prepared = this.sourceDb.prepare(query);
    const result: unknown[] = prepared.all();
    return result;
  }

  createTable(
    tableName: string,
    columns: { [key: string]: { [key: string]: string } },
  ): object {
    let query: string = `CREATE TABLE IF NOT EXISTS ${tableName} (`;
    for (const [columnName, columnProperties] of Object.entries(columns)) {
      query +=
        columnName +
        " " +
        columnProperties.type +
        " " +
        columnProperties.tableOptions +
        ", ";
    }
    query = query.slice(0, -2) + ")";
    this.sourceDb.exec(query);
    this[tableName] = {
      columns: {
        ...columns,
      },
      insertOne: this.insertOne.bind(this, tableName),
      insertMany: this.insertMany.bind(this, tableName),
      find: this.findOne.bind(this, tableName),
    };
    return this[tableName];
  }

  showTableSchema(tableName: string): void {
    const tableInfoQuery = `
        PRAGMA table_info(${tableName})
        `;
    const result = this.sourceDb.prepare(tableInfoQuery);
    console.table(result.all());
  }
}

// const data2 = db["people"].find({
//   where: {
//     notIn: ["age", [21, 30]],
//   },
// });
// console.table(data2);
// console.timeEnd("timeApp");
