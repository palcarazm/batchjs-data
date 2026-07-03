/* eslint-disable @typescript-eslint/no-explicit-any */
import { ConnectionConfig, createConnection, createPool, Pool } from "mariadb";
import { UserDTO } from "./UserDTO";

export class UserDatabase {
    private static data: UserDTO[] = [];
    private static pool : Pool | null = null;

    static readonly mPrepareStatement = {
        execute: jest.fn(),
        close: jest.fn(),
    };
    static readonly mPoolClient = {
        prepare: jest.fn(() => Promise.resolve(UserDatabase.mPrepareStatement)),
        beginTransaction: jest.fn(),
        batch: jest.fn(),
        commit: jest.fn(),
        rollback: jest.fn(),
        release: jest.fn(),
    };

    static readonly mPool = {
        getConnection: jest.fn(() => Promise.resolve(UserDatabase.mPoolClient)),
    };

    private static getConnectionOptions(): ConnectionConfig {
        if (process.env.CI !== "true") {
            return {
                user: process.env.MARIADB_USER,
                password: process.env.MARIADB_PASSWORD,
                host: process.env.MARIADB_HOST,
                port: parseInt(process.env.MARIADB_PORT as string),
                database: process.env.MARIADB_DATABASE,
            };
        }
        return {};
    }
    static getPool(): Pool {
        if (!UserDatabase.pool){
            UserDatabase.pool = createPool(UserDatabase.getConnectionOptions());
        }
        return UserDatabase.pool;
    }

    static mockWriter() {
        const idSet: Set<number> = new Set();
        UserDatabase.mPoolClient.batch.mockImplementation(
            (sql: string, values: any[]) => {
                return Promise.all(
                    values.map((value) => {
                        const id = value[0] as number;
                        const username = value[1] as string;
                        if (idSet.has(id)) {
                            return Promise.reject(new Error("Duplicated ID"));
                        }
                        idSet.add(id);

                        UserDatabase.data.push(new UserDTO(id, username));
                        return Promise.resolve();
                    })
                );
            }
        );
    }

    static load(data: UserDTO[]): Promise<void> {
        if (process.env.CI !== "true") {
            if (data.length === 0) return Promise.resolve();
            return createConnection(UserDatabase.getConnectionOptions()).then(
                (connection) => {
                    return connection
                        .beginTransaction()
                        .then(() =>
                            connection.batch(
                                "INSERT INTO users (id, username) VALUES (?, ?)",
                                data.map((user) => [user.id, user.username])
                            )
                        )
                        .then(() => {
                            connection.commit();
                        })
                        .finally(() => connection.end());
                }
            );
        }

        UserDatabase.mPrepareStatement.execute.mockImplementation(
            ([size]: number[]) => {
                return data.splice(0, size);
            }
        );

        return Promise.resolve();
    }

    static async fetch(): Promise<UserDTO[]> {
        if (process.env.CI !== "true") {
            return createConnection(UserDatabase.getConnectionOptions())
                .then((connection) => {
                    return connection
                        .query("SELECT * FROM users")
                        .finally(() => connection.end());
                })
                .then((rows) => {
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

        return createConnection(UserDatabase.getConnectionOptions()).then(
            (connection) => {
                return connection
                    .beginTransaction()
                    .then(() =>
                        connection.query(
                            `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY,
        username TEXT NOT NULL
        )`
                        )
                    )
                    .then(() => connection.query("DELETE FROM users"))
                    .then(() => connection.commit())
                    .finally(() => connection.end());
            }
        );
    }

    static async teardown(): Promise<void> {
        if (process.env.CI === "true") {
            UserDatabase.data = [];
            UserDatabase.pool = null;
            return Promise.resolve();
        }

        return createConnection(UserDatabase.getConnectionOptions()).then(
            (connection) => {
                return connection
                    .beginTransaction()
                    .then(() => connection.query("DROP TABLE IF EXISTS users"))
                    .then(() => connection.commit())
                    .finally(() => {
                        connection.end();
                        UserDatabase.pool?.end();
                        UserDatabase.pool = null;
                    });
            }
        );
    }
}
