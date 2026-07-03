import {Pool, PoolConnection} from "mariadb";
import { AbstractBatchEntityWriterStream, AbstractBatchEntityWriterStreamOptions } from "../../common/index.js";
import { BatchData } from "batchjs";

/**
 * @interface
 * Options for the MariadbBatchEntityWriter.
 * @extends AbstractBatchEntityWriterStreamOptions
 * @template T The type of the data to be written
 * @template E The type of the row data from the database
 */
export interface MariadbBatchEntityWriterOptions<T,E> extends AbstractBatchEntityWriterStreamOptions {
    /** The MariadbQL connection pool. */
    pool: Pool;
    /** The prepared statement for inserting entities. */
    prepareStatement: string;
    /** Function that converts an entity to a row. */
    entityToRow:(entity: T) => E
}

/**
 * @class
 * Class that writes data in batches of a specified size in MariadbQL databases.
 * @extends AbstractBatchEntityWriterStream
 * @template T The type of the data to be written
 * @template E The type of the row data from the database
 */
export class MariadbBatchEntityWriter<T,E> extends AbstractBatchEntityWriterStream<T> {
    private readonly pool: Pool;
    private readonly prepareStatement: string;
    private readonly entityToRow:(entity: T) => E;

    /**
     
     * @param {MariadbBatchEntityWriterOptions} options - The options for the MariadbBatchEntityWriter.
     */
    constructor(options: MariadbBatchEntityWriterOptions<T,E>) {
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
}
