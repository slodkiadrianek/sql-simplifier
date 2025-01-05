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
db.createTable("supplier_groups", {
  group_id: {
    type: typesAndOptions.types.INT,
    tableOptions: `${typesAndOptions.options.PK} ${typesAndOptions.options.AI}`,
  },
  group_name: {
    type: typesAndOptions.types.TEXT,
    tableOptions: `${typesAndOptions.options.NN}`,
  },
});
db.createTable("suppliers", {
  supplier_id: {
    type: typesAndOptions.types.INT,
    tableOptions: `${typesAndOptions.options.PK} ${typesAndOptions.options.AI}`,
  },
  group_id: {
    type: typesAndOptions.types.INT,
    tableOptions: `${typesAndOptions.options.NN} ${typesAndOptions.options.setforeignkey("group_id", "supplier_groups", "group_id", "cascade")}`,
  },
  supplier_name: {
    type: typesAndOptions.types.TEXT,
    tableOptions: `${typesAndOptions.options.NN}`,
  },
  company_group_id: {
    type: typesAndOptions.types.INT,
    tableOptions: `${typesAndOptions.options.NN} ${typesAndOptions.options.setforeignkey("company_group_id", "company_groups", "company_group_id", "cascade")}`,
  },
});

db.createTable("company_groups", {
  company_group_id: {
    type: typesAndOptions.types.INT,
    tableOptions: `${typesAndOptions.options.PK} ${typesAndOptions.options.AI}`,
  },
  company_group_name: {
    type: typesAndOptions.types.TEXT,
    tableOptions: `${typesAndOptions.options.NN}`,
  },
});
const schema = db.showTableSchema("suppliers");
console.log(schema);

// db["company_groups"].insertOne({
//   company_group_name: "BOMBLEX",
// });
console.time("timeApp");
const data = db["company_groups"].findOne({});
console.table(data);
// console.log(supplier_groups, suppliers);
// db["supplier_groups"].insertOne({
//   group_name: "Foliarze",
// });
const data2 = db["supplier_groups"].findMany({});
console.table(data2);
// db["suppliers"].insertOne({
//   group_id: 1,
//   supplier_name: "FOLIOTEX",
//   company_group_id: 1,
// });
const suppliersData = db["suppliers"].findMany({
  group_name: true,
  "company_groups.company_group_name": true,
  "suppliers.supplier_name": true,
  "supplier_groups.group_id": true,
  with: {
    supplier_groups: true,
    company_groups: true,
  },
  where: {
    "supplier_groups.group_id": 1,
  },
});
console.table(suppliersData);
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
// db["suppliers"].updateMany({
//   supplier_name: "FROMEX",
//   company_group_id: 2,
//   where: {
//     supplier_id: 1,
//   },
// });
console.timeEnd("timeApp");
