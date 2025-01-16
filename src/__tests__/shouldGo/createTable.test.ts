import { describe } from "node:test";
// import assert from "node:assert";
import { SqlSimplifier } from "../../app.js";
import { typesAndOptions } from "../../typesAndOptions.js";
import assert from "assert";
describe("create table tests", () => {
  const pathToDatabase = "./test.db";
  const db = new SqlSimplifier(pathToDatabase);
  const suppliersGroups = db.createTable("suppliersGroups", {
    id: {
      type: typesAndOptions.types.INT,
      tableOptions: ` ${typesAndOptions.options.PK} ${typesAndOptions.options.AI}`,
    },
  });
  assert.equal(
    JSON.stringify(suppliersGroups.columns),
    JSON.stringify({
      id: { type: "INTEGER", tableOptions: " PRIMARY KEY AUTOINCREMENT" },
    }),
  );

  const suppliers = db.createTable("suppliers", {
    id: {
      type: typesAndOptions.types.INT,
      tableOptions: ` ${typesAndOptions.options.PK} ${typesAndOptions.options.AI}`,
    },
    supplierName: {
      type: typesAndOptions.types.BOOL,
      tableOptions: `${typesAndOptions.options.NN} ${typesAndOptions.options.setcheck("supplierName != 2")}`,
    },
    supplierEmail: {
      type: typesAndOptions.types.TEXT,
      tableOptions: typesAndOptions.options.UQ,
    },
    supplierGroupId: {
      type: typesAndOptions.types.INT,
      tableOptions: typesAndOptions.options.setforeignkey(
        "supplierGroupId",
        "suppliersGroups",
        "id",
        "cascade",
      ),
    },
    createdAt: {
      type: typesAndOptions.types.DATETIME,
      tableOptions: typesAndOptions.options.setdefault("2025-01-09T12:00:00Z"),
    },
  });

  assert.strictEqual(
    JSON.stringify(suppliers.columns),
    JSON.stringify({
      id: { type: "INTEGER", tableOptions: " PRIMARY KEY AUTOINCREMENT" },
      supplierName: {
        type: "BOOLEAN",
        tableOptions: "NOT NULL check (supplierName != 2)",
      },
      supplierEmail: { type: "TEXT", tableOptions: "UNIQUE" },
      supplierGroupId: {
        type: "INTEGER",
        tableOptions:
          "!Foreign key (supplierGroupId) references suppliersGroups(id) on update cascade on delete cascade!",
      },
      createdAt: {
        type: "DATETIME",
        tableOptions: "default '2025-01-09T12:00:00Z'",
      },
    }),
  );
});
