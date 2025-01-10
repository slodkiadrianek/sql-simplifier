import { describe, it } from "node:test";
import assert from "node:assert";
import {
  tableName,
  dataTypesToCheckGO,
  expectedTypes,
} from "../data/dataTypes.test.js";
import { InsertAndUpdateData } from "../../insertData.js";

describe("insert test", () => {
  it("insertOne check", () => {
    const result = InsertAndUpdateData.insertOne(
      tableName,
      dataTypesToCheckGO,
      expectedTypes
    );
    assert.equal(
      result.query,
      "INSERT INTO sql(int, float, boolean, datetime, text) VALUES(?, ?, ?, ?, ?)"
    );
    assert.equal(
      "" + result.values,
      [2, 1.2, 0, "2025-01-09T12:00:00Z", "Hello world"].join(",")
    );
  });
  it("insertMany check with one set of data", () => {
    const result = InsertAndUpdateData.insertMany(
      tableName,
      [dataTypesToCheckGO],
      expectedTypes
    );
    assert.equal(
      result.query,
      "INSERT INTO sql(int, float, boolean, datetime, text) VALUES(?, ?, ?, ?, ?)"
    );
    assert.equal(
      "" + result.values,
      [2, 1.2, 0, "2025-01-09T12:00:00Z", "Hello world"].join(",")
    );
  });
  it("insertMany check with more than one set of data", () => {
    const result = InsertAndUpdateData.insertMany(
      tableName,
      [dataTypesToCheckGO, dataTypesToCheckGO],
      expectedTypes
    );
    assert.equal(
      result.query,
      "INSERT INTO sql(int, float, boolean, datetime, text) VALUES(?, ?, ?, ?, ?), (?, ?, ?, ?, ?)"
    );
    assert.equal(
      "" + result.values,
      [
        2,
        1.2,
        0,
        "2025-01-09T12:00:00Z",
        "Hello world",
        2,
        1.2,
        0,
        "2025-01-09T12:00:00Z",
        "Hello world",
      ].join(",")
    );
  });
});
