import { describe, it } from "node:test";
import assert from "node:assert";
import { QueryFunctions } from "../../queryFunctions.js";
import {
  dataFindMatchingColumns,
  dataTypesToCheckGO,
} from "../data/dataTypes.test.js";
describe("Go build select test", () => {
  it("find matching columns check", () => {
    const result = QueryFunctions.findMatchingColumns(
      dataFindMatchingColumns,
      dataTypesToCheckGO,
    );
    assert.equal(
      result.join(","),
      ["int", "float", "datetime", "text"].join(","),
    );
  });
  it("build select with empty object check", () => {
    const result = QueryFunctions.buildSelect({}, dataFindMatchingColumns);
    assert.equal(result, "*   ");
  });
  it("build select with one property check", () => {
    const result = QueryFunctions.buildSelect(
      { float: true },
      dataFindMatchingColumns,
    );
    assert.equal(result, "   float , ");
  });
  it("build select with more properties check", () => {
    const result = QueryFunctions.buildSelect(
      { float: true, int: true },
      dataFindMatchingColumns,
    );
    assert.equal(result, "   float,int , ");
  });
  it("build select with table name property check", () => {
    const result = QueryFunctions.buildSelect(
      { "types.float": true },
      dataFindMatchingColumns,
    );
    assert.equal(result, "   types.float , ");
  });
});
