"use strict";
import { QueryOptions } from "./queryOptions";
import { QueryFunctions } from "./queryFunctions";
import { DatabaseSync } from "node:sqlite";
import { InsertAndUpdateData } from "./insertData";
import { typesAndOptions } from "./typesAndOptions";
import { Relations } from "./relations";
// type WhereClause = { [key: string]: string | number | object };
// type OrderByDirection = "ASC" | "DESC";
// type OrderByClause = Record<string, OrderByDirection>;
// type WithClause = Record<string, boolean>;

// type findType = {
//   where?: WhereClause; 
//   orderBy: OrderByClause[]; 
//   skip: number; 
//   limit: number; 
//   groupBy: string; 
//   having?: WhereClause; 
//   with: WithClause; 
// } & Omit<Record<string, boolean>, "where" | "orderBy" | "skip" | "limit" | "groupBy" | "having" | "with">;
// type updateType = {
//   skip: number;
//   limit: number; 
//   where?: WhereClause;
//   orderBy: OrderByClause[]; 
// } & Omit<Record<string, string | number>, "skip" | "limit" | "where" | "orderBy">;
// type DeleteType = {
//   skip: number;
//   limit: number; 
//   where?: WhereClause;
//   orderBy: OrderByClause[]; 
// }
type WhereClause = { [key: string]: string | number | object };
type OrderByClause = { [key: string]: "ASC" | "DESC" };
type WithClause = Record<string, boolean>;
type findType = {
  where?: WhereClause;
} & {
  [key: string]: boolean;
} & {
  orderBy?: {
    [key: string]: "ASC" | "DESC";
  }[];
} & {
  skip?: number;
} & {
  limit?: number;
} & {
  groupBy?: string;
  having?: WhereClause;
} & {
  with?: WithClause;
};
type updateType = {
  [key: string]: string | number;
} & {
  skip: number;
} & {
  limit?: number;
} & {
  where?: WhereClause;
} & {
  orderBy: OrderByClause[];
};
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
  private readonly sourceDb: DatabaseSync;
  constructor(public readonly pathToDatabase: string) {
    this.sourceDb = new DatabaseSync(pathToDatabase);
  }
  deleteMany(tableName:string, data:DeleteType):void{
    const whereQuery = QueryFunctions.buildWhere(data);
    const optionsQuery = QueryOptions.buildQueryOptions(data);
    const query = `Delete from ${tableName} ${whereQuery.queryString === "" ? "" : `WHERE ${whereQuery.queryString}`} ${optionsQuery !== "" ? optionsQuery : ""}`;
    this.sourceDb.prepare(query).all();

  }
  deleteOne(tableName:string, data: DeleteType):void {
    const whereQuery = QueryFunctions.buildWhere(data);
    const skipQuery = QueryOptions.setSkip(data.skip);
    const orderByQuery = QueryOptions.setOrderBy(data.orderBy);
    const query = `Delete from ${tableName} ${whereQuery.queryString === "" ? "" : `WHERE ${whereQuery.queryString}`} ${orderByQuery !== "" ? orderByQuery : ""} LIMIT 1 ${skipQuery !== undefined ? skipQuery : ""}`;
    this.sourceDb.prepare(query).all();
  }
  updateOne(tableName: string, data: updateType): void {
    const availableColumns: string[] = Object.keys(this[tableName].columns);
    const result = QueryFunctions.findMatchingColumns(
      availableColumns,
      data,
    )[0];
    const whereQuery = QueryFunctions.buildWhere(data);
    const skipQuery = QueryOptions.setSkip(data.skip);
    const orderByQuery = QueryOptions.setOrderBy(data.orderBy);
    const query = `UPDATE ${tableName} SET ${result}=${typeof data[result] === "string" ? `'${data[result]}'` : data[result]} ${whereQuery.queryString === "" ? "" : `WHERE ${whereQuery.queryString}`} ${orderByQuery !== "" ? orderByQuery : ""} LIMIT 1 ${skipQuery !== undefined ? skipQuery : ""}`;
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
  insertOne(tableName: string, data: Record<string, string| number>): void {
    const dataTypes = this[tableName].columns;
    const result = InsertAndUpdateData.insertOne(tableName, data, dataTypes);
    this.sourceDb.prepare(result.query).run(...result.values);
  }
  insertMany(
    tableName: string,
    data: Array<Record<string, string | number>>,
  ): void {
    const dataTypes = this[tableName].columns;
    const result = InsertAndUpdateData.insertMany(tableName, data, dataTypes);
    this.sourceDb.prepare(result.query).run(...result.values);
  }

  findMany( data: findType): object {
    console.log(this, data)
    const tableName = this.tableName;
    let joinQuery:string = '';
    let groupByQuery:string = '';
    let availableColumns;
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
    let selectQuery = QueryFunctions.buildSelect(data, availableColumns);
    selectQuery = selectQuery.slice(0, -3);

    const havingQuery = QueryFunctions.buildHaving(data);
    const whereQuery = QueryFunctions.buildWhere(data);
    if(typeof data.limit === 'number' && typeof data.skip === 'number' && typeof data.orderBy === 'object'){
      for(const el of data.orderBy){
        for(const columnValue of Object.values(el)){
            if( columnValue !== 'ASC'){
                return
            }
            if(columnValue !== 'DESC'){
              return
            }
          }
        }
      }
      const values = {
        limit: data.limit,
        skip: data.skip,
        orderBy: data.orderBy
      }
      const optionsQuery = QueryOptions.buildQueryOptions(values);
    if(typeof data.groupBy === 'string'){
      groupByQuery = QueryOptions.setGroupBy(data.groupBy);
    }
    if( typeof data.with === 'object' && data.with !== null ){
       joinQuery = Relations.find(tableName, data.with, this);
    }
    const query = `SELECT ${selectQuery} FROM ${tableName} ${joinQuery !== "" || joinQuery !== undefined ? joinQuery : ""} ${whereQuery.queryString === "" ? "" : `WHERE ${whereQuery.queryString}`}${data.groupBy !== undefined && data.groupBy !== "" ? groupByQuery : ""} ${havingQuery.queryString !== "" && data.groupBy !== undefined && data.groupBy !== "" ? havingQuery.queryString : ""} ${optionsQuery !== "" ? optionsQuery : ""}`;
    const dataTypes = this.columns;
    const dataTypesToCheck = [
      ...whereQuery.queryValues,
      ...havingQuery.queryValues,
    ];
    for (const el of dataTypesToCheck) {
      typesAndOptions.objectTypesCheckAndColumnName(el, dataTypes);
    }
    console.log(query, this.prepare);
    const result = this.prepare(query).all();
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
    columns: Record<string, { type: string; tableOptions: string }>,
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
    findMany: (data: findType) => object;
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
      query += `${columnName} ${columnProperties.type} ${splittedOptions.join(" ")}, `
    }
    query += foreignKeys.join(",");
    if (foreignKeys.length > 0) {
      query += "  ";
    }
    query = query.slice(0, -2) + ")";
    console.log(query);
    console.log(this.sourceDb.prepare)
    this.sourceDb.exec(query);
    this[tableName] = {
      prepare: this.sourceDb.prepare,
      tableName,
      columns: {
        ...columns,
      },
      insertOne: this.insertOne,
      insertMany: this.insertMany,
      findMany: this.findMany,
      findOne: this.findOne,
      updateOne: this.updateOne,
      updateMany: this.updateMany,
    };
    this[tableName].findMany.bind(this[tableName])
    this[tableName].findOne.bind(this[tableName])
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
