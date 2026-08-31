 
import { createPool, Pool } from "mariadb";
import { MariaDbContainer, StartedMariaDbContainer } from "@testcontainers/mariadb";
import { UserDTO } from "./UserDTO";

export class UserDatabase {
    private static container: StartedMariaDbContainer | null = null;
    private static pool: Pool | null = null;

    static async startContainer(): Promise<void> {
        if (UserDatabase.container) return;

        const image = process.env.MARIADB_IMAGE || "mariadb:latest";
        UserDatabase.container = await new MariaDbContainer(image)
            .withDatabase("testdb")
            .withUsername("test")
            .withUserPassword("test")
            .withRootPassword("test")
            .start();

        UserDatabase.pool = createPool({
            host: UserDatabase.container.getHost(),
            port: UserDatabase.container.getPort(),
            user: "test",
            password: "test",
            database: "testdb",
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
                )
            `);
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
            return await connection.query<UserDTO[]>("SELECT id, username FROM users");
        } finally {
            connection.release();
        }
    }
}
