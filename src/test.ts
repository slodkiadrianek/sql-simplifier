import { SqlSimplifier } from "./app";
import { typesAndOptions } from "./typesAndOptions";

const db = new SqlSimplifier("./test.db");
// const people = db.createTable("people", {
//   id: {
//     type: typesAndOptions.types.INT,
//     tableOptions: `${typesAndOptions.options.PK} ${typesAndOptions.options.AI}`,
//   },
//   name: {
//     type: typesAndOptions.types.TEXT,
//     tableOptions: `${typesAndOptions.options.NN}`,
//   },
//   surname: {
//     type: typesAndOptions.types.TEXT,
//     tableOptions: `${typesAndOptions.options.NN}`,
//   },
//   age: {
//     type: typesAndOptions.types.INT,
//     tableOptions: `${typesAndOptions.options.NN}`,
//   },
// });
const supplier_groups = db.createTable("supplier_groups", {
  group_id: {
    type: typesAndOptions.types.INT,
    tableOptions: `${typesAndOptions.options.PK} ${typesAndOptions.options.AI}`,
  },
  group_name: {
    type: typesAndOptions.types.TEXT,
    tableOptions: `${typesAndOptions.options.NN}`,
  },
});
const suppliers = db.createTable("suppliers", {
  supplier_id: {
    type: typesAndOptions.types.INT,
    tableOptions: `${typesAndOptions.options.PK} ${typesAndOptions.options.AI}`,
  },

  group_id: {
    type: typesAndOptions.types.INT,
    tableOptions: `${typesAndOptions.options.NN} ${typesAndOptions.options.setforeignkey("group_id", "supplier_groups", "group_id")}`,
  },
  supplier_name: {
    type: typesAndOptions.types.TEXT,
    tableOptions: `${typesAndOptions.options.NN}`,
  },
});
db.showTableSchema("suppliers");
console.time("timeApp");
console.log(supplier_groups, suppliers);
// db["people"].insertOne({ name: "John", surname: "Doe", age: 25 });
// db["people"].insertMany([
//   { name: "John", surname: "Doe", age: 25 },
//   { name: "Jane", surname: "Doe", age: 24 },
//   { name: "Michał", surname: "Kowalski", age: 30 },
// ]);
// const data = db["people"].findMany({
//   groupBy: "name",
//   count: {
  //     age: true,
  //   }, 
//   name: true,
// });
// console.log(people.);
// console.table(data);
console.timeEnd("timeApp");
