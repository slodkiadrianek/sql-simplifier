import { SqlSimplifier } from "./app";
import { typesAndOptions } from "./typesAndOptions";

const db = new SqlSimplifier("./test.db");
db.createTable("people", {
  id: {
    type: typesAndOptions.types.INT,
    tableOptions: `${typesAndOptions.options.PK} ${typesAndOptions.options.AI}`,
  },
  name: {
    type: typesAndOptions.types.TEXT,
    tableOptions: `${typesAndOptions.options.NN}`,
  },
  surname: {
    type: typesAndOptions.types.TEXT,
    tableOptions: `${typesAndOptions.options.NN}`,
  },
  age: {
    type: typesAndOptions.types.INT,
    tableOptions: `${typesAndOptions.options.NN}`,
  },
});
db.showTableSchema("people");
console.time("timeApp");
// db["people"].insertOne({ name: "John", surname: "Doe", age: 25 });
// db["people"].insertMany([
//   { name: "John", surname: "Doe", age: 25 },
//   { name: "Jane", surname: "Doe", age: 24 },
//   { name: "Michał", surname: "Kowalski", age: 30 },
// ]);
const data = db["people"].find({});
console.table(data);
console.timeEnd("timeApp");
