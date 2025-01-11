import { DataTypesInput } from "../../types/dataTypes.js";

export const tableName: string = "sql";

type TypeForDataToTestGo = {
  int: number;
  float: number;
  boolean: number;
  datetime: string;
  text: string;
};

export const dataFindMatchingColumns: string[] = [
  "int",
  "float",
  "boolean",
  "datetime",
  "text",
];

export const dataTypesToCheckGO: TypeForDataToTestGo = {
  int: 2,
  float: 1.2,
  boolean: 0,
  datetime: "2025-01-09T12:00:00Z",
  text: "Hello world",
};

export const dataTypesToCheckFail: { like: string } = {
  like: "sad",
};
export const expectedTypesFail: DataTypesInput = {
  like: {
    type: "FLOAT",
    tableOptions: "",
  },
};

export const expectedTypesGo: DataTypesInput = {
  int: {
    type: "INTEGER",
    tableOptions: "Primary KEY",
  },
  float: {
    type: "FLOAT",
    tableOptions: "",
  },
  boolean: {
    type: "BOOLEAN",
    tableOptions: "",
  },
  datetime: {
    type: "DATETIME",
    tableOptions: "",
  },
  text: {
    type: "TEXT",
    tableOptions: "",
  },
};
