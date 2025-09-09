import { MysqlBatchEntityReader } from "../../../src/mysql";
import { UserDTO } from "./UserDTO";
import { UserDatabase } from "./UserDatabase";

export class UserBatchReader extends MysqlBatchEntityReader<UserDTO, UserDTO> {
  constructor(options: { batchSize: number; query?: string }) {
    super({
      batchSize: options.batchSize,
      pool: UserDatabase.getPool(),
      query: options.query || "SELECT id, username FROM users",
      rowToEntity: (row: UserDTO) => row,
    });
  }
}
