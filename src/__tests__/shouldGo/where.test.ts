import assert from "assert";
import { describe, it } from "node:test";
import { QueryFunctions } from "../../queryFunctions.js";

describe("where test", (): void => {
  it("build query string check ", (): void => {
    const result = QueryFunctions.buildQueryString(
      {
        where: {
          name: "Car",
        },
      },
      "where",
    );
    assert.equal(result.queryString, " name = 'Car' ");
  });
  it("where test with many parameters", (): void => {
    const result = QueryFunctions.buildQueryString(
      {
        where: {
          name: "car",
          surname: "boat",
        },
      },
      "where",
    );
    assert.equal(result.queryString, " name = 'car'  AND  surname = 'boat' ");
  });
  it("where test with or", (): void => {
    const result = QueryFunctions.buildQueryString(
      {
        where: {
          or: [{ name: "car" }, { name: "boat" }],
        },
      },
      "where",
    );
    assert.equal(result.queryString, " name = ?  OR  name = ? ");
    assert.equal(
      result.queryValues.join(","),
      [{ name: "'car'" }, { name: "'boat'" }].join(","),
    );
  });
  it("where test with between", (): void => {
    const result = QueryFunctions.buildQueryString(
      {
        where: {
          between: ["name", ["car", "boat"]],
        },
      },
      "where",
    );
    assert.equal(result.queryString, " name BETWEEN ? AND ? ");
    assert.equal(
      result.queryValues.join(","),
      [{ name: "'car'" }, { name: "'boat'" }].join(","),
    );
  });
  it("where test with neq ", (): void => {
    const result = QueryFunctions.buildQueryString(
      {
        where: {
          neq: [{ name: "car" }],
        },
      },
      "where",
    );
    assert.equal(result.queryValues.join(","), [{ name: "'car'" }].join(","));
    assert.equal(result.queryString, " name != ? ");
  });
  it("where test with greather than", (): void => {
    const result = QueryFunctions.buildQueryString(
      {
        where: {
          gt: [{ name: 2 }],
        },
      },
      "where",
    );
    assert.equal(result.queryString, " name > ? ");
    assert.equal(result.queryValues.join(","), [{ name: 2 }].join(","));
  });
  it("where test with greather than equal", (): void => {
    const result = QueryFunctions.buildQueryString(
      {
        where: {
          gte: [{ name: 3 }],
        },
      },
      "where",
    );
    assert.equal(result.queryString, " name >= ? ");
    assert.equal(result.queryValues.join(","), [{ name: 3 }].join(","));
  });
  it("where test with less than", (): void => {
    const result = QueryFunctions.buildQueryString(
      {
        where: {
          lt: [{ name: 2 }],
        },
      },
      "where",
    );
    assert.equal(result.queryString, " name < ? ");
    assert.equal(result.queryValues.join(","), [{ name: 2 }].join(","));
  });
  it("where test with less than equal", (): void => {
    const result = QueryFunctions.buildQueryString(
      {
        where: {
          lte: [{ name: 2 }],
        },
      },
      "where",
    );
    assert.equal(result.queryString, " name <= ? ");
    assert.equal(result.queryValues.join(","), [{ name: 2 }].join(","));
  });
  it("where test with like ", () => {
    const result = QueryFunctions.buildQueryString(
      {
        where: {
          like: {
            car: "%kot%",
            boat: "%car%",
          },
        },
      },
      "where",
    );
    assert.equal(result.queryString, "car LIKE '%kot%' AND boat LIKE '%car%'");
  });
  it("where test with not between ", () => {
    const result = QueryFunctions.buildQueryString(
      {
        where: {
          notBetween: ["car", [1, 2]],
        },
      },
      "where",
    );
    assert.equal(result.queryString, " car NOT BETWEEN ? AND ? ");
    assert.equal(
      result.queryValues.join(","),
      [{ car: 1 }, { car: 2 }].join(","),
    );
  });
  it("where test with not like", () => {
    const result = QueryFunctions.buildQueryString(
      {
        where: {
          notLike: {
            car: "%boat%",
          },
        },
      },
      "where",
    );
    assert.equal(result.queryString, "car NOT LIKE '%boat%'");
  });
  it("where test with in ", () => {
    const result = QueryFunctions.buildQueryString(
      {
        where: {
          in: ["columnName", ["2", "3"]],
        },
      },
      "where",
    );
    assert.equal(
      result.queryValues.join(","),
      [{ columnName: "'2'" }, { columnName: "'3'" }].join(","),
    );
    assert.equal(result.queryString, " columnName IN ('2','3') ");
  });
  it("where test with not it ", () => {
    const result = QueryFunctions.buildQueryString(
      {
        where: {
          notIn: ["columnName", ["2", "3"]],
        },
      },
      "where",
    );
    assert.equal(result.queryString, " columnName NOT IN ('2','3') ");
    assert.equal(
      result.queryValues.join(","),
      [{ columnName: "'2'" }, { columnName: "'3'" }].join(","),
    );
  });
});
