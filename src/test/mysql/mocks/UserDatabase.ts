/* eslint-disable @typescript-eslint/no-explicit-any */
import { createPool, Pool } from "mysql2/promise";
import { MySqlContainer, StartedMySqlContainer } from "@testcontainers/mysql";
import { UserDTO } from "./UserDTO";

export class UserDatabase {
    private static container: StartedMySqlContainer | null = null;
    private static pool: Pool | null = null;

    static async startContainer(): Promise<void> {
        if (UserDatabase.container) return;

        const image = process.env.MYSQL_IMAGE || "mysql:latest";
        UserDatabase.container = await new MySqlContainer(image)
            .withDatabase("testdb")
            .withUsername("test")
            .withRootPassword("test")
            .withUserPassword("test")
            .start();

        UserDatabase.pool = createPool({
            host: UserDatabase.container.getHost(),
            port: UserDatabase.container.getPort(),
            user: "test",
            password: "test",
            database: "testdb",
            waitForConnections: true,
            connectionLimit: 10,
        });
    }

    static async stopContainer(): Promise<void> {
        if (UserDatabase.pool) {
            await UserDatabase.pool.end();
            UserDatabase.pool = null;
        }

        if (UserDatabase.container) {
            await UserDatabase.container.stop();
            UserDatabase.container = null;
        }
    }

    static getPool(): Pool {
        if (!UserDatabase.pool) {
            throw new Error("Container not started. Call startContainer() first.");
        }
        return UserDatabase.pool;
    }

    static async setup(): Promise<void> {
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
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    static async teardown(): Promise<void> {
        const pool = UserDatabase.getPool();
        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();
            await connection.query("DROP TABLE IF EXISTS users");
            await connection.commit();
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    static async load(data: UserDTO[]): Promise<void> {
        if (data.length === 0) return;

        const pool = UserDatabase.getPool();
        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();
            for (const user of data) {
                await connection.query("INSERT INTO users (id, username) VALUES (?, ?)", [
                    user.id,
                    user.username,
                ]);
            }
            await connection.commit();
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    static async fetch(): Promise<UserDTO[]> {
        const pool = UserDatabase.getPool();
        const connection = await pool.getConnection();

        try {
            const [rows] = await connection.query("SELECT id, username FROM users");
            return (rows as any[]).map((row) => new UserDTO(row.id, row.username));
        } finally {
            connection.release();
        }
    }
}
