export type DataTypesInput = {
  [key: string]: { type: string; tableOptions: string };
};

export type inputData =
  | { [key: string]: string | number }
  | { [key: string]: string | number }[];
