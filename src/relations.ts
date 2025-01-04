export class Relations {
  static find(
    tableName: string,
    data: { [key: string]: boolean },
    tableColumns: {
      [key: string]: {
        type: string;
        tableOptions: string;
      };
    },
  ): string {
    const queryArrray: string[] = [];
    if (!data) {
      return "";
    }
    for (const [columnName, columnValue] of Object.entries(data)) {
      if (!columnValue) {
        continue;
      }
      for (const columns of Object.values(tableColumns)) {
        for (const findValue of Object.values(columns)) {
          if (!findValue.tableOptions.includes(columnName)) {
            continue;
          }
          const spltted = findValue.tableOptions.split(/\(|\)/g);
          let thisTableColumn: string = "";
          let foreignTableColumn: string = "";
          for (let i = 0; i < spltted.length; i++) {
            if (spltted[i].includes("Foreign")) {
              thisTableColumn = spltted[i + 1];
            } else if (spltted[i].includes("references")) {
              foreignTableColumn = spltted[i + 1];
            } else {
              continue;
            }
          }
          queryArrray.push(
            `INNER JOIN ${columnName} ON ${columnName}.${thisTableColumn} = ${tableName}.${foreignTableColumn}`,
          );
        }
      }
    }
    return queryArrray.join(" ");
  }
}
