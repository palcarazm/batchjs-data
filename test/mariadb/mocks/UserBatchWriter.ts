import { MariadbBatchEntityWriter } from "../../../src/mariadb";
import { UserDTO } from "./UserDTO";
import { UserDatabase } from "./UserDatabase";
import { UserEntity } from "./UserEntity";

export class UserBatchWriter extends MariadbBatchEntityWriter<UserDTO,UserEntity> {
  constructor(options: { batchSize: number }) {
    super({
      batchSize: options.batchSize,
      pool: UserDatabase.getPool(),
      prepareStatement: "INSERT INTO users (id, username) VALUES (?, ?)",
      entityToRow: (entity: UserDTO) => [entity.id, entity.username],
    });
  }
}
