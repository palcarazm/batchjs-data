import { PostgresBatchEntityReader } from "../../../src/postgresql";
import { UserDatabase } from "./UserDatabase";
import { UserDTO } from "./UserDTO";

 export class UserBatchReader extends PostgresBatchEntityReader<UserDTO> {
      constructor(options:{batchSize:number,query?:string}) {
        super({
          batchSize: options.batchSize,
          pool: UserDatabase.getPool(),
          query: options.query || "SELECT id, username FROM users"
        });
      }
      protected rowToEntity(row: unknown): UserDTO {
        return row as UserDTO;
      }
    }