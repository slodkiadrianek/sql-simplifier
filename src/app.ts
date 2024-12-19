'use strict'
import { DatabaseSync } from "node:sqlite"

export const tableOptions = {
    'PK':'PRIMARY KEY',
    'AI': "AUTOINCREMENT",
    'NN': "NOT NULL",
    'UQ': 'UNIQUE',
    setForeignKey(columnName: string, foreignTable: string, foreignColumn: string): string {
        return `FOREIGN KEY (${columnName}) REFERENCES ${foreignTable}(${foreignColumn})`
    },
    setDefault(values:string | number):string{
        return `DEFAULT ${values}`;
    },
    setCheck(sqlExpression:string):string{
        return `CHECK (${sqlExpression})`
    }
}

export const dataTypes = {
    'INT': 'INTEGER',
    "FLOAT": 'FLOAT',
    "BOOL": 'BOOLEAN',
    "DATETIME": "DATETIME",
    "TXT":"TEXT",
    setVarchar(length: number): string {
        return `VARCHAR(${length})`
    }
}
class SqlSimplifier{
    [key: string]: any;
    private sourceDb
    constructor(public pathToDatabase:string){
    this.sourceDb = new DatabaseSync(':memory:');
    }

    insertData(tableName:string, dataProvided:{[key:string]:string | number | boolean}){
        const columns:Array<string> = Object.keys(dataProvided);
        const values:Array<string | number | boolean> = Object.values(dataProvided);
        const columnString = columns.join(', ');
        let valueString = values.map((value) => {
            if (typeof value === 'string') {
                return `'${value}'`;
            } else {
                return value;
            }
        })
        valueString.join(', ')
        let query  = `INSERT INTO ${tableName}(${columnString}) VALUES(${valueString})`;
        console.log(query);
       
    }

    createTable(tableName:string, columns:{[key:string] : string}):object{
        let query:string =`CREATE TABLE IF NOT EXISTS ${tableName} (`
        for(const [columnName, columnProperties] of Object.entries(columns)){
            query+=columnName + ' ' + columnProperties + ', '
        }
        query = query.slice(0, -2) + ')';
        this.sourceDb.exec(query);
          this[tableName] = {
            ...columns,
            insertData: this.insertData.bind(this, tableName)
        }
        return this[tableName]
    }

    showTableSchema(tableName:string):void{
        const tableInfoQuery = `PRAGMA table_info(${tableName})`;
        const result = this.sourceDb.prepare(tableInfoQuery);
        console.table(result.all());
    }

}
const db = new SqlSimplifier('../db.sqlite');
db.createTable("Imiona",{
    imie_id: `${dataTypes.INT} ${tableOptions.PK} ${tableOptions.AI} `,
    imie: `${dataTypes.setVarchar(50)} ${tableOptions.NN}`,
    nazwisko: `${dataTypes.setVarchar(50)} ${tableOptions.NN} ${tableOptions.setDefault('Kowalski')}`,

})
db.showTableSchema("Imiona")
db['Imiona'].insertData({
    imie: 'Jan',
    nazwisko: 'Marczyk'
})
