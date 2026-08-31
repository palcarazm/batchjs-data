/// <reference types="node" />
import { DatabaseSync } from "node:sqlite";
import { SqliteBatchEntityReader } from "../../../main/sqlite";
import { UserDTO } from "./UserDTO";
import { DB } from "../utils/db";

export class UserBatchReader extends SqliteBatchEntityReader<UserDTO,UserDTO> {
    constructor(options:{batchSize:number,query?:string}) {
        super({
            batchSize: options.batchSize,
            dbConnectionFactory: async () => new DatabaseSync(DB.dbPath),
            query: options.query || "SELECT id, username FROM users",
            rowToEntity: (row: UserDTO) => row
        });
    }
}