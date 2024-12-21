'use strict'
import { count } from "console";
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
}
class SqlSimplifier{
    [key: string]: any;
    private sourceDb
    constructor(public pathToDatabase:string){
    this.sourceDb = new DatabaseSync(pathToDatabase);
    }
    private typeChecking(value:string | boolean | number, expectedType:unknown){
        switch (expectedType) {
            case "INTEGER":
                return Number.isInteger(value);
            case "FLOAT":
                return typeof value === "number";
              case "BOOL":
                return typeof value === "boolean";
              case "DATETIME":
                return typeof value === "string" && !isNaN(Date.parse(value));
              case "TEXT":
                return typeof value === "string";
        }
    }

    insertData(tableName:string, dataProvided:{[key:string]:string | number | boolean}){
        for(const [columnName, columnValue] of Object.entries(dataProvided)){
           const result = this.typeChecking(columnValue, this[tableName].columns[columnName].type)
           if(!result){
            console.error(`The value ${columnValue} is not of type ${this[tableName].columns[columnName].type}`);
            console.timeEnd("timeApp");
            process.exit(1);
           }
        }
        const columns:Array<string> = Object.keys(dataProvided);
        const values:Array<any> = Object.values(dataProvided);        
        const columnString = columns.join(', ');
        const amountOfColumns = new Array(values.length).fill('?');
        let query  = `INSERT INTO ${tableName}(${columnString}) VALUES(${amountOfColumns.join(', ')});`;
        const prepared = this.sourceDb.prepare(query);       
        prepared.run(...values);
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
        const selectQuery = ` ${distinctColumn !== '' ? distinctColumn + ',' : ''}  ${countColumnsString !== '' ? countColumnsString + ',' : '' } ${commonColumns !== '' ?  commonColumns + ',' : ''}  `
        return selectQuery
    }

    findOne(tableName:string, data:{ [key: string]: boolean | { [key: string]: boolean } }){
        let selectQuery = this.select(tableName, data);
        selectQuery = selectQuery.slice(0, -3);
        const query = `SELECT ${selectQuery} FROM ${tableName} `;
        console.log(query);
        const prepared = this.sourceDb.prepare(query);
        const result :unknown[]= prepared.all();
        return result
    }

    createTable(tableName:string, columns:{[key:string] : {[key:string] : string}}):object{
        let query:string =`CREATE TABLE IF NOT EXISTS ${tableName} (`
        for(const [columnName, columnProperties] of Object.entries(columns)){
            query+=columnName + ' ' + columnProperties.type + ' '  + columnProperties.tableOptions + ', '
        }
        query = query.slice(0, -2) + ')';
        console.log(query);
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
        const tableInfoQuery = `
        PRAGMA table_info(${tableName})
        `;
        const result = this.sourceDb.prepare(tableInfoQuery);
        console.table(result.all());
    }

}
const names = [
    "Adam", "Adrian", "Agata", "Agnieszka", "Aleksander", "Aleksandra", "Alicja", "Amelia",
    "Anna", "Antoni", "Artur", "Barbara", "Bartłomiej", "Beata", "Bogdan", "Cezary",
    "Daniel", "Danuta", "Dariusz", "Dawid", "Dominik", "Dorota", "Edward", "Elżbieta",
    "Ewa", "Filip", "Franciszek", "Gabriel", "Gabriela", "Grzegorz", "Halina", "Hanna",
    "Helena", "Henryk", "Igor", "Irena", "Iwona", "Izabela", "Jacek", "Jakub",
    "Jan", "Janina", "Janusz", "Jerzy", "Joanna", "Julia", "Julita", "Justyna",
    "Kamil", "Kamila", "Karol", "Karolina", "Katarzyna", "Kinga", "Konrad", "Krystyna",
    "Krzysztof", "Laura", "Lena", "Łukasz", "Maciej", "Magdalena", "Małgorzata", "Marek",
    "Maria", "Mariusz", "Marta", "Martyna", "Mateusz", "Michał", "Mikołaj", "Milena",
    "Miłosz", "Monika", "Natalia", "Natasza", "Nina", "Norbert", "Oliwia", "Oliwier",
    "Patrycja", "Patryk", "Paulina", "Paweł", "Piotr", "Rafał", "Robert", "Roman",
    "Ryszard", "Sandra", "Sebastian", "Stanisław", "Stefan", "Sylwia", "Szymon", "Tadeusz",
    "Tomasz", "Weronika", "Wiktor", "Wiktoria", "Władysław", "Wojciech", "Zbigniew", "Zofia",
    "Zuzanna"
].flatMap(name => Array(5).fill(name));
const surnames = [
    "Nowak", "Kowalski", "Wiśniewski", "Wójcik", "Kowalczyk", "Kamiński", "Lewandowski",
    "Zieliński", "Szymański", "Woźniak", "Dąbrowski", "Kozłowski", "Mazur", "Jankowski",
    "Kwiatkowski", "Krawczyk", "Kaczmarek", "Piotrowski", "Grabowski", "Zając",
    "Pawłowski", "Michalski", "Król", "Wieczorek", "Jabłoński", "Wróbel", "Nowakowski",
    "Majewski", "Olszewski", "Stępień", "Malinowski", "Jaworski", "Adamczyk", "Dudek",
    "Nowicki", "Pawlak", "Górski", "Witkowski", "Walczak", "Sikora", "Baran", "Rutkowski",
    "Michalak", "Szewczyk", "Ostrowski", "Tomaszewski", "Pietrzak", "Duda", "Zalewski",
    "Wróblewski", "Jasiński", "Marciniak", "Sadowski", "Bąk", "Zawadzki", "Jakubowski",
    "Wilk", "Chmielewski", "Borkowski", "Włodarczyk", "Sokołowski", "Szczepański",
    "Sawicki", "Kucharski", "Lis", "Maciejewski", "Kubiak", "Kalinowski", "Wysocki",
    "Mazurek", "Kołodziej", "Kaźmierczak", "Czarnecki", "Sobczak", "Konieczny", "Urbański",
    "Głowacki", "Wasilewski", "Sikorski", "Zakrzewski", "Krajewski", "Krupa", "Laskowski",
    "Ziółkowski", "Gajewski", "Mróz", "Olejniczak", "Piątek", "Domański", "Tomczyk",
    "Pawlik", "Sikora", "Kruk", "Wierzbicki", "Jastrzębski", "Polak", "Zięba", "Markiewicz"
].flatMap(surname => Array(5).fill(surname));
const db = new SqlSimplifier('./database.sqlite');
db.createTable("Ludzie",{
    id:{
        type: dataTypes.INT,
        tableOptions: ` ${tableOptions.PK} ${tableOptions.AI}`,
    },
    name:{
        type : dataTypes.TXT,
        tableOptions: `${tableOptions.NN}`,
        
    },
    surname: {
        type: dataTypes.TXT,
        tableOptions: `${tableOptions.NN}`,
    },
    age: {
        type: dataTypes.INT,
        tableOptions: `${tableOptions.NN} ${tableOptions.setDefault(18)}`
    }
    
})
console.time("timeApp");

db.showTableSchema("Ludzie")

// db['Ludzie'].insertData({
//     name: 'Jan',
//     surname: 'Kowalski',
//     age: 20
// })
// db['Ludzie'].insertData({
//     name: 'Max',
//     surname: 'Muller',
// })
// db['Ludzie'].insertData({
//     name: 'Michał',
//     surname: 'Nowak',
// })
const data =  db["Ludzie"].find({
    count:{
        name:true
    }
})
console.table(data)
console.timeEnd("timeApp");
