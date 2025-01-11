import { typesAndOptions } from "../../typesAndOptions.js";
import { expectedTypesGo, dataTypesToCheckGO } from "../data/dataTypes.test.js";
import { describe, it } from "node:test";
import assert from "node:assert";
describe("Go type checking", () => {
  it("type check", () => {
    for (const [columnName, columnValue] of Object.entries(
      dataTypesToCheckGO
    )) {
      const result = typesAndOptions.typeChecking(
        columnValue,
        expectedTypesGo[columnName as keyof typeof expectedTypesGo].type
      );
      assert.equal(result, true);
    }
  });
  it("name check", () => {
    for (const columnName of Object.keys(dataTypesToCheckGO)) {
      const result = typesAndOptions.isRightName(columnName);
      assert.equal(result, false);
    }
  });
});
