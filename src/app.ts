"use strict";
import { QueryOptions } from "./queryOptions";
import { QueryFunctions } from "./queryFunctions";
import { DatabaseSync } from "node:sqlite";
import { InsertAndUpdateData } from "./insertData";
import { typesAndOptions } from "./typesAndOptions";
import { Relations } from "./relations";
type WhereClause = { [key: string]: string | number | object };
type OrderByClause = { [key: string]: "ASC" | "DESC" };
type WithClause = Record<string, boolean>;
type findType = {
  where?: WhereClause; // Filtering conditions
  orderBy: OrderByClause[]; // Sorting order
  skip: number; // Number of records to skip
  limit: number; // Maximum number of records to fetch
  groupBy: string; // Grouping criteria
  having?: WhereClause; // Post-grouping filter
  with: WithClause; // Additional related data to include
} & Record<string, boolean>;
type updateType = {
  // Fields to update
  [key: string]: string | number; // Explicitly define update fields
  skip: number; // Number of records to skip
  limit: number; // Maximum number of records to update
  where?: WhereClause; // Filtering conditions
  orderBy: OrderByClause[]; // Sorting order for updates
};
//
// type findType = {
//   where?: WhereClause;
// } & {
//   [key: string]: boolean;
// } & {
//   orderBy: {
//     [key: string]: "ASC" | "DESC";
//   }[];
// } & {
//   skip: number;
// } & {
//   limit: number;
// } & {
//   groupBy: string;
//   having?: WhereClause;
// } & {
//   with: WithClause;
// };
// type updateType = {
//   [key: string]: string | number;
// } & {
//   skip: number;
// } & {
//   limit?: number;
// } & {
//   where?: WhereClause;
// } & {
//   orderBy: OrderByClause[];
// };
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
  updateOne(tableName: string, data: updateType): void {
    const availableColumns: string[] = Object.keys(this[tableName].columns);
    const result = QueryFunctions.findMatchingColumns(
      availableColumns,
      data,
    )[0];
    const whereQuery = QueryFunctions.buildWhere(data);
    const optionsQuery = QueryOptions.buildQueryOptions(data);
    const query = `UPDATE ${tableName} SET ${result}=${typeof data[result] === "string" ? `'${data[result]}'` : data[result]} ${whereQuery.queryString === "" ? "" : `WHERE ${whereQuery.queryString}`} ${optionsQuery !== "" ? optionsQuery : ""}`;
    console.log(query);
    this.sourceDb.prepare(query).all();
  }
  updateMany(tableName: string, data: updateType): void {
    const availableColumns: string[] = Object.keys(this[tableName].columns);
    const result = QueryFunctions.findMatchingColumns(availableColumns, data);
    const whereQuery = QueryFunctions.buildWhere(data);
    const optionsQuery = QueryOptions.buildQueryOptions(data);
    const columnsToReplaceWithValues: string[] = [];
    for (const el of result) {
      columnsToReplaceWithValues.push(
        `${el}=${typeof data[el] === "string" ? `'${data[el]}'` : data[el]}`,
      );
    }
    const query = `UPDATE ${tableName} SET ${columnsToReplaceWithValues.join(", ")}  ${whereQuery.queryString === "" ? "" : `WHERE ${whereQuery.queryString}`} ${optionsQuery !== "" ? optionsQuery : ""}`;
    this.sourceDb.prepare(query).all();
  }
  insertOne(tableName: string, data: { [key: string]: string | number }): void {
    const dataTypes = this[tableName].columns;
    const result = InsertAndUpdateData.insertOne(tableName, data, dataTypes);
    this.sourceDb.prepare(result.query).run(...result.values);
  }
  insertMany(
    tableName: string,
    data: { [key: string]: string | number }[],
  ): void {
    const dataTypes = this[tableName].columns;
    const result = InsertAndUpdateData.insertMany(tableName, data, dataTypes);
    this.sourceDb.prepare(result.query).run(...result.values);
  }

  findMany(tableName: string, data: findType): object {
    let availableColumns;
    if (data.with !== undefined) {
      availableColumns = Object.keys(this[tableName].columns);
      for (const [key, value] of Object.entries(data.with)) {
        if (value) {
          const keys = Object.keys(this[key].columns);
          availableColumns.push(...keys);
        }
      }
    } else {
      availableColumns = Object.keys(this[tableName].columns);
    }
    let selectQuery = QueryFunctions.buildSelect(data, availableColumns);
    selectQuery = selectQuery.slice(0, -3);
    const havingQuery = QueryFunctions.buildHaving(data);
    const whereQuery = QueryFunctions.buildWhere(data);
    const optionsQuery = QueryOptions.buildQueryOptions(data);
    const groupByQuery = QueryOptions.setGroupBy(data.groupBy);
    const joinQuery = Relations.find(tableName, data.with, this[tableName]);
    const query = `SELECT ${selectQuery} FROM ${tableName} ${joinQuery !== "" || joinQuery !== undefined ? joinQuery : ""} ${whereQuery.queryString === "" ? "" : `WHERE ${whereQuery.queryString}`}${data.groupBy !== undefined && data.groupBy !== "" ? groupByQuery : ""} ${havingQuery.queryString !== "" && data.groupBy !== undefined && data.groupBy !== "" ? havingQuery.queryString : ""} ${optionsQuery !== "" ? optionsQuery : ""}`;
    const dataTypes = this[tableName].columns;
    const dataTypesToCheck = [
      ...whereQuery.queryValues,
      ...havingQuery.queryValues,
    ];
    for (const el of dataTypesToCheck) {
      typesAndOptions.objectTypesCheckAndColumnName(el, dataTypes);
    }
    console.log(query);
    const result = this.sourceDb.prepare(query).all();
    return result;
  }
  findOne(tableName: string, data: findType): object {
    let availableColumns;
    if (data.with !== undefined) {
      availableColumns = Object.keys(this[tableName].columns);
      for (const [key, value] of Object.entries(data.with)) {
        if (value) {
          const keys = Object.keys(this[key].columns);
          availableColumns.push(...keys);
        }
      }
    } else {
      availableColumns = Object.keys(this[tableName].columns);
    }
    let selectQuery = QueryFunctions.buildSelect(data, availableColumns);
    selectQuery = selectQuery.slice(0, -3);
    const havingQuery = QueryFunctions.buildHaving(data);
    const whereQuery = QueryFunctions.buildWhere(data);
    const groupByQuery = QueryOptions.setGroupBy(data.groupBy);
    const skipQuery = QueryOptions.setSkip(data.skip);
    const orderByQuery = QueryOptions.setOrderBy(data.orderBy);
    const joinQuery = Relations.find(tableName, data.with, this[tableName]);
    const query = `SELECT ${selectQuery} FROM ${tableName} ${joinQuery !== "" || joinQuery !== undefined ? joinQuery : ""} ${whereQuery.queryString === "" ? "" : `WHERE ${whereQuery.queryString}`}${data.groupBy !== undefined && data.groupBy !== "" ? groupByQuery : ""} ${havingQuery.queryString !== "" && data.groupBy !== undefined && data.groupBy !== "" ? havingQuery.queryString : ""} ${orderByQuery !== "" ? orderByQuery : ""} LIMIT 1 ${skipQuery !== undefined ? skipQuery : ""}`;
    const dataTypes = this[tableName].columns;
    const dataTypesToCheck = [
      ...whereQuery.queryValues,
      ...havingQuery.queryValues,
    ];
    for (const el of dataTypesToCheck) {
      typesAndOptions.objectTypesCheckAndColumnName(el, dataTypes);
    }
    console.log(query);
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
      findOne: this.findOne.bind(this, tableName),
      updateOne: this.updateOne.bind(this, tableName),
      updateMany: this.updateMany.bind(this, tableName),
    };
    return this[tableName];
  }

  showTableSchema(tableName: string): unknown[] {
    const tableInfoQuery = `
        PRAGMA table_info(${tableName})
        `;
    const result = this.sourceDb.prepare(tableInfoQuery);
    return result.all();
  }
}
