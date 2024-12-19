'use strict'
import { count } from "node:console";
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
        console.log(values);
        let valueString = values.map((value) => { 

            if (typeof value === 'string') {
                return `'${value}'`;
            }else{
                return value;
            }
        })
        console.log(valueString);
        let query  = `INSERT INTO ${tableName}(${columnString}) VALUES(${valueString.join(',')})`;
        console.log(query);
        const prepared = this.sourceDb.prepare(query);
        prepared.run();
    }
    private findMatchingColumns(availableColumns:Array<string>, data:object):Array<string>{
        const matchingColumns = []
        for(const [columnName, columnValues] of Object.entries(data)){
            if(availableColumns.includes(columnName) && columnValues ){
                matchingColumns.push(columnName)
            }

        }
        return matchingColumns;
    }

    private select(tableName:string, data:{ [key: string]: boolean | { [key: string]: boolean } }):string{
        const availableColumns = Object.keys(this[tableName].columns)
        let distinctColumn = ''
        let countColumnsString = ''
        const commonColumns= this.findMatchingColumns(availableColumns, data).join(',');
        if (typeof data.distinct === 'object' && data.distinct !== null) {
            distinctColumn = this.findMatchingColumns(availableColumns, data.distinct)[0]
            distinctColumn.length > 0 ? distinctColumn = `DISTINCT ${distinctColumn}` : distinctColumn = ''
        }
        if(typeof data.count === 'object' && data.count !== null){
            let  countColumns = this.findMatchingColumns(availableColumns, data.count)
            countColumns = countColumns.map((el) => `COUNT(${el})`);
            countColumnsString = countColumns.join(', ')
        }
        const selectQuery = `${distinctColumn !== '' ? distinctColumn + ',' : ''}  ${countColumnsString !== '' ? countColumnsString + ',' : '' } ${commonColumns}`
        return selectQuery
    }

    findOne(tableName:string, data:{ [key: string]: boolean | { [key: string]: boolean } }){
        // const selectQuery = this.select(tableName, data);
        const query = `SELECT * FROM ${tableName} `;
        const prepared = this.sourceDb.prepare(query);
        const result :unknown[]= prepared.all();
        return result
    }

    createTable(tableName:string, columns:{[key:string] : string}):object{
        let query:string =`CREATE TABLE IF NOT EXISTS ${tableName} (`
        for(const [columnName, columnProperties] of Object.entries(columns)){
            query+=columnName + ' ' + columnProperties + ', '
        }
        query = query.slice(0, -2) + ')';
        this.sourceDb.exec(query);
          this[tableName] = {
            columns:{
                ...columns,
            },
            insertData: this.insertData.bind(this, tableName),
            find:this.findOne.bind(this, tableName),
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
db.createTable("Ludzie",{
    id: `${dataTypes.INT} ${tableOptions.PK} ${tableOptions.AI} `,
    imie: `${dataTypes.setVarchar(50)} ${tableOptions.NN}`,
    nazwisko: `${dataTypes.setVarchar(50)} ${tableOptions.NN} ${tableOptions.setDefault('Kowalski')}`,
    age: `${dataTypes.INT} ${tableOptions.NN}`,

})
console.time("add");

db.showTableSchema("Ludzie")
db['Ludzie'].insertData({
    imie: 'Adam',
    nazwisko: 'Marczyk',
    age: 20
})
const data =  db["Ludzie"].find()
console.table(data)
console.timeEnd("add");
