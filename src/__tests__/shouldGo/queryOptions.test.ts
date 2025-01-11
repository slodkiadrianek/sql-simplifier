import { describe, it } from "node:test";
import { QueryOptions } from "../../queryOptions.js";
import assert from "node:assert";
describe("Go Options query", () => {
  it("set limit check", () => {
    const result = QueryOptions.setLimit(2);
    assert.equal(result, `LIMIT 2`);
  });
  it("set skip check", () => {
    const result = QueryOptions.setSkip(2);
    assert.equal(result, `OFFSET 2`);
  });
  it("set orderBy check with one object of data", () => {
    const result = QueryOptions.setOrderBy([{ car: "ASC" }]);
    assert.equal(result, `ORDER BY car ASC`);
  });
  it("set orderBy check with more objects of data", () => {
    const result = QueryOptions.setOrderBy([{ car: "ASC" }, { dog: "DESC" }]);
    assert.equal(result, `ORDER BY car ASC , ORDER BY dog DESC`);
  });
  it("buildQueryOptions check with one set of data", () => {
    const result = QueryOptions.buildQueryOptions({
      limit: 2,
      skip: 2,
      orderBy: [{ dog: "DESC" }],
    });
    assert.equal(result, `ORDER BY dog DESC LIMIT 2 OFFSET 2`);
  });
  it("buildQueryOptions check with two sets of data", () => {
    const result = QueryOptions.buildQueryOptions({
      limit: 2,
      skip: 2,
      orderBy: [{ dog: "DESC" }, { car: "ASC" }],
    });
    assert.equal(
      result,
      `ORDER BY dog DESC , ORDER BY car ASC LIMIT 2 OFFSET 2`
    );
  });
});
