"use strict";
import { DatabaseSync } from "node:sqlite";

export const tableOptions = {
  PK: "PRIMARY KEY",
  AI: "AUTOINCREMENT",
  NN: "NOT NULL",
  UQ: "UNIQUE",
  setForeignKey(
    columnName: string,
    foreignTable: string,
    foreignColumn: string,
  ): string {
    return `FOREIGN KEY (${columnName}) REFERENCES ${foreignTable}(${foreignColumn})`;
  },
  setDefault(values: string | number): string {
    return `DEFAULT ${values}`;
  },
  setCheck(sqlExpression: string): string {
    return `CHECK (${sqlExpression})`;
  },
};

type InputData = {
  or: Array<
    | { and: Array<{ [key: string]: any }> } // "and" block with an array of conditions
    | { or: Array<{ [key: string]: any }> } // "or" block with an array of conditions
    | { [key: string]: any } // Single condition like { name: "Adrian" }
  >;
};

export const dataTypes = {
  INT: "INTEGER",
  FLOAT: "FLOAT",
  BOOL: "BOOLEAN",
  DATETIME: "DATETIME",
  TXT: "TEXT",
};
class SqlSimplifier {
  [key: string]: any;
  public invalidColumnNames: string[] = [
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
  private typeChecking(
    value: string | boolean | number,
    expectedType: string,
  ): boolean | undefined {
    switch (expectedType) {
      case "INTEGER":
        return Number.isInteger(value);
      case "FLOAT":
        return typeof value === "number";
      case "BOOL":
        return typeof value === "boolean";
      case "DATETIME":
        return typeof value === "string" && !isNaN(Date.parse(value));
      case "TEXT":
        return typeof value === "string";
    }
  }

  insertData(
    tableName: string,
    dataProvided: { [key: string]: string | number | boolean },
  ): void {
    for (const [columnName, columnValue] of Object.entries(dataProvided)) {
      const result = this.typeChecking(
        columnValue,
        this[tableName].columns[columnName].type,
      );
      if (!result) {
        console.error(
          `The value ${columnValue} is not of type ${this[tableName].columns[columnName].type}`,
        );
        console.timeEnd("timeApp");
        process.exit(1);
      }
    }
    const columns: Array<string> = Object.keys(dataProvided);
    const values: Array<any> = Object.values(dataProvided);
    const columnString = columns.join(", ");
    const amountOfColumns = new Array(values.length).fill("?");
    let query = `INSERT INTO ${tableName}(${columnString}) VALUES(${amountOfColumns.join(", ")});`;
    const prepared = this.sourceDb.prepare(query);
    prepared.run(...values);
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
        if ("between" in el) {
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
      insertData: this.insertData.bind(this, tableName),
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

const db = new SqlSimplifier("./database.sqlite");
db.createTable("Ludzie", {
  id: {
    type: dataTypes.INT,
    tableOptions: ` ${tableOptions.PK} ${tableOptions.AI}`,
  },
  name: {
    type: dataTypes.TXT,
    tableOptions: `${tableOptions.NN}`,
  },
  surname: {
    type: dataTypes.TXT,
    tableOptions: `${tableOptions.NN}`,
  },
  age: {
    type: dataTypes.INT,
    tableOptions: `${tableOptions.NN} ${tableOptions.setDefault(18)}`,
  },
});
console.time("timeApp");

db.showTableSchema("Ludzie");

const data2 = db["Ludzie"].find({
  // age: true,
  where: {
    name: "Adrian",
  },
});
console.table(data2);
console.timeEnd("timeApp");
