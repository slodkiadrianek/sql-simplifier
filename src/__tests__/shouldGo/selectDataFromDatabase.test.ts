import { describe, it } from "node:test";
import assert from "assert";
import { typesAndOptions } from "../../typesAndOptions.js";
import { SqlSimplifier } from "../../app.js";
describe("delete data from database", async (): Promise<void> => {
  const pathToDatabase = ":memory:";

  const db = new SqlSimplifier(pathToDatabase);

  const suppliers = db.createTable("suppliers", {
    id: {
      type: typesAndOptions.types.INT,
      tableOptions: ` ${typesAndOptions.options.PK} ${typesAndOptions.options.AI}`,
    },
    supplierName: {
      type: typesAndOptions.types.BOOL,
      tableOptions: `${
        typesAndOptions.options.NN
      } ${typesAndOptions.options.setcheck("supplierName != 2")}`,
    },
    supplierEmail: {
      type: typesAndOptions.types.TEXT,
      tableOptions: typesAndOptions.options.UQ,
    },
    createdAt: {
      type: typesAndOptions.types.DATETIME,
      tableOptions: typesAndOptions.options.setdefault("2025-01-09T11:00:00Z"),
    },
  });

  suppliers.insertOne({
    supplierName: 0,
    supplierEmail: "adikurek@gmail.com",
  });
});
