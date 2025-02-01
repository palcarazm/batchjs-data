import sqlite3 from "sqlite3";
import sqlite, {open} from "sqlite";
import { SqliteBatchEntityWriter } from "../../../src/sqlite";
import { UserDTO } from "./UserDTO";
import { DB } from "../utils/db";

export class UserBatchWriter extends SqliteBatchEntityWriter<UserDTO> {
    constructor(options:{batchSize:number}){
        super({
            batchSize: options.batchSize,
            dbConnectionFactory: () => { return open({filename: DB.dbPath, driver: sqlite3.Database});},
            prepareStatement: "INSERT INTO users (id, username) VALUES (@id, @username)"
        });
    }
    protected saveEntity(entity: UserDTO, stmt: sqlite.Statement): Promise<void> {
        return stmt.all<void>({'@id': entity.id, '@username': entity.username});
    }
}