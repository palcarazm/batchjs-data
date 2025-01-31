import { PoolClient } from "pg";
import { PostgresBatchEntityWriter } from "../../../src/postgresql";
import { UserDTO } from "./UserDTO";
import { UserDatabase } from "./UserDatabase";

export class UserBatchWriter extends PostgresBatchEntityWriter<UserDTO> {
  constructor(options: { batchSize: number }) {
    super({
      batchSize: options.batchSize,
      pool: UserDatabase.getPool(),
    });
  }
  protected saveEntity(entity: UserDTO, client: PoolClient): Promise<void> {
    return client.query({
      text: "INSERT INTO users (id, username) VALUES ($1, $2)",
      values: [entity.id, entity.username],
    }).then(() => {});
  }
}
