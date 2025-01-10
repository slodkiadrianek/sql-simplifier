import { DataTypesInput } from "../../types/dataTypes.js"

export const tableName: string = 'sql' 

type TypeForDataToTestGo = {
    int:number;
    float: number;
    boolean:number;
    datetime:string;
    text: string;
}

type TypeForDataToTestFail = {
    int:string;
    float: string;
    boolean:string;
    datetime:number;
    text: number;
}

export const  dataTypesToCheckGO:TypeForDataToTestGo= {
    int: 2,
    float: 1.2,
    boolean: 0,
    datetime: '2025-01-09T12:00:00Z',
    text: 'Hello world'
}

export const  dataTypesToCheckFail:TypeForDataToTestFail = {
    int: '2',
    float: 'sad',
    boolean: 'asdsa',
    datetime:0,
    text: 2
}

export const expectedTypes:DataTypesInput = {
    int:{
        type: 'INTEGER',
        tableOptions: 'Primary KEY'
    },
    float:{
        type:'FLOAT',
        tableOptions: ''
    },
    boolean:{
        type: 'BOOLEAN',
        tableOptions: ''
    },
    datetime:{
        type: 'DATETIME',
        tableOptions: ''
    },
    text:{
        type: 'TEXT',
        tableOptions: ''
    }
}
