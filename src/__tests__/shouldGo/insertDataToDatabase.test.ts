import assert from "assert";
import { describe, it, after } from "node:test";
import { SqlSimplifier } from "../../app.js";
import { typesAndOptions } from "../../typesAndOptions.js";
import { unlink } from "fs/promises";
describe("Insert data to database", (): void => {
  const pathToDatabase = "./database.db";
  const db = new SqlSimplifier(pathToDatabase);
  after(async () => {
    await unlink("./database.db");
  });
  const suppliersGroups = db.createTable("suppliersGroups", {
    id: {
      type: typesAndOptions.types.INT,
      tableOptions: ` ${typesAndOptions.options.PK} ${typesAndOptions.options.AI}`,
    },
    name: {
      type: typesAndOptions.types.TEXT,
      tableOptions: typesAndOptions.options.UQ,
    },
  });
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
  it("InsertOne table without foreign key", (): void => {
    const result = suppliersGroups.insertOne({
      name: "Volwagen",
    });
    assert.equal(result, "Data inserted");
  });
  it("InsertOne table with foreign key", () => {
    const result = suppliers.insertOne({
      supplierName: 0,
      supplierEmail: "adikurek@gmail.com",
      supplierGroupId: 1,
    });
    assert.equal(result, "Data inserted");
  });
  it("InsertMany table without foreign key", () => {
    const result = suppliersGroups.insertMany([
      {
        name: "Akdi",
      },
      {
        name: "Makdi",
      },
    ]);
    assert.equal(result, "Data inserted");
  });
  it("InsertMany table with foreign key", () => {
    const result = suppliers.insertMany([
      {
        supplierName: 0,
        supplierEmail: "adikrek@gmail.com",
        supplierGroupId: 3,
      },
      {
        supplierName: 1,
        supplierEmail: "adikuek@gmail.com",
        supplierGroupId: 2,
      },
    ]);
    assert.equal(result, "Data inserted");
  });
});
