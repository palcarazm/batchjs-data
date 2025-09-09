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
export interface MysqlBatchEntityWriterOptions<T,E> extends AbstractBatchEntityWriterStreamOptions {
    pool: Pool;
    prepareStatement: string;
    entityToRow:(entity: T) => E
}

/**
 * @class
 * Class that writes data in batches of a specified size into a MySQL database.
 * @extends AbstractBatchEntityWriterStream
 * @template T chunk entity
 * @template E row entity
 */
export class MysqlBatchEntityWriter<T,E> extends AbstractBatchEntityWriterStream<T> {
    private readonly pool: Pool;
    private readonly prepareStatement: string;
    private readonly entityToRow:(entity: T) => E;

    /**
     * @constructor
     * @param {MysqlBatchEntityWriterOptions} options - The options for the MysqlBatchEntityWriter.
     * @param [options.pool] {Pool} - The MySQL connection pool.
     * @param [options.prepareStatement] {String} - Insert SQL prepared statement to be executed.
     * @param [options.entityToRow] {Function} - Function that converts an entity to a row.
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
