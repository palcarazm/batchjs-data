import sqlite3 from "sqlite3";
import {open} from "sqlite";
import { DB } from "../utils/db";
import { UserDTO } from "./UserDTO";

export class UserDatabase{
    static readonly db = open({filename: DB.dbPath, driver: sqlite3.Database}); 
    
    static async setup(): Promise<void> {
        const db = await UserDatabase.db;
        return db.exec(
            `CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY,
            username TEXT NOT NULL
            )`)
            .then(() => db.exec("DELETE FROM users"));
    }

    static async mockData(data:UserDTO[]): Promise<void[]> {
        const db = await UserDatabase.db;
        return Promise.all(
            data.map((user) => {
                return db.exec(`INSERT INTO users (id, username) VALUES (${user.id}, '${user.username}')`);
            })
        );
    }


    static async teardown(): Promise<void> {
        const db = await UserDatabase.db;
        return db.exec("DROP TABLE IF EXISTS users");
    }
}