import { it, describe} from "vitest";
import { SqlSimplifier } from "../app";
import { DatabaseSync } from "node:sqlite";
import { typesAndOptions } from "../typesAndOptions";

const pathToDatabase: string = './test.db';
export const database = new DatabaseSync(pathToDatabase)
const db = new SqlSimplifier(pathToDatabase);



describe('Create table and Database', () =>{
    it('create database', ()=>{
        const users = db.createTable("users", {
          id:{
            type: typesAndOptions.types.INT,
            tableOptions: `${typesAndOptions.options.PK} ${typesAndOptions.options.AI} `
          }
        })
        console.log(users.columns)
        // expect(users.columns).toBe({
        //     type
        // })
    })
})