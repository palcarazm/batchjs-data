import { PostgresBatchEntityReader } from "../../../src/postgresql";
import { UserDatabase } from "./UserDatabase";
import { UserDTO } from "./UserDTO";

 export class UserBatchReader extends PostgresBatchEntityReader<UserDTO, UserDTO> {
      constructor(options:{batchSize:number,query?:string}) {
        super({
          batchSize: options.batchSize,
          pool: UserDatabase.getPool(),
          query: options.query || "SELECT id, username FROM users"
        });
      }
      protected rowToEntity(row: UserDTO): UserDTO {
        return row as UserDTO;
      }
    }