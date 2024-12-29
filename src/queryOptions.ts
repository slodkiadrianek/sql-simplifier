export class QueryOptions {
  static setLimit(limit: number): string {
    return `LIMIT ${limit}`;
  }
  static setSkip(skip: number): string {
    return `OFFSET ${skip}`;
  }
  static setOrderBy(data: { [key: string]: "ASC" | "DESC" }[]): string {
    const orderBy: string[] = [];
    for (const [columnName, type] of Object.entries(data)) {
      orderBy.push(`ORDER BY ${columnName} ${type}`);
    }
    return orderBy.join(" , ");
  }
  static buildQueryOptions(data: {
    limit?: number;
    skip?: number;
    orderBy: { [key: string]: "ASC" | "DESC" }[];
  }): string {
    const queryString: string[] = [];
    if (typeof data !== "object" || data === undefined) {
      console.error("Wrong data provided");
      process.exit(1);
    }
    if ("limit" in data && typeof data.limit === "number") {
      queryString.splice(1, 0, this.setLimit(data.limit));
    }

    if ("skip" in data && typeof data.skip === "number") {
      queryString.splice(2, 0, this.setSkip(data.skip));
    }

    if ("orderBy" in data && typeof data.orderBy === "object") {
      queryString.splice(0, 0, this.setOrderBy(data.orderBy));
    }
    return queryString.join(" ");
  }
}