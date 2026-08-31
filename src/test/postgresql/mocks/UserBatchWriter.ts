import { PoolClient } from "pg";
import { PostgresBatchEntityWriter } from "../../../main/postgresql";
import { UserDTO } from "./UserDTO";
import { UserDatabase } from "./UserDatabase";

export class UserBatchWriter extends PostgresBatchEntityWriter<UserDTO> {
    constructor(options: { batchSize: number }) {
        super({
            batchSize: options.batchSize,
            pool: UserDatabase.getPool(),
            saveEntity: (entity: UserDTO, client: PoolClient) => client.query<void[]>({
                text: "INSERT INTO users (id, username) VALUES ($1, $2)",
                values: [entity.id, entity.username],
            }).then(() => {}),
        });
    }
}
