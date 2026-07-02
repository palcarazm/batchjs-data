import { Pool, PoolClient } from "pg";
import { AbstractBatchEntityWriterStream, AbstractBatchEntityWriterStreamOptions } from "../../common/index";
import { BatchData } from "batchjs";

/**
 * @interface
 * Options for the PostgresBatchEntityWriter.
 * @extends AbstractBatchEntityWriterStreamOptions
 * @template T chunk entity
 */
export interface PostgresBatchEntityWriterOptions<T> extends AbstractBatchEntityWriterStreamOptions {
    /** The PostgreSQL connection pool. */
    pool: Pool;
    /** Function that saves an entity in the database. */
    saveEntity: (entity: T, client: PoolClient) => Promise<void>;
}

/**
 * @class
 * Class that writes data in batches of a specified size in PostgreSQL databases.
 * @extends AbstractBatchEntityWriterStream
 * @template T chunk entity
 */
export class PostgresBatchEntityWriter<T> extends AbstractBatchEntityWriterStream<T> {
    private readonly pool: Pool;
    private readonly saveEntity: (entity: T, client: PoolClient) => Promise<void>;

    /**
     
     * @param {PostgresBatchEntityWriterOptions} options - The options for the PostgresBatchEntityWriter.
     */
    constructor(options: PostgresBatchEntityWriterOptions<T>) {
        super(options);
        this.pool = options.pool;
        this.saveEntity = options.saveEntity;
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
}
