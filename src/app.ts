"use strict";
import { QueryOptions } from "./queryOptions";
import { QueryFunctions } from "./queryFunctions";
import { DatabaseSync } from "node:sqlite";
import { InsertAndUpdateData } from "./insertData";
import { typesAndOptions } from "./typesAndOptions";
type findType = {
  where?: {
    [key: string]: string | number | object;
  };
} & {
  [key: string]: boolean;
} & {
  orderBy: {
    [key: string]: "ASC" | "DESC";
  }[];
} & {
  skip: number;
} & {
  limit: number;
} & {
  groupBy: string;
  having?: {
    [key: string]: string | number | object;
  };
};
export type InputData = {
  or: Array<
    | { and: Array<{ [key: string]: any }> }
    | { or: Array<{ [key: string]: any }> }
    | { [key: string]: any }
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
    "like",
    "in",
    "notIn",
    "orderBy",
    "groupBy",
    "having",
    "limit",
    "notLike",
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

  findMany(tableName: string, data: findType): object {
    const availableColumns = Object.keys(this[tableName].columns);
    let selectQuery = QueryFunctions.buildSelect(data, availableColumns);
    selectQuery = selectQuery.slice(0, -3);
    const havingQuery = QueryFunctions.buildHaving(data);
    const whereQuery = QueryFunctions.buildWhere(data);
    const optionsQuery = QueryOptions.buildQueryOptions(data);
    const groupByQuery = QueryOptions.setGroupBy(data.groupBy);
    const query = `SELECT ${selectQuery} FROM ${tableName} ${whereQuery.queryString === "" ? "" : `WHERE ${whereQuery.queryString}`}${data.groupBy !== undefined && data.groupBy !== "" ? groupByQuery : ""} ${havingQuery.queryString !== "" && data.groupBy !== undefined && data.groupBy !== "" ? havingQuery.queryString : ""} ${optionsQuery !== "" ? optionsQuery : ""}`;
    const dataTypes = this[tableName].columns;
    const dataTypesToCheck = [
      ...whereQuery.queryValues,
      ...havingQuery.queryValues,
    ];
    for (const el of dataTypesToCheck) {
      typesAndOptions.objectTypesCheckAndColumnName(el, dataTypes);
    }
    const result = this.sourceDb.prepare(query).all();
    return result;
  }

  createTable(
    tableName: string,
    columns: { [key: string]: { type: string; tableOptions: string } },
  ): {
    columns: { type: string; tableOptions: string };
    insertOne: (
      tableName: string,
      data: { [key: string]: string | number },
    ) => void;
    insertMany: (
      tableName: string,
      data: { [key: string]: string | number }[],
    ) => void;
    findMany: (tableName: string, data: findType) => object;
  } {
    let query: string = `CREATE TABLE IF NOT EXISTS ${tableName} (`;
    const foreignKeys = [];
    for (const [columnName, columnProperties] of Object.entries(columns)) {
      if (SqlSimplifier.invalidColumnNames.includes(columnName)) {
        console.error(`You cannot use the column name ${columnName}`);
        return process.exit(1);
      }
      const splittedOptions: string[] =
        columnProperties.tableOptions.split("!");
      if (columnProperties.tableOptions.includes("Foreign")) {
        for (let i = 0; i < splittedOptions.length; i++) {
          if (splittedOptions[i].includes("Foreign")) {
            foreignKeys.push(splittedOptions[i]);
            splittedOptions.splice(i, 1);
            break;
          }
        }
      }
      query +=
        columnName +
        " " +
        columnProperties.type +
        " " +
        splittedOptions.join(" ") +
        ", ";
    }
    query += foreignKeys.join(",");
    if (foreignKeys.length > 0) {
      query += "  ";
    }
    query = query.slice(0, -2) + ")";
    console.log(query);
    this.sourceDb.exec(query);
    this[tableName] = {
      columns: {
        ...columns,
      },
      insertOne: this.insertOne.bind(this, tableName),
      insertMany: this.insertMany.bind(this, tableName),
      findMany: this.findMany.bind(this, tableName),
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
