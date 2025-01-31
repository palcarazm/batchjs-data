import { ClientConfig, Pool } from "pg";
import { UserDTO } from "./UserDTO";

export class UserDatabase {
  private static data: UserDTO[] = [];
  private static pool: Pool | null = null;

  static readonly mPoolClient = {
    query: jest.fn(),
    release: jest.fn(),
  };

  static readonly mPool = {
    query: jest.fn(),
    connect: jest.fn(() => Promise.resolve(UserDatabase.mPoolClient)),
    end: jest.fn(),
  };

  private static getConnectionOptions(): ClientConfig {
    if (process.env.CI !== "true") {
      return {
        user: process.env.POSTGRESQL_USER,
        password: process.env.POSTGRESQL_PASSWORD,
        host: process.env.POSTGRESQL_HOST,
        port: parseInt(process.env.POSTGRESQL_PORT as string),
        database: process.env.POSTGRESQL_DATABASE,
      };
    }
    return {};
  }

  static getPool(): Pool {
    if (!UserDatabase.pool) {
      UserDatabase.pool = new Pool(UserDatabase.getConnectionOptions());
    }
    return UserDatabase.pool;
  }

  static mockWriter() {
    const idSet: Set<number> = new Set();

    UserDatabase.mPoolClient.query.mockImplementation(
      (query: { text: string; values: any[] } | string) => {
        if (typeof query === "string") {
          return Promise.resolve({});
        }

        if (query.text === "INSERT INTO users (id, username) VALUES ($1, $2)") {
          const id = query.values[0] as number;
          const username = query.values[1] as string;

          if (idSet.has(id)) {
            return Promise.reject(new Error("Duplicated ID"));
          }
          idSet.add(id);

          UserDatabase.data.push(new UserDTO(id, username));
          return Promise.resolve({});
        }

        return Promise.resolve({});
      }
    );
  }

  static load(data: UserDTO[]): Promise<void> {
    if (process.env.CI !== "true") {
      return UserDatabase.getPool()
        .connect()
        .then((client) => {
          return client
            .query("BEGIN")
            .then(() =>
              Promise.all(
                data
                  .map((user) => [user.id, user.username])
                  .map((row) =>
                    client.query(
                      `INSERT INTO users (id, username) VALUES ($1, $2)`,
                      row
                    )
                  )
              )
            )
            .then(() => {client.query("COMMIT")})
            .finally(() => client.release());
        });
    }

    UserDatabase.mPoolClient.query.mockImplementation((query: any) => {
      if (typeof query === "string") {
        return Promise.resolve({ rows: [] });
      }

      const fetchMatch = query.text.match(/FETCH (\d+) FROM/);
      if (fetchMatch) {
        const fetchSize = parseInt(fetchMatch[1], 10);
        return Promise.resolve({ rows: data.splice(0, fetchSize) });
      }

      return Promise.resolve({ rows: [] });
    });
    return Promise.resolve();
  }

  static async fetch(): Promise<UserDTO[]> {
    if (process.env.CI !== "true") {
      return UserDatabase.getPool()
        .connect()
        .then((connection) => {
          return connection
            .query("SELECT * FROM users")
            .finally(() => connection.release());
        })
        .then(({ rows }) => {
          return rows.map((row: unknown) => {
            return row as UserDTO;
          });
        });
    }
    return Promise.resolve(UserDatabase.data);
  }

  static async setup(): Promise<void> {
    if (process.env.CI === "true") {
      UserDatabase.data = [];
      UserDatabase.mockWriter();
      return Promise.resolve();
    }

    return UserDatabase.getPool()
      .connect()
      .then((connection) => {
        return connection
          .query("BEGIN")
          .then(() =>
            connection.query(
              `CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY,
          username TEXT NOT NULL
          )`
            )
          )
          .then(() => {
            connection.query(`DELETE FROM users`);
          })
          .then(() => {
            connection.query("COMMIT");
          })
          .catch(() => {
            connection.query("ROLLBACK");
          })
          .finally(() => connection.release());
      });
  }

  static async teardown(): Promise<void> {
    if (process.env.CI === "true") {
      UserDatabase.data = [];
      UserDatabase.pool = null;
      return Promise.resolve();
    }

    return UserDatabase.getPool()
      .connect()
      .then((connection) => {
        return connection
          .query("BEGIN")
          .then(() => connection.query(`DROP TABLE IF EXISTS users`))
          .then(() => {
            connection.query("COMMIT");
          })
          .catch(() => {
            connection.query("ROLLBACK");
          })
          .finally(() => {
            connection.release();
            UserDatabase.pool?.end();
            UserDatabase.pool = null;
          });
      });
  }
}
