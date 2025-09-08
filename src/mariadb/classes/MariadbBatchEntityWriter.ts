import {Pool, PoolConnection} from "mariadb";
import { AbstractBatchEntityWriterStream, AbstractBatchEntityWriterStreamOptions } from "../../common/index";
import { BatchData } from "batchjs";

/**
 * @interface
 * Options for the MariadbBatchEntityWriter.
 * @extends AbstractBatchEntityWriterStreamOptions
 */
export interface MariadbBatchEntityWriterOptions extends AbstractBatchEntityWriterStreamOptions {
    pool: Pool;
    prepareStatement: string;
}

/**
 * @class
 * Class that writes data in batches of a specified size in MariadbQL databases.
 * @extends AbstractBatchEntityWriterStream
 * @template T chunk entity
 * @template E row entity
 */
export abstract class MariadbBatchEntityWriter<T,E> extends AbstractBatchEntityWriterStream<T> {
    private readonly pool: Pool;
    private readonly prepareStatement: string;

    /**
     * @constructor
     * @param {MariadbBatchEntityWriterOptions} options - The options for the MariadbBatchEntityWriter.
     * @param [options.pool] {Pool} - The MariadbQL connection pool.
     * @param [options.prepareStatement] {String} - Insert SQL prepared statement to be executed.
     */
    constructor(options: MariadbBatchEntityWriterOptions) {
        super(options);
        this.pool = options.pool;
        this.prepareStatement = options.prepareStatement;
    }

    /**
     * Writes a batch of data to the storage.
     * 
     * @protected
     * @param {BatchData<T>} chunk - The batch of data to write to the storage.
     * @returns {Promise<void>}
     */
    protected async batchWrite(chunk: BatchData<T>): Promise<void> {
        const client: PoolConnection = await this.pool.getConnection();
        try {
            await client.beginTransaction();
            await client.batch(this.prepareStatement, chunk.map(this.entityToRow));
            await client.commit();
        } catch (error) {
            await client.rollback();
            return Promise.reject(error as Error);
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
