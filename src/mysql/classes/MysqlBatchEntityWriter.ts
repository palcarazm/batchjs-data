import { Pool, PoolConnection } from "mysql2/promise";
import { BatchData } from "batchjs";
import { AbstractBatchEntityWriterStream, AbstractBatchEntityWriterStreamOptions } from "../../common";

/**
 * @interface
 * Options for the MysqlBatchEntityWriter.
 * @extends AbstractBatchEntityWriterStreamOptions
 */
export interface MysqlBatchEntityWriterOptions extends AbstractBatchEntityWriterStreamOptions {
    pool: Pool;
    prepareStatement: string;
}

/**
 * @class
 * Class that writes data in batches of a specified size into a MySQL database.
 * @extends AbstractBatchEntityWriterStream
 * @template T chunk entity
 * @template E row entity
 */
export abstract class MysqlBatchEntityWriter<T,E> extends AbstractBatchEntityWriterStream<T> {
    private readonly pool: Pool;
    private readonly prepareStatement: string;

    /**
     * @constructor
     * @param {MysqlBatchEntityWriterOptions} options - The options for the MysqlBatchEntityWriter.
     * @param [options.pool] {Pool} - The MySQL connection pool.
     * @param [options.prepareStatement] {String} - Insert SQL prepared statement to be executed.
     */
    constructor(options: MysqlBatchEntityWriterOptions) {
        super(options);
        this.pool = options.pool;
        this.prepareStatement = options.prepareStatement;
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

    /**
     * Abstract method to convert an entity to a row.
     * This method should be implemented by subclasses to define the specific logic for writing a batch of data.
     * 
     * @abstract
     * @protected
     * @param {T} entity - The entity to be converted to a row.
     * @returns {E} The row to be inserted or updated.
     */
    protected abstract entityToRow(entity: T): E;
}
