/* eslint-disable @typescript-eslint/no-explicit-any */
import { Pool, createPool } from "mysql2/promise";
import { UserDTO } from "./UserDTO";

export class UserDatabase {
    private static data: UserDTO[] = [];
    private static pool: Pool | null = null;

    static readonly mPoolClient = {
        query: jest.fn<Promise<UserDTO[][] | void>, [string, any[]]>(),
        beginTransaction: jest.fn(),
        commit: jest.fn(),
        rollback: jest.fn(),
        release: jest.fn(),
    };

    static readonly mPool = {
        getConnection: jest.fn(() => Promise.resolve(UserDatabase.mPoolClient)),
    };

    private static getConnectionOptions() {
        if (process.env.CI !== "true") {
            return {
                user: process.env.MYSQL_USER,
                password: process.env.MYSQL_PASSWORD,
                host: process.env.MYSQL_HOST,
                port: parseInt(process.env.MYSQL_PORT as string),
                database: process.env.MYSQL_DATABASE,
                waitForConnections: true,
                connectionLimit: 10,
            };
        }
        return {};
    }

    static getPool(): Pool {
        if (!UserDatabase.pool) {
            UserDatabase.pool = createPool(UserDatabase.getConnectionOptions());
        }
        return UserDatabase.pool;
    }

    static mockQuery() {
        const idSet: Set<number> = new Set();
        UserDatabase.mPoolClient.query.mockImplementation((sql: string, values: any[]) => {
            if (sql.startsWith("INSERT")) {
                const [id, username] = values;
                if (idSet.has(id)) {
                    return Promise.reject(new Error("Duplicated ID"));
                }
                idSet.add(id);
                UserDatabase.data.push(new UserDTO(id, username));
                return Promise.resolve();
            }
            if (sql.startsWith("SELECT")) {
                const fetchMatch = sql.match(/LIMIT (\d+)/);
                if(fetchMatch) {
                    const fetchSize = parseInt(fetchMatch[1], 10);
                    return Promise.resolve( [UserDatabase.data.splice(0, fetchSize)]);
                }
            }
            return Promise.reject(new Error("Unknown query"));
        });
    }

    static async load(data: UserDTO[]): Promise<void> {
        if (process.env.CI !== "true") {
            if (data.length === 0) return;
            const pool = UserDatabase.getPool();
            const connection = await pool.getConnection();

            try {
                await connection.beginTransaction();
                await connection.query("INSERT INTO users (id, username) VALUES ?", [
                    data.map((user) => [user.id, user.username]),
                ]);
                await connection.commit();
            } catch (error) {
                await connection.rollback();
                throw error;
            } finally {
                connection.release();
            }
        } else {
            UserDatabase.data = Object.assign([], data);
        }
    }

    static async fetch(): Promise<UserDTO[]> {
        if (process.env.CI !== "true") {
            const pool = UserDatabase.getPool();
            const connection = await pool.getConnection();
            try {
                const [rows] = await connection.query("SELECT * FROM users");
                return (rows as any[]).map((row) => new UserDTO(row.id, row.username));
            } finally {
                connection.release();
            }
        }
        return Promise.resolve(UserDatabase.data);
    }

    static async setup(): Promise<void> {
        if (process.env.CI === "true") {
            UserDatabase.data = [];
            UserDatabase.mockQuery();
            return;
        }

        const pool = UserDatabase.getPool();
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            await connection.query(`
        CREATE TABLE IF NOT EXISTS users (
          id INT PRIMARY KEY,
          username VARCHAR(255) NOT NULL
        )`);
            await connection.query("DELETE FROM users");
            await connection.commit();
        } finally {
            connection.release();
        }
    }

    static async teardown(): Promise<void> {
        if (process.env.CI === "true") {
            UserDatabase.data = [];
            UserDatabase.pool = null;
            return;
        }

        const pool = UserDatabase.getPool();
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            await connection.query("DROP TABLE IF EXISTS users");
            await connection.commit();
        } finally {
            connection.release();
            await pool.end();
            UserDatabase.pool = null;
        }
    }
}
