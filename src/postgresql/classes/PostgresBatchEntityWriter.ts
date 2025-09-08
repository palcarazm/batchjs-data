import { Pool, PoolClient } from "pg";
import { AbstractBatchEntityWriterStream, AbstractBatchEntityWriterStreamOptions } from "../../common/index";
import { BatchData } from "batchjs";

/**
 * @interface
 * Options for the PostgresBatchEntityWriter.
 * @extends AbstractBatchEntityWriterStreamOptions
 */
export interface PostgresBatchEntityWriterOptions extends AbstractBatchEntityWriterStreamOptions {
    pool: Pool;
}

/**
 * @class
 * Class that writes data in batches of a specified size in PostgreSQL databases.
 * @extends AbstractBatchEntityWriterStream
 * @template T chunk entity
 */
export abstract class PostgresBatchEntityWriter<T> extends AbstractBatchEntityWriterStream<T> {
    private readonly pool: Pool;

    /**
     * @constructor
     * @param {PostgresBatchEntityWriterOptions} options - The options for the PostgresBatchEntityWriter.
     * @param [options.pool] {Pool} - The PostgreSQL connection pool.
     */
    constructor(options: PostgresBatchEntityWriterOptions) {
        super(options);
        this.pool = options.pool;
    }

    /**
     * Writes a batch of data to the storage.
     * 
     * @protected
     * @param {BatchData<T>} chunk - The batch of data to write to the storage.
     * @returns {Promise<void>}
     */
    protected async batchWrite(chunk: BatchData<T>): Promise<void> {
        const client: PoolClient = await this.pool.connect();
        try {
            await client.query("BEGIN");
            for (const entity of chunk) {
                await this.saveEntity(entity, client);
            }
            await client.query("COMMIT");
        } catch (error) {
            await client.query("ROLLBACK");
            return Promise.reject(error as Error);
        } finally {
            client.release();
        }
    }

    /**
     * Save or update an entity in the database.
     * 
     * @protected
     * @abstract
     * @param {T} entity - Entity to be saved or updated.
     * @param {PoolClient} client - The database client.
     * @returns {Promise<void>}
     */
    protected abstract saveEntity(entity: T, client: PoolClient): Promise<void>;
}
