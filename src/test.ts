import { SqlSimplifier } from "./app";
import { typesAndOptions } from "./typesAndOptions";

const db = new SqlSimplifier("test.db");
db.createTable("people", {
  id: {
    type: typesAndOptions.types.INT,
    tableOptions: `${typesAndOptions.options.pk} ${typesAndOptions.options.ai}`,
  },
});
