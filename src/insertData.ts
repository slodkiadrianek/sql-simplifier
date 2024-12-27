import { typesAndOptions } from "./typesAndOptions";
export class InsertAndUpdateData {
  static insertOne(
    tableName: string,
    data: { [key: string]: string | number },
    dataTypes: { [key: string]: { type: string; tableOptions: string } },
  ) {
    typesAndOptions.objectTypesCheckAndColumnName(
      data as { [key: string]: string | number },
      dataTypes,
    );
    const columns = Object.keys(data);
    const values = Object.values(data);
    const columnsString = columns.join(", ");
    const valuesString = values.map(() => "?").join(", ");
    const query = `INSERT INTO ${tableName}(${columnsString}) VALUES(${valuesString})`;
    return { query, values };
  }
  static insertMany(
    tableName: string,
    data: { [key: string]: string | number }[],
    dataTypes: { [key: string]: { type: string; tableOptions: string } },
  ) {
    const values: Array<string | number> = [];
    for (const el of data) {
      typesAndOptions.objectTypesCheckAndColumnName(el, dataTypes);
      values.push(...Object.values(el));
    }
    const columns: Array<string> = Object.keys(data[0]);
    const columnString = columns.join(", ");
    const columnsToProvide = [];
    for (let i = 0; i < data.length; i++) {
      columnsToProvide.push(`(${columns.map(() => "?").join(", ")})`);
    }
    const query = `INSERT INTO ${tableName}(${columnString}) VALUES${columnsToProvide.join(", ")}`;
    return { query, values };
  }
  // static updateOne(
  //   tableName: string,
  //   data: { [key: string]: string | number },
  //   dataTypes: { [key: string]: { type: string; tableOptions: string } },
  //   where: { [key: string]: string | number },
  // ) {
  //   typesAndOptions.objectTypesCheckAndColumnName(data, dataTypes);
  //   typesAndOptions.objectTypesCheckAndColumnName(where, dataTypes);
  //   const columns = Object.keys(data);
  //   const values = Object.values(data);
  //   const whereColumns = Object.keys(where);
  //   const whereValues = Object.values(where);
  //   const columnsString = columns.join(" = ?, ");
  //   const whereString = whereColumns.join(" = ? AND ") + " = ?";
  //   const query = `UPDATE ${tableName} SET ${columnsString} = ? WHERE ${whereString}`;
  //   return { query, values: [...values, ...whereValues] };
  // }
}
