import { SqlSimplifier } from "./app";
type inputSelectdata = {
  [key: string]: boolean | object;
};
type valuesArrayType = { [key: string]: string | number }[];
type whereHavingType = { [key: string]: number | string | object };
interface returnOptionsData {
  queryString: string;
  queryValues: { [key: string]: string | number }[];
}

interface returnBuildQueryConditions {
  result: string[];
  values: { [key: string]: string | number }[];
}

import { InputData } from "./app";
export class QueryFunctions {
  static findMatchingColumns(
    availableColumns: Array<string>,
    data: object,
  ): Array<string> {
    const matchingColumns = [];
    for (const [columnName, columnValues] of Object.entries(data)) {
      let columnNameChecked: string = "";
      if (columnName.includes(".")) {
        columnNameChecked = columnName.split(".")[1];
      } else {
        columnNameChecked = columnName;
      }
      if (availableColumns.includes(columnNameChecked) && columnValues) {
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
      if (distinctColumn.length > 0) {
        distinctColumn = `DISTINCT ${distinctColumn}`;
      } else {
        distinctColumn = "";
      }
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
  static buildQueryConditions(
    data: InputData["or"],
  ): returnBuildQueryConditions {
    const resultArray: string[] = [];
    const valuesArray: valuesArrayType = [];
    if (Array.isArray(data)) {
      for (let el of data) {
        let defaultOperator = "=";
        if ("and" in el) {
          const andQuery = this.buildQueryConditions(el.and);
          resultArray.push(andQuery.result.join(" AND "));
          valuesArray.push(...andQuery.values);
        }
        if ("or" in el) {
          const andQuery = this.buildQueryConditions(el.or);
          resultArray.push(andQuery.result.join(" OR "));
          valuesArray.push(...andQuery.values);
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
        for (const [columnName, columnValues] of Object.entries(el)) {
          if (!SqlSimplifier.invalidColumnNames.includes(columnName)) {
            let values = columnValues;
            if (typeof columnValues === "string") {
              values = `'${columnValues}'`;
            }
            resultArray.push(` ${columnName} ${defaultOperator} ? `);
            const valueObj: { [key: string]: string | number } = {};
            valueObj[columnName] = values;
            valuesArray.push(valueObj);
          }
        }
      }
    }
    return { result: resultArray, values: valuesArray };
  }
  static or(data: InputData["or"]): returnOptionsData {
    const orQuery: returnBuildQueryConditions = this.buildQueryConditions(data);
    const orQueryString = orQuery.result.join(" OR ");
    return { queryString: orQueryString, queryValues: orQuery.values };
  }
  static and(data: InputData["or"]): returnOptionsData {
    const andQuery: returnBuildQueryConditions =
      this.buildQueryConditions(data);
    const andQueryString = andQuery.result.join(" AND ");
    return { queryString: andQueryString, queryValues: andQuery.values };
  }
  static between(
    data: Array<string & Array<number | string>>,
  ): returnOptionsData {
    const columnName: string = data[0];
    const betweenQueryValues: { [key: string]: string } = {};
    for (let i = 0; i < data[1].length; i++) {
      if (typeof data[1][i] === "string") {
        data[1][i] = `'${data[1][i]}'`;
      }
      betweenQueryValues[columnName] = data[1][i];
    }
    const betweenQueryString = ` ${columnName} BETWEEN ? AND ? `;
    return {
      queryString: betweenQueryString,
      queryValues: [betweenQueryValues],
    };
  }
  static in(data: Array<string & Array<string | number>>): returnOptionsData {
    const columnName: string = data[0];
    const inQueryValues: valuesArrayType = [];
    for (let i = 0; i < data[1].length; i++) {
      if (typeof data[1][i] === "string") {
        data[1][i] = `'${data[1][i]}'`;
      }
      const actualObject: { [key: string]: string | number } = {};
      actualObject[columnName] = data[1][i];
      inQueryValues.push(actualObject);
    }
    const inQueryString = ` ${columnName} IN (${data[1]}) `;

    return {
      queryString: inQueryString,
      queryValues: [...inQueryValues],
    };
  }
  static notIn(
    data: Array<string & Array<string | number>>,
  ): returnOptionsData {
    const notInQueryString = this.in(data);
    return {
      queryString: notInQueryString.queryString.replace("IN", "NOT IN"),
      queryValues: notInQueryString.queryValues,
    };
  }
  static like(data: { [key: string]: string }): string {
    if (typeof data === "object" && data !== null) {
      for (const [columnName, columnValues] of Object.entries(data)) {
        console.log(columnName, columnValues);
        return `${columnName} LIKE '${columnValues}'`;
      }
    } else {
      console.error("Wrong data provided");
      process.exit(1);
    }
    return "";
  }

  static notLike(data: { [key: string]: string }): string {
    const result = this.like(data);
    return result.replace("LIKE", "NOT LIKE");
  }
  static notBetween(
    data: Array<string & Array<string | number>>,
  ): returnOptionsData {
    const notBetweenQueryString = this.between(data);
    return {
      queryString: notBetweenQueryString.queryString.replace(
        "BETWEEN",
        "NOT BETWEEN",
      ),
      queryValues: notBetweenQueryString.queryValues,
    };
  }
  static notEquals(data: InputData["or"]): returnOptionsData {
    const notEqualArray: returnBuildQueryConditions =
      this.buildQueryConditions(data);
    return {
      queryString: notEqualArray.result[0].replace("=", "!="),
      queryValues: notEqualArray.values,
    };
  }

  static greaterThan(data: InputData["or"]): returnOptionsData {
    const greaterThanArray: returnBuildQueryConditions =
      this.buildQueryConditions(data);
    return {
      queryString: greaterThanArray.result[0].replace("=", ">"),
      queryValues: greaterThanArray.values,
    };
  }
  static lessThan(data: InputData["or"]): returnOptionsData {
    const lessThanArray: returnBuildQueryConditions =
      this.buildQueryConditions(data);
    return {
      queryString: lessThanArray.result[0].replace("=", "<"),
      queryValues: lessThanArray.values,
    };
  }
  static greaterThanOrEqual(data: InputData["or"]): returnOptionsData {
    const greaterThanOrEqualArray: returnBuildQueryConditions =
      this.buildQueryConditions(data);
    return {
      queryString: greaterThanOrEqualArray.result[0].replace("=", ">="),
      queryValues: greaterThanOrEqualArray.values,
    };
  }
  static lessThanOrEqual(data: InputData["or"]): returnOptionsData {
    const lessThanOrEqualArray: returnBuildQueryConditions =
      this.buildQueryConditions(data);
    return {
      queryString: lessThanOrEqualArray.result[0].replace("=", "<="),
      queryValues: lessThanOrEqualArray.values,
    };
  }
  static buildQueryString(
    data: {
      where?: whereHavingType;
      having?: whereHavingType;
    },
    type: "where" | "having",
  ): returnOptionsData {
    const resultArray: string[] = [];
    const valuesArray: valuesArrayType = [];
    if (data[type] === undefined)
      return {
        queryString: "",
        queryValues: [],
      };
    if (typeof data[type] !== "object") {
      console.error("The where clausse must be an object");
      return {
        queryString: "",
        queryValues: [],
      };
    }
    if ("notLike" in data[type]) {
      const notLikeConditions = (
        data[type] as {
          notLike: { [key: string]: string };
        }
      ).notLike;
      resultArray.push(this.notLike(notLikeConditions));
    }
    if ("like" in data[type]) {
      const likeConditions = (
        data[type] as {
          like: { [key: string]: string };
        }
      ).like;
      resultArray.push(this.like(likeConditions));
    }
    if ("neq" in data[type]) {
      const notEqualCondition = (
        data[type] as {
          neq: InputData["or"];
        }
      ).neq;
      const result = this.notEquals(notEqualCondition);
      resultArray.push(result.queryString);
      valuesArray.push(...result.queryValues);
    } else if ("gt" in data[type]) {
      const greaterThanCondition = (
        data[type] as {
          gt: InputData["or"];
        }
      ).gt;
      const result = this.greaterThanOrEqual(greaterThanCondition);
      resultArray.push(result.queryString);
      valuesArray.push(...result.queryValues);
    } else if ("lt" in data[type]) {
      const lessThanCondition = (
        data[type] as {
          lt: InputData["or"];
        }
      ).lt;
      const result = this.lessThan(lessThanCondition);
      resultArray.push(result.queryString);
      valuesArray.push(...result.queryValues);
    } else if ("gte" in data[type]) {
      const greaterThanOrEqualCondition = (
        data[type] as {
          gte: InputData["or"];
        }
      ).gte;
      const result = this.greaterThanOrEqual(greaterThanOrEqualCondition);
      resultArray.push(result.queryString);
      valuesArray.push(...result.queryValues);
    } else if ("lte" in data[type]) {
      const lessThanOrEqualCondition = (
        data[type] as {
          lte: InputData["or"];
        }
      ).lte;
      const result = this.lessThanOrEqual(lessThanOrEqualCondition);
      resultArray.push(result.queryString);
      valuesArray.push(...result.queryValues);
    } else if ("or" in data[type]) {
      const orCondition = (
        data[type] as {
          or: InputData["or"];
        }
      ).or;
      const result = this.or(orCondition);
      resultArray.push(result.queryString);
      valuesArray.push(...result.queryValues);
    } else if ("in" in data[type]) {
      const inCondition = (
        data[type] as {
          in: Array<string & Array<string>>;
        }
      ).in;
      const result = this.in(inCondition);
      resultArray.push(result.queryString);
      valuesArray.push(...result.queryValues);
    } else if ("notBetween" in data[type]) {
      const notBetweenCondition = (
        data[type] as {
          notBetween: Array<string & Array<string>>;
        }
      ).notBetween;
      const result = this.notBetween(notBetweenCondition);
      resultArray.push(result.queryString);
      valuesArray.push(...result.queryValues);
    } else if ("notIn" in data[type]) {
      const notInCondition = (
        data[type] as {
          notIn: Array<string & Array<string>>;
        }
      ).notIn;
      const result = this.notIn(notInCondition);
      resultArray.push(result.queryString);
      valuesArray.push(...result.queryValues);
    } else if ("and" in data[type]) {
      const andCondition = (
        data[type] as {
          and: InputData["or"];
        }
      ).and;
      const result = this.and(andCondition);
      resultArray.push(result.queryString);
      valuesArray.push(...result.queryValues);
    } else if ("between" in data[type]) {
      const betweenCondition = (
        data[type] as {
          between: Array<string & Array<string>>;
        }
      ).between;
      const result = this.between(betweenCondition);
      resultArray.push(result.queryString);
      valuesArray.push(...result.queryValues);
    } else {
      for (const [columnName, columnValues] of Object.entries(data[type])) {
        if (SqlSimplifier.invalidColumnNames.includes(columnName)) {
          continue;
        }
        let value = columnValues;
        if (typeof columnValues === "string") {
          value = `'${columnValues}'`;
        }
        resultArray.push(` ${columnName} = ${value} `);
      }
    }
    return {
      queryString: resultArray.join(" AND "),
      queryValues: valuesArray,
    };
  }
  static buildHaving(data: {
    groupBy: string;
    having?: whereHavingType;
  }): returnOptionsData {
    const results = this.buildQueryString(data, "having");
    return {
      queryString: results.queryString,
      queryValues: results.queryValues,
    };
  }
  static buildWhere(data: { where?: whereHavingType }): returnOptionsData {
    const results = this.buildQueryString(data, "where");
    return {
      queryString: results.queryString,
      queryValues: results.queryValues,
    };
  }
}
