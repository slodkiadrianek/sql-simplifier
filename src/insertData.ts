import { SqlSimplifier } from "./app";

export class InsertAndUpdateData extends SqlSimplifier {
  constructor(
    pathToDatabase: string,
    public tableName: string,
    public data: { [key: string]: string | number }[],
  ) {
    super(pathToDatabase);
  }

  insertData(
    tableName: string,
    dataProvided: { [key: string]: string | number }[],
  ): { query: string; values: Array<string | number> } {
    const values: Array<string | number> = [];
    for (const el of dataProvided) {
      for (const [columnName, columnValue] of Object.entries(el)) {
        const result = this.typeChecking(
          columnValue,
          this[tableName].columns[columnName].type,
        );
        const rightName = this.invalidColumnNames.includes(columnName);
        if (rightName) {
          console.error(`You cannot use the column name ${columnName}`);
          console.timeEnd("timeApp");
          process.exit(1);
        }
        if (!result) {
          console.error(
            `The value ${columnValue} is not of type ${this[tableName].columns[columnName].type}`,
          );
          console.timeEnd("timeApp");
          process.exit(1);
        }
      }

      values.push(...Object.values(el));
    }
    const columns: Array<string> = Object.keys(dataProvided[0]);
    const columnString = columns.join(", ");
    const columnsToProvide = [];
    for (let i = 0; i < dataProvided.length; i++) {
      columnsToProvide.push(`(${columns.map(() => "?").join(", ")})`);
    }

    let query = `INSERT INTO ${tableName}(${columnString}) VALUES${columnsToProvide.join(", ")}`;
    return { query, values };
  }
}
