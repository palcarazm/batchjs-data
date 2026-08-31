 
import { Pool } from "pg";
import { PostgreSqlContainer, StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { UserDTO } from "./UserDTO";

export class UserDatabase {
    private static container: StartedPostgreSqlContainer | null = null;
    private static pool: Pool | null = null;

    static async startContainer(): Promise<void> {
        if (UserDatabase.container) return;

        const image = process.env.POSTGRESQL_IMAGE || "postgres:latest";
        UserDatabase.container = await new PostgreSqlContainer(image)
            .withDatabase("testdb")
            .withUsername("postgres")
            .withPassword("password")
            .start();

        UserDatabase.pool = new Pool({
            host: UserDatabase.container.getHost(),
            port: UserDatabase.container.getPort(),
            user: "postgres",
            password: "password",
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
        const client = await pool.connect();

        try {
            await client.query("BEGIN");
            await client.query(`
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY,
                    username TEXT NOT NULL
                )
            `);
            await client.query("DELETE FROM users");
            await client.query("COMMIT");
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    }

    static async teardown(): Promise<void> {
        const pool = UserDatabase.getPool();
        const client = await pool.connect();

        try {
            await client.query("BEGIN");
            await client.query("DROP TABLE IF EXISTS users");
            await client.query("COMMIT");
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    }

    static async load(data: UserDTO[]): Promise<void> {
        if (data.length === 0) return;

        const pool = UserDatabase.getPool();
        const client = await pool.connect();

        try {
            await client.query("BEGIN");
            for (const user of data) {
                await client.query(
                    "INSERT INTO users (id, username) VALUES ($1, $2)",
                    [user.id, user.username]
                );
            }
            await client.query("COMMIT");
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    }

    static async fetch(): Promise<UserDTO[]> {
        const pool = UserDatabase.getPool();
        const client = await pool.connect();

        try {
            const result = await client.query("SELECT id, username FROM users");
            return result.rows.map((row) => new UserDTO(row.id, row.username));
        } finally {
            client.release();
        }
    }
}
