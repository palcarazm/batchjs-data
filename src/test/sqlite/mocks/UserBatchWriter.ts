/// <reference types="node" />
import { DatabaseSync, StatementSync } from "node:sqlite";
import { SqliteBatchEntityWriter } from "../../../main/sqlite";
import { UserDTO } from "./UserDTO";
import { DB } from "../utils/db";

export class UserBatchWriter extends SqliteBatchEntityWriter<UserDTO> {
    constructor(options:{batchSize:number}){
        super({
            batchSize: options.batchSize,
            dbConnectionFactory: async () => new DatabaseSync(DB.dbPath),
            prepareStatement: "INSERT INTO users (id, username) VALUES (?, ?)",
            saveEntity: async (entity: UserDTO, stmt: StatementSync) => {
                stmt.run(entity.id, entity.username);
            }
        });
    }
}