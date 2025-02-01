"use strict";
import { whereHavingType, returnOptionsData } from "./queryFunctions.js";
import { orderByType } from "./queryOptions.js";
import { QueryOptions } from "./queryOptions.js";
import { QueryFunctions } from "./queryFunctions.js";
import { InsertAndUpdateData } from "./insertData.js";
import { typesAndOptions } from "./typesAndOptions.js";
import { Relations } from "./relations.js";
import { DatabaseSync } from "node:sqlite";

type WhereClause = { [key: string]: string | number | object };
type OrderByClause = { [key: string]: "ASC" | "DESC" };
type WithClause = Record<string, boolean>;

type findType = {
  select?: {
    [key: string]: boolean;
  };
  where?: WhereClause;
  orderBy?: OrderByClause[];
  skip?: number;
  limit?: number;
  groupBy?: string;
  having?: WhereClause;
  with?: WithClause;
};

type DeleteType = {
  skip?: number;
} & {
  limit?: number;
} & {
  where?: WhereClause;
} & {
  orderBy?: OrderByClause[];
};

type UpdateType = {
  [key: string]: string | number;
} & DeleteType;

export type InputDataCondition =
  | { and: Array<WhereClause> }
  | { or: Array<WhereClause> }
  | { between: [string, [number | string, number | string]] }
  | { like: Record<string, string> }
  | { notLike: Record<string, string> }
  | { in: [string, Array<string | number>] }
  | { notIn: [string, Array<string | number>] }
  | { notBetween: [string, [number | string, number | string]] }
  | WhereClause;

export class SqlSimplifier {
  [key: string]: any;
  static readonly invalidColumnNames: ReadonlyArray<string> = [
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
  static database: DatabaseSync;
  constructor(public readonly pathToDatabase: string) {
    SqlSimplifier.database = new DatabaseSync(pathToDatabase);
  }

  // Add type compatibility

  // Add type compatibility
  delete(data: DeleteType): string {
    let skipQuery: string = "";
    const whereQuery = QueryFunctions.buildWhere(data);
    if (typeof data.skip === "number") {
      skipQuery = QueryOptions.setSkip(data.skip);
    }
    let orderByQuery = "";
    if (typeof data.orderBy === "object") {
      for (const el of data.orderBy) {
        for (const columnValue of Object.values(el)) {
          if (columnValue !== "ASC" && columnValue !== "DESC") {
            console.error(`Invalid order by direction ${columnValue}`);
            return process.exit(1);
          }
        }
      }
      orderByQuery = QueryOptions.setOrderBy(data.orderBy);
    }
    const query = `DELETE FROM ${this.tableName} ${
      whereQuery.queryString === "" ? "" : `WHERE ${whereQuery.queryString}`
    } ${orderByQuery !== "" ? orderByQuery : ""}  ${
      skipQuery !== undefined ? skipQuery : ""
    }`;
    SqlSimplifier.database.prepare(query).all();
    return "Deleted Succesfully";
  }

  update(data: UpdateType): string {
    let skipQuery: string = "";
    const availableColumns: string[] = Object.keys(this.columns);
    const result = QueryFunctions.findMatchingColumns(
      availableColumns,
      data,
    )[0];
    const whereQuery = QueryFunctions.buildWhere(data);
    if (typeof data.skip === "number") {
      skipQuery = QueryOptions.setSkip(data.skip);
    }

    let orderByQuery = "";
    if (typeof data.orderBy === "object") {
      for (const el of data.orderBy) {
        for (const columnValue of Object.values(el)) {
          if (columnValue !== "ASC" && columnValue !== "DESC") {
            console.error(`Invalid order by direction ${columnValue}`);
            return process.exit(1);
          }
        }
      }
      orderByQuery = QueryOptions.setOrderBy(data.orderBy);
    }
    const query = `UPDATE ${this.tableName} SET ${result}=${
      typeof data[result] === "string" ? `'${data[result]}'` : data[result]
    } ${
      whereQuery.queryString === "" ? "" : `WHERE ${whereQuery.queryString}`
    } ${orderByQuery !== "" ? orderByQuery : ""}  ${
      skipQuery !== undefined ? skipQuery : ""
    }`;
    console.log(query);

    SqlSimplifier.database.prepare(query).all();
    return "Updated Succesfully";
  }

  insertOne(data: Record<string, string | number>): string {
    const dataTypes = this.columns;
    typesAndOptions.objectTypesCheckAndColumnName(
      data as { [key: string]: string | number },
      dataTypes,
    );
    const result = InsertAndUpdateData.insertOne(this.tableName, data);
    console.log(result.query, result.values);
    SqlSimplifier.database.prepare(result.query).run(...result.values);
    return "Data inserted";
  }

  insertMany(data: Array<Record<string, string | number>>): string {
    const dataTypes = this.columns;
    for (const el of data) {
      typesAndOptions.objectTypesCheckAndColumnName(
        el as { [key: string]: string | number },
        dataTypes,
      );
    }
    const result = InsertAndUpdateData.insertMany(this.tableName, data);
    SqlSimplifier.database.prepare(result.query).run(...result.values);
    return "Data inserted";
  }

  findMany(data: findType): object {
    const tableName = this.tableName;
    let joinQuery: string = "";
    let groupByQuery: string = "";
    let availableColumns: string[];
    let optionsQuery: string = "";
    let selectQuery: string = "";
    let havingQuery: returnOptionsData = { queryString: "", queryValues: [] };
    if (data.with !== undefined) {
      availableColumns = Object.keys(this.columns);
      for (const [key, value] of Object.entries(data.with)) {
        if (value) {
          const keys = Object.keys(this[key].columns);
          availableColumns.push(...keys);
        }
      }
    } else {
      availableColumns = Object.keys(this.columns);
    }
    if (typeof data.select === "object") {
      for (const values of Object.values(data.select)) {
        if (typeof values !== "boolean") {
          console.error("Wrond type provided, it must be a boolean");
          process.exit(1);
        }
      }
      selectQuery = QueryFunctions.buildSelect(data.select, availableColumns);
    } else {
      selectQuery = "*   ";
    }
    selectQuery = selectQuery.slice(0, -3);

    if (typeof data.groupBy === "string" && data.groupBy !== "") {
      for (const columnValue of Object.values(data.groupBy)) {
        if (
          typeof columnValue !== "object" &&
          typeof columnValue !== "number" &&
          typeof columnValue !== "string"
        ) {
          console.error(`Invalid group by column ${columnValue}`);
          return process.exit(1);
        }
        const dataToBuildHaving: {
          groupBy: string;
          having?: whereHavingType;
        } = {
          groupBy: data.groupBy,
          having: data.having,
        };
        havingQuery = QueryFunctions.buildHaving(dataToBuildHaving);
      }
    }

    const whereQuery = QueryFunctions.buildWhere(data);

    if (
      typeof data.limit === "number" &&
      typeof data.skip === "number" &&
      typeof data.orderBy === "object"
    ) {
      for (const el of data.orderBy) {
        for (const columnValue of Object.values(el)) {
          if (columnValue !== "ASC" && columnValue !== "DESC") {
            console.error(`Invalid order by direction ${columnValue}`);
            return process.exit(1);
          }
        }
      }
      const dataToBuildOptions: {
        limit: number;
        skip: number;
        orderBy: orderByType;
      } = {
        limit: data.limit,
        skip: data.skip,
        orderBy: data.orderBy,
      };
      optionsQuery = QueryOptions.buildQueryOptions(dataToBuildOptions);
    }

    if (typeof data.groupBy === "string") {
      groupByQuery = QueryOptions.setGroupBy(data.groupBy);
    }

    if (typeof data.with === "object" && data.with !== null) {
      joinQuery = Relations.find(tableName, data.with, this);
    }

    const query = `SELECT ${selectQuery} FROM ${tableName} ${
      joinQuery ? joinQuery : ""
    } ${whereQuery.queryString ? `WHERE ${whereQuery.queryString}` : ""}${
      data.groupBy ? groupByQuery : ""
    } ${
      havingQuery.queryString && data.groupBy && data.groupBy !== ""
        ? havingQuery.queryString
        : ""
    } ${optionsQuery ? optionsQuery : ""}`;

    const dataTypes = this.columns;
    const dataTypesToCheck = [
      ...whereQuery.queryValues,
      ...havingQuery.queryValues,
    ];
    for (const el of dataTypesToCheck) {
      typesAndOptions.objectTypesCheckAndColumnName(el, dataTypes);
    }
    console.log(query);
    const result = SqlSimplifier.database.prepare(query).all();
    return result;
  }

  findOne(data: findType): object {
    let availableColumns: string[];
    let skipQuery: string = "";
    let orderByQuery: string = "";
    let groupByQuery: string = "";
    let joinQuery: string = "";
    let selectQuery: string = "";
    let havingQuery: returnOptionsData = { queryString: "", queryValues: [] };
    if (data.with !== undefined) {
      availableColumns = Object.keys(this.columns);
      for (const [key, value] of Object.entries(data.with)) {
        if (value) {
          const keys = Object.keys(this[key].columns);
          availableColumns.push(...keys);
        }
      }
    } else {
      availableColumns = Object.keys(this.columns);
    }
    if (typeof data.select === "object") {
      for (const values of Object.values(data.select)) {
        if (typeof values !== "boolean") {
          console.error("Wrond type provided, it must be a boolean");
          process.exit(1);
        }
      }
      selectQuery = QueryFunctions.buildSelect(data.select, availableColumns);
    }

    selectQuery = selectQuery.slice(0, -3);
    if (typeof data.groupBy === "string" && data.groupBy !== "") {
      for (const columnValue of Object.values(data.groupBy)) {
        if (
          typeof columnValue !== "object" &&
          typeof columnValue !== "number" &&
          typeof columnValue !== "string"
        ) {
          console.error(`Invalid group by column ${columnValue}`);
          return process.exit(1);
        }
        const dataToBuildHaving: {
          groupBy: string;
          having?: whereHavingType;
        } = {
          groupBy: data.groupBy,
          having: data.having,
        };
        havingQuery = QueryFunctions.buildHaving(dataToBuildHaving);
      }
    }
    const whereQuery = QueryFunctions.buildWhere(data);
    if (typeof data.groupBy === "string") {
      groupByQuery = QueryOptions.setGroupBy(data.groupBy);
    }
    if (typeof data.skip === "number") {
      skipQuery = QueryOptions.setSkip(data.skip);
    }
    if (typeof data.orderBy === "object") {
      for (const el of data.orderBy) {
        for (const columnValue of Object.values(el)) {
          if (columnValue !== "ASC" && columnValue !== "DESC") {
            console.error(`Invalid order by direction ${columnValue}`);
            return process.exit(1);
          }
        }
      }
      orderByQuery = QueryOptions.setOrderBy(data.orderBy);
    }
    if (typeof data.with === "object") {
      for (const columnValue of Object.values(data.with)) {
        if (typeof columnValue === "boolean") {
          joinQuery = Relations.find(this.tableName, data.with, this);
        }
      }
    }
    const query = `SELECT ${selectQuery} FROM ${this.tableName} ${
      joinQuery ? joinQuery : ""
    } ${whereQuery.queryString ? `WHERE ${whereQuery.queryString}` : ""}${
      data.groupBy ? groupByQuery : ""
    } ${
      havingQuery.queryString && data.groupBy ? havingQuery.queryString : ""
    } ${orderByQuery ? orderByQuery : ""} LIMIT 1 ${
      skipQuery !== undefined ? skipQuery : ""
    }`;

    const dataTypes = this.columns;
    const dataTypesToCheck = [
      ...whereQuery.queryValues,
      ...havingQuery.queryValues,
    ];
    for (const el of dataTypesToCheck) {
      typesAndOptions.objectTypesCheckAndColumnName(el, dataTypes);
    }

    console.log(query);
    const result = SqlSimplifier.database.prepare(query).all();
    return result;
  }

  createTable(
    tableName: string,
    columns: Record<string, { type: string; tableOptions: string }>,
  ): {
    columns: { type: string; tableOptions: string };
    insertOne: (data: { [key: string]: string | number }) => string;
    insertMany: (data: { [key: string]: string | number }[]) => string;
    findMany: (data: findType) => object;
    findOne: (data: findType) => object;
    update: (data: UpdateType) => string;
    delete: (data: DeleteType) => string;
  } {
    let query: string = `CREATE TABLE IF NOT EXISTS ${tableName} (`;
    const foreignKeys = [];
    for (const [columnName, columnProperties] of Object.entries(columns)) {
      if (SqlSimplifier.invalidColumnNames.includes(columnName)) {
        console.error(`You cannot use the column name ${columnName}`);
        return process.exit(1);
      }
      const splittedOptions: string[] =
        columnProperties.tableOptions.split("?");
      console.log(splittedOptions);

      if (columnProperties.tableOptions.includes("Foreign")) {
        for (let i = 0; i < splittedOptions.length; i++) {
          if (splittedOptions[i].includes("Foreign")) {
            foreignKeys.push(splittedOptions[i]);
            splittedOptions.splice(i, 1);
            break;
          }
        }
      }
      query += `${columnName} ${columnProperties.type} ${splittedOptions.join(
        " ",
      )}, `;
    }
    query += foreignKeys.join(",");
    if (foreignKeys.length > 0) {
      query += "  ";
    }
    query = query.slice(0, -2) + ")";
    console.log(query);

    SqlSimplifier.database.exec(query);
    this[tableName] = {
      tableName,
      columns: {
        ...columns,
      },
      insertOne: this.insertOne,
      insertMany: this.insertMany,
      findMany: this.findMany,
      findOne: this.findOne,
      update: this.update,
      delete: this.delete,
    };

    this[tableName].findMany.bind(this[tableName]);
    this[tableName].findOne.bind(this[tableName]);
    this[tableName].insertOne.bind(this[tableName]);
    this[tableName].insertMany.bind(this[tableName]);
    this[tableName].update.bind(this[tableName]);
    this[tableName].delete.bind(this[tableName]);
    return this[tableName];
  }

  showTableSchema(tableName: string): unknown[] {
    const tableInfoQuery = `
              PRAGMA table_info(${tableName})
              `;
    const result = SqlSimplifier.database.prepare(tableInfoQuery);
    return result.all();
  }
}
