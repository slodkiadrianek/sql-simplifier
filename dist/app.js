'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.dataTypes = exports.tableOptions = void 0;
const node_sqlite_1 = require("node:sqlite");
exports.tableOptions = {
    'PK': 'PRIMARY KEY',
    'AI': "AUTOINCREMENT",
    'NN': "NOT NULL",
    'UQ': 'UNIQUE',
    setForeignKey(columnName, foreignTable, foreignColumn) {
        return `FOREIGN KEY (${columnName}) REFERENCES ${foreignTable}(${foreignColumn})`;
    },
    setDefault(values) {
        return `DEFAULT ${values}`;
    },
    setCheck(sqlExpression) {
        return `CHECK (${sqlExpression})`;
    }
};
exports.dataTypes = {
    'INT': 'INTEGER',
    "FLOAT": 'FLOAT',
    "BOOL": 'BOOLEAN',
    "DATETIME": "DATETIME",
    "TXT": "TEXT",
    setVarchar(length) {
        return `VARCHAR(${length})`;
    }
};
class SqlSimplifier {
    db;
    sourceDb;
    constructor(db) {
        this.db = db;
        this.sourceDb = new node_sqlite_1.DatabaseSync(db);
    }
    createTable(tableName, table) {
        let query = `CREATE TABLE IF NOT EXISTS ${tableName} (`;
        for (const [columnName, columnProperties] of Object.entries(table)) {
            query += columnName + ' ' + columnProperties + ', ';
        }
        const reversedQuery = query.split('').reverse();
        reversedQuery[1] = ')';
        query = reversedQuery.reverse().join('');
        this.sourceDb.exec(query);
    }
    showTableSchema(tableName) {
        const tableInfoQuery = `PRAGMA table_info(${tableName})`;
        const result = this.sourceDb.prepare(tableInfoQuery);
        console.table(result.all());
    }
}
const db = new SqlSimplifier('../db.sqlite');
db.createTable("Imiona", {
    imie_id: `${exports.dataTypes.INT} ${exports.tableOptions.PK} ${exports.tableOptions.AI}`,
    imie: `${exports.dataTypes.setVarchar(50)} ${exports.tableOptions.NN}`,
    nazwiska: `${exports.dataTypes.setVarchar(50)} ${exports.tableOptions.NN}`,
});
db.showTableSchema("Imiona");
