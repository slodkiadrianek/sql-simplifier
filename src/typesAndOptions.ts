import { SqlSimplifier } from "./app";

interface SqlOptions {
  pk: string;
  ai: string;
  nn: string;
  uq: string;
  setforeignkey(
    columnname: string,
    foreigntable: string,
    foreigncolumn: string,
  ): string;
  setdefault(values: string | number): string;
  setcheck(sqlexpression: string): string;
}
export class typesAndOptions extends SqlSimplifier {
  constructor(pathToDatabase: string) {
    super(pathToDatabase);
  }
  static get types() {
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
      pk: "primary key",
      ai: "autoincrement",
      nn: "not null",
      uq: "unique",
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
  public typeChecking(
    value: string | boolean | number,
    expectedType: string,
  ): boolean {
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
}
