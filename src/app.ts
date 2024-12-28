"use strict";
import { QueryFunctions } from "./queryFunctions";
import { DatabaseSync } from "node:sqlite";
import { InsertAndUpdateData } from "./insertData";
import { typesAndOptions } from "./typesAndOptions";
export type InputData = {
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

  findOne(
    tableName: string,
    data: {
      where?: boolean | { [key: string]: boolean | object };
    },
  ): object {
    const availableColumns = Object.keys(this[tableName].columns);
    let selectQuery = QueryFunctions.buildSelect(data, availableColumns);
    let whereQuery = QueryFunctions.buildWhere(data);
    selectQuery = selectQuery.slice(0, -3);

    const query = `SELECT ${selectQuery} FROM ${tableName} ${whereQuery.queryString === "" ? "" : `WHERE ${whereQuery.queryString}`} `;
    const dataTypes = this[tableName].columns;
    for (const el of whereQuery.queryValues) {
      typesAndOptions.objectTypesCheckAndColumnName(el, dataTypes);
    }
    console.log(query, ...whereQuery.queryValues);
    const result = this.sourceDb.prepare(query).run();
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
