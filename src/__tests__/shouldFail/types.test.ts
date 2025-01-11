import { typesAndOptions } from "../../typesAndOptions.js";
import {
  expectedTypesFail,
  dataTypesToCheckFail,
} from "../data/dataTypes.test.js";
import { describe, it } from "node:test";
import assert from "node:assert";
describe("Fail type checking", () => {
  it("type check", () => {
    for (const [columnName, columnValue] of Object.entries(
      dataTypesToCheckFail
    )) {
      const result = typesAndOptions.typeChecking(
        columnValue,
        expectedTypesFail[columnName as keyof typeof expectedTypesFail].type
      );
      assert.equal(result, false);
    }
  });
  it("name check", () => {
    for (const columnName of Object.keys(dataTypesToCheckFail)) {
      const result = typesAndOptions.isRightName(columnName);
      assert.equal(result, true);
    }
  });
});
