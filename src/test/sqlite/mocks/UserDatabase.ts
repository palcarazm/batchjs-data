import { DatabaseSync, StatementResultingChanges } from "node:sqlite";
import { DB } from "../utils/db";
import { UserDTO } from "./UserDTO";

export class UserDatabase{
    static readonly db = Promise.resolve(new DatabaseSync(DB.dbPath));
    
    static async setup(): Promise<void> {
        const db = await UserDatabase.db;
        db.exec(
            `CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY,
            username TEXT NOT NULL
            )`)
        db.exec("DELETE FROM users");
    }

    static async mockData(data:UserDTO[]): Promise<StatementResultingChanges[]> {
        const db = await UserDatabase.db;
        const stmt = db.prepare("INSERT INTO users (id, username) VALUES (?, ?)");
        return Promise.all(
            data.map((user) => {
                return Promise.resolve(stmt.run(user.id, user.username));
            })
        );
    }


    static async teardown(): Promise<void> {
        const db = await UserDatabase.db;
        return db.exec("DROP TABLE IF EXISTS users");
    }
}