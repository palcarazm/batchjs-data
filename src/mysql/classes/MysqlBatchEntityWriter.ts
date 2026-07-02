import { Pool, PoolConnection } from "mysql2/promise";
import { BatchData } from "batchjs";
import { AbstractBatchEntityWriterStream, AbstractBatchEntityWriterStreamOptions } from "../../common";

/**
 * @interface
 * Options for the MysqlBatchEntityWriter.
 * @extends AbstractBatchEntityWriterStreamOptions
 * @template T chunk entity
 * @template E row entity
 */
export interface MysqlBatchEntityWriterOptions<T,E extends Array<unknown>> extends AbstractBatchEntityWriterStreamOptions {
    /** The MySQL connection pool */
    pool: Pool;
    /** Insert SQL prepared statement to be executed */
    prepareStatement: string;
    /** Function that converts an entity to a row */
    entityToRow:(entity: T) => E
}

/**
 * @class
 * Class that writes data in batches of a specified size into a MySQL database.
 * @extends AbstractBatchEntityWriterStream
 * @template T chunk entity
 * @template E row entity
 */
export class MysqlBatchEntityWriter<T,E extends Array<unknown>> extends AbstractBatchEntityWriterStream<T> {
    private readonly pool: Pool;
    private readonly prepareStatement: string;
    private readonly entityToRow:(entity: T) => E;

    /**
     
     * @param {MysqlBatchEntityWriterOptions} options - The options for the MysqlBatchEntityWriter.
     */
    constructor(options: MysqlBatchEntityWriterOptions<T,E>) {
        super(options);
        this.pool = options.pool;
        this.prepareStatement = options.prepareStatement;
        this.entityToRow = options.entityToRow;
    }

    /**
     * Writes a batch of data to the storage.
     * 
     * @protected
     * @param {BatchData<T>} chunk - The batch of data to write to the storage.
     * @returns {Promise<void>} A promise that resolves when the batch is successfully written.
     *                          The promise should be rejected if there is an error during writing.
     */
    protected async batchWrite(chunk: BatchData<T>): Promise<void> {
        const client: PoolConnection = await this.pool.getConnection();
        try {
            await client.beginTransaction();
            await Promise.all(chunk.map((entity) => client.query(this.prepareStatement, this.entityToRow(entity))));
            await client.commit();
        } catch (error) {
            await client.rollback();
            throw error;
        } finally {
            client.release();
        }
    }
}
