import { DataTypesInput, inputData } from "./types/dataTypes.js";
import { SqlSimplifier } from "./app.js";
interface SqlOptions {
  PK: string;
  AI: string;
  NN: string;
  UQ: string;
  setforeignkey(
    columnname: string,
    foreigntable: string,
    foreigncolumn: string,
    action: "set null" | "set default" | "restrict" | "no action" | "cascade",
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
      PK: "PRIMARY KEY",
      AI: "AUTOINCREMENT",
      NN: "NOT NULL",
      UQ: "UNIQUE",
      setforeignkey: (
        columnname: string,
        foreigntable: string,
        foreigncolumn: string,
        action:
          | "set null"
          | "set default"
          | "restrict"
          | "no action"
          | "cascade",
      ): string => {
        return `?Foreign key (${columnname}) references ${foreigntable}(${foreigncolumn}) on update ${action} on delete ${action}?`;
      },
      setdefault: (values: string | number): string => {
        return `default '${values}'`;
      },
      setcheck: (sqlExpression: string): string => {
        console.log(sqlExpression);

        return `check (${sqlExpression})`;
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

  static isRightName(columnName: string): boolean {
    const isRightName = SqlSimplifier.invalidColumnNames.includes(columnName);
    return isRightName;
  }
  static objectTypesCheckAndColumnName(
    data: inputData,
    dataTypes: DataTypesInput,
  ): void {
    for (const [columnName, columnValue] of Object.entries(data)) {
      const typeResult = this.typeChecking(
        columnValue,
        dataTypes[columnName].type,
      );
      if (!typeResult) {
        console.error(
          `The value ${columnValue} is not of type ${dataTypes[columnName].type}`,
        );
        process.exit(1);
      }
      const nameResult = this.isRightName(columnName);
      if (nameResult) {
        console.error(`One of the columns name must be changed`);
        process.exit(1);
      }
    }
  }
}
