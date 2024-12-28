import { SqlSimplifier } from "./app";
type inputSelectdata = {
  [key: string]: boolean | object;
};

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
  static buildQueryConditions(
    data: InputData["or"],
  ): returnBuildQueryConditions {
    const resultArray: string[] = [];
    const valuesArray: { [key: string]: string | number }[] = [];
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
        for (let [columnName, columnValues] of Object.entries(el)) {
          if (!SqlSimplifier.invalidColumnNames.includes(columnName)) {
            if (typeof columnValues === "string") {
              columnValues = `'${columnValues}'`;
            }
            resultArray.push(` ${columnName} ${defaultOperator} ? `);
            const valueObj: { [key: string]: string | number } = {};
            valueObj[columnName] = columnValues;
            console.log(valueObj);
            valuesArray.push(valueObj);
          }
        }
      }
    }
    return { result: resultArray, values: valuesArray };
  }
  static or(data: InputData["or"]): returnOptionsData {
    let orQuery: returnBuildQueryConditions = this.buildQueryConditions(data);
    const orQueryString = orQuery.result.join(" OR ");
    return { queryString: orQueryString, queryValues: orQuery.values };
  }
  static and(data: InputData["or"]): returnOptionsData {
    let andQuery: returnBuildQueryConditions = this.buildQueryConditions(data);
    const andQueryString = andQuery.result.join(" AND ");
    return { queryString: andQueryString, queryValues: andQuery.values };
  }
  static between(
    data: Array<string & Array<number | string>>,
  ): returnOptionsData {
    let columnName: string = data[0];
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
    let columnName: string = data[0];

    const inQueryValues: { [key: string]: string | number }[] = [];
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

  static buildWhere(data: {
    where?: boolean | { [key: string]: boolean | number | string | object };
  }): returnOptionsData {
    const resultArray: string[] = [];
    const valuesArray: { [key: string]: string | number }[] = [];
    if (data.where === undefined)
      return {
        queryString: "",
        queryValues: [],
      };
    if (typeof data.where !== "object") {
      console.error("The where clausse must be an object");
      return {
        queryString: "",
        queryValues: [],
      };
    }
    if ("neq" in data.where) {
      const notEqualCondition = (
        data.where as {
          neq: InputData["or"];
        }
      ).neq;
      const result = this.notEquals(notEqualCondition);
      resultArray.push(result.queryString);
      valuesArray.push(...result.queryValues);
    } else if ("gt" in data.where) {
      const greaterThanCondition = (
        data.where as {
          gt: InputData["or"];
        }
      ).gt;
      const result = this.greaterThanOrEqual(greaterThanCondition);
      resultArray.push(result.queryString);
      valuesArray.push(...result.queryValues);
    } else if ("lt" in data.where) {
      const lessThanCondition = (
        data.where as {
          lt: InputData["or"];
        }
      ).lt;
      const result = this.lessThan(lessThanCondition);
      resultArray.push(result.queryString);
      valuesArray.push(...result.queryValues);
    } else if ("gte" in data.where) {
      const greaterThanOrEqualCondition = (
        data.where as {
          gte: InputData["or"];
        }
      ).gte;
      const result = this.greaterThanOrEqual(greaterThanOrEqualCondition);
      resultArray.push(result.queryString);
      valuesArray.push(...result.queryValues);
    } else if ("lte" in data.where) {
      const lessThanOrEqualCondition = (
        data.where as {
          lte: InputData["or"];
        }
      ).lte;
      const result = this.lessThanOrEqual(lessThanOrEqualCondition);
      resultArray.push(result.queryString);
      valuesArray.push(...result.queryValues);
    } else if ("or" in data.where) {
      const orCondition = (
        data.where as {
          or: InputData["or"];
        }
      ).or;
      const result = this.or(orCondition);
      resultArray.push(result.queryString);
      valuesArray.push(...result.queryValues);
    } else if ("in" in data.where) {
      const inCondition = (
        data.where as {
          in: Array<string & Array<string>>;
        }
      ).in;
      const result = this.in(inCondition);
      resultArray.push(result.queryString);
      valuesArray.push(...result.queryValues);
    } else if ("notBetween" in data.where) {
      const notBetweenCondition = (
        data.where as {
          notBetween: Array<string & Array<string>>;
        }
      ).notBetween;
      const result = this.notBetween(notBetweenCondition);
      resultArray.push(result.queryString);
      valuesArray.push(...result.queryValues);
    } else if ("notIn" in data.where) {
      const notInCondition = (
        data.where as {
          notIn: Array<string & Array<string>>;
        }
      ).notIn;
      const result = this.notIn(notInCondition);
      resultArray.push(result.queryString);
      valuesArray.push(...result.queryValues);
    } else if ("and" in data.where) {
      const andCondition = (
        data.where as {
          and: InputData["or"];
        }
      ).and;
      const result = this.and(andCondition);
      resultArray.push(result.queryString);
      valuesArray.push(...result.queryValues);
    } else if ("between" in data.where) {
      const betweenCondition = (
        data.where as {
          between: Array<string & Array<string>>;
        }
      ).between;
      const result = this.between(betweenCondition);
      resultArray.push(result.queryString);
      valuesArray.push(...result.queryValues);
    } else {
      for (let [columnName, columnValues] of Object.entries(data.where)) {
        if (typeof columnValues === "string") {
          columnValues = `'${columnValues}'`;
        }
        resultArray.push(` ${columnName} = ${columnValues} `);
      }
    }
    return {
      queryString: resultArray.join(" AND "),
      queryValues: valuesArray,
    };
  }
}
