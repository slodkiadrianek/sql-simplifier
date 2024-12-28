import { DataTypesInput, inputData } from "./types/dataTypes";
import { SqlSimplifier } from "./app";
interface SqlOptions {
  PK: string;
  AI: string;
  NN: string;
  UQ: string;
  setforeignkey(
    columnname: string,
    foreigntable: string,
    foreigncolumn: string,
  ): string;
  setdefault(values: string | number): string;
  setcheck(sqlexpression: string): string;
}
interface DataTypes {
  INT: string;
  FLOAT: string;
  BOOL: string;
  TEXT: string;
  DATETIME: string;
}

export class typesAndOptions {
  constructor() {}
  static get types(): DataTypes {
    return {
      INT: "INTEGER",
      FLOAT: "FLOAT",
      BOOL: "BOOLEAN",
      DATETIME: "DATETIME",
      TEXT: "TEXT",
    };
  }
  static get options(): SqlOptions {
    return {
      PK: "primary key",
      AI: "autoincrement",
      NN: "not null",
      UQ: "unique",
      setforeignkey: (
        columnname: string,
        foreigntable: string,
        foreigncolumn: string,
      ): string => {
        return `foreign key (${columnname}) references ${foreigntable}(${foreigncolumn})`;
      },
      setdefault: (values: string | number): string => {
        return `default ${values}`;
      },
      setcheck: (sqlexpression: string): string => {
        return `check (${sqlexpression})`;
      },
    };
  }
  static typeChecking(value: string | number, expectedType: string): boolean {
    switch (expectedType) {
      case "INTEGER":
        return Number.isInteger(value);
      case "FLOAT":
        return typeof value === "number";
      case "BOOLEAN":
        return value === 0 || value === 1;
      case "DATETIME":
        return typeof value === "string" && !isNaN(Date.parse(value));
      case "TEXT":
        return typeof value === "string";
      default:
        return false;
    }
  }
  static objectTypesCheckAndColumnName(
    data: inputData,
    dataTypes: DataTypesInput,
  ): void {
    for (const [columnName, columnValue] of Object.entries(data)) {
      const result = this.typeChecking(columnValue, dataTypes[columnName].type);
      const isRightName = SqlSimplifier.invalidColumnNames.includes(columnName);
      if (isRightName) {
        console.error(`You cannot use the column name ${columnName}`);
        console.timeEnd("timeApp");
        process.exit(1);
      }
      if (!result) {
        console.error(
          `The value ${columnValue} is not of type ${dataTypes[columnName].type}`,
        );
        console.timeEnd("timeApp");
        process.exit(1);
      }
    }
  }
}
