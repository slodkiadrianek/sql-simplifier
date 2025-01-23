import { inputData } from "./types/dataTypes.js";
interface returnInsertData {
  query: string;
  values: Array<string | number>;
}
export class InsertAndUpdateData {
  static insertOne(tableName: string, data: inputData): returnInsertData {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const columnsString = columns.join(", ");
    const valuesString = values.map(() => "?").join(", ");
    const query = `INSERT INTO ${tableName}(${columnsString}) VALUES(${valuesString})`;
    return { query, values };
  }
  static insertMany(tableName: string, data: inputData[]): returnInsertData {
    const values: Array<string | number> = [];
    for (const el of data) {
      values.push(...Object.values(el));
    }
    const columns: Array<string> = Object.keys(data[0]);
    const columnString = columns.join(", ");
    const columnsToProvide = [];
    for (let i = 0; i < data.length; i++) {
      columnsToProvide.push(`(${columns.map(() => "?").join(", ")})`);
    }
    const query = `INSERT INTO ${tableName}(${columnString}) VALUES${columnsToProvide.join(
      ", ",
    )}`;
    return { query, values };
  }
}
