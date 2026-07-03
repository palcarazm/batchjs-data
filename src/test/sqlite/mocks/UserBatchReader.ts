import sqlite3 from "sqlite3";
import  {open} from "sqlite";
import { SqliteBatchEntityReader } from "../../../main/sqlite";
import { UserDTO } from "./UserDTO";
import { DB } from "../utils/db";

export class UserBatchReader extends SqliteBatchEntityReader<UserDTO,UserDTO> {
    constructor(options:{batchSize:number,query?:string}) {
        super({
            batchSize: options.batchSize,
            dbConnectionFactory: () => { return open({filename: DB.dbPath, driver: sqlite3.Database});},
            query: options.query || "SELECT id, username FROM users",
            rowToEntity: (row: UserDTO) => row
        });
    }
}