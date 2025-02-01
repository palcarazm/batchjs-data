import { MysqlBatchEntityWriter } from "../../../src/mysql";
import { UserDTO } from "./UserDTO";
import { UserDatabase } from "./UserDatabase";
import { UserEntity } from "./UserEntity";

export class UserBatchWriter extends MysqlBatchEntityWriter<UserDTO, UserEntity> {
  constructor(options: { batchSize: number }) {
    super({
      batchSize: options.batchSize,
      pool: UserDatabase.getPool(),
      prepareStatement: "INSERT INTO users (id, username) VALUES (?, ?)",
    });
  }

  protected entityToRow(entity: UserDTO): UserEntity {
    return [entity.id, entity.username];
  }
}
