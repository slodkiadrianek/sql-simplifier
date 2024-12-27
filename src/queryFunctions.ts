import { SqlSimplifier } from "./app";
type inputSelectdata = {
  [key: string]: boolean | object;
};
import { InputData } from "./app";
export class QueryFunctions {
  static findMatchingColumns(
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
  static buildSelect(
    data: inputSelectdata,
    availableColumns: string[],
  ): string {
    let distinctColumn = "";
    let countColumnsString = "";
    const commonColumns = QueryFunctions.findMatchingColumns(
      availableColumns,
      data,
    ).join(",");
    if (typeof data.distinct === "object" && data.distinct !== null) {
      distinctColumn = QueryFunctions.findMatchingColumns(
        availableColumns,
        data.distinct,
      )[0];
      distinctColumn.length > 0
        ? (distinctColumn = `DISTINCT ${distinctColumn}`)
        : (distinctColumn = "");
    }
    if (typeof data.count === "object" && data.count !== null) {
      let countColumns = QueryFunctions.findMatchingColumns(
        availableColumns,
        data.count,
      );
      countColumns = countColumns.map((el: string): string => `COUNT(${el})`);
      countColumnsString = countColumns.join(", ");
    }
    let selectQuery = ` ${distinctColumn !== "" ? distinctColumn + "," : ""} ${countColumnsString !== "" ? countColumnsString + "," : ""} ${commonColumns !== "" ? commonColumns + " ," : ""} `;
    if (selectQuery.length <= 4) selectQuery = "*   ";
    return selectQuery;
  }
  static buildQueryConditions(data: InputData["or"]): string[] {
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
          if (!SqlSimplifier.invalidColumnNames.includes(columnName)) {
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
  static or(data: InputData["or"]): string {
    let orQuery: Array<string> = this.buildQueryConditions(data);
    const orQueryString = orQuery.join(" OR ");
    return orQueryString;
  }
  static and(data: InputData["or"]): string {
    let andQuery: Array<string> = this.buildQueryConditions(data);
    const andQueryString = andQuery.join(" AND ");
    return andQueryString;
  }
  static between(data: Array<string & Array<string>>): string {
    let columnName: string = data[0];
    const betweenQueryString = ` ${columnName} BETWEEN ${data[1][0]} AND ${data[1][1]} `;
    return betweenQueryString;
  }
  static in(data: Array<string & Array<string>>): string {
    let columnName: string = data[0];
    const inQueryString = ` ${columnName} IN (${data[1].join(", ")}) `;
    return inQueryString;
  }
  static notIn(data: Array<string & Array<string>>): string {
    const notInQueryString = this.in(data).replace("IN", "NOT IN");
    return notInQueryString;
  }
  static notBetween(data: Array<string & Array<string>>): string {
    const notBetweenQueryString = this.between(data).replace(
      "BETWEEN",
      "NOT BETWEEN",
    );
    return notBetweenQueryString;
  }
  static notEquals(data: InputData["or"]): string {
    const notEqualArray: string[] = this.buildQueryConditions(data);
    return notEqualArray[0].replace("=", "!=");
  }

  static greaterThan(data: InputData["or"]): string {
    const greaterThanArray: string[] = this.buildQueryConditions(data);
    return greaterThanArray[0].replace("=", ">");
  }
  static lessThan(data: InputData["or"]): string {
    const lessThanArray: string[] = this.buildQueryConditions(data);
    return lessThanArray[0].replace("=", "<");
  }
  static greaterThanOrEqual(data: InputData["or"]): string {
    const greaterThanOrEqualArray: string[] = this.buildQueryConditions(data);
    return greaterThanOrEqualArray[0].replace("=", ">=");
  }
  static lessThanOrEqual(data: InputData["or"]): string {
    const lessThanOrEqualArray: string[] = this.buildQueryConditions(data);
    return lessThanOrEqualArray[0].replace("=", "<=");
  }

  static buildWhere(data: {
    where?: boolean | { [key: string]: boolean | number | string | object };
  }): string {
    const resultArray: string[] = [];

    if (data.where === undefined) return "";
    if (typeof data.where !== "object") {
      console.error("The where clausse must be an object");
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
}
