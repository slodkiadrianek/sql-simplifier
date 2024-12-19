'use strict'
import { DatabaseSync } from "node:sqlite"



export const dataTypes = {
    'INT': 'INTEGER',
    "FLOAT": 'FLOAT',
    "BOOL": 'BOOLEAN',
    "DATETIME": "DATETIME",

    setVarcharOrChar(length: number): string {
        
        return `VARCHAR(${length})`
    }
}
class SqlSimplifier{
    private sourceDb
    constructor(public db:string ){
    this.sourceDb = new DatabaseSync(db);
    }
    createTable(tableName:string, table:object){
        this.sourceDb.exec('CREATE TABLE data(key INTEGER PRIMARY KEY, value TEXT)');
        const insert = this.sourceDb.prepare('INSERT INTO data (key, value) VALUES (?, ?)');
    // Execute the prepared statement with bound values.
    insert.run(1, 'hello');
    insert.run(2, 'world');
    const query = this.sourceDb.prepare('SELECT * FROM data ORDER BY key');
    // Execute the prepared statement and log the result set.
    console.log(query.all());
    }

}
const db = new SqlSimplifier('../db.sqlite');
db.createTable("Imiona",{
    id: `${dataTypes.INT} `
})