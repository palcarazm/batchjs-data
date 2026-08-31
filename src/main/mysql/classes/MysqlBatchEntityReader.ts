import { Pool, PoolConnection, RowDataPacket } from "mysql2/promise";
import { AbstractBatchEntityReaderStream, AbstractBatchEntityReaderStreamOptions } from "../../common/index.js";
import { BatchData, ReadCallback } from "batchjs";

/**
 * @interface
 * Options for the MysqlBatchEntityReader.
 * @extends AbstractBatchEntityReaderStreamOptions
 * @template T The type of the data to be read
 * @template E The type of the row data from the database
 */
export interface MysqlBatchEntityReaderOptions<T,E> extends AbstractBatchEntityReaderStreamOptions {
    /** The MySQL connection pool. */
    pool: Pool;
    /** SQL query to be executed (without LIMIT and OFFSET). */
    query: string;
    /** Function that converts a row to an entity. */
    rowToEntity:(row: E) => T
}

/**
 * @class
 * Class that reads data in batches of a specified size from a MySQL database.
 * @extends AbstractBatchEntityReaderStream
 * @template T The type of the data to be read
 * @template E The type of the row data from the database
 */
export class MysqlBatchEntityReader<T,E> extends AbstractBatchEntityReaderStream<T> {
    private readonly pool: Pool;
    private readonly query: string;
    private readonly rowToEntity:(row: E) => T;
    private client: PoolConnection | null = null;
    private entitiesRead: number = 0;

    /**
     
     * @param {MysqlBatchEntityReaderOptions} options - The options for the MysqlBatchEntityReader.
     */
    constructor(options: MysqlBatchEntityReaderOptions<T,E>) {
        super(options);
        this.pool = options.pool;
        this.query = options.query;
        this.rowToEntity = options.rowToEntity;
    }

    /**
     * Fetches a batch of data from the database.
     * 
     * @private
     * @param {number} size - The size of the batch to fetch.
     * @returns {Promise<BatchData<T>>} A promise that resolves with the batch of data.
     */
    protected async fetch(size: number): Promise<BatchData<T>> {
        return this.connectDatabase()
            .then((client) => client.query<RowDataPacket[]>(`${this.query} LIMIT ${size} OFFSET ${this.entitiesRead}`))
            .then(([results]) => {
                this.entitiesRead += size;
                return (results as E[]).map(this.rowToEntity);
            });
    }


    /**
     * Destroys the writer by closing the database connection. This method should be called when the
     * writer is no longer needed to free up resources.
     * @see AbstractBatchEntityReaderStream._destroy
     * @private
     * @param error {Error|null} - The error that caused the destruction.
     * @param callback {ReadCallback} - The callback function to be executed after destroying the reader.
     */
    _destroy(error: Error | null, callback: ReadCallback): void {
        let destroyError = error;
        this.disconnectDatabase()
            .catch((err) => (destroyError = err))
            .finally(() => super._destroy(destroyError, callback));
    }

    /**
     * Connects to the database by creating a new database connection if none
     * already exists, or by reusing an existing connection.
     * @private
     * @returns {Promise<PoolConnection>} A promise that resolves with the database connection.
     */
    private async connectDatabase(): Promise<PoolConnection> {
        this.client ??= await this.pool.getConnection();
        return this.client;
    }

    /**
     * Disconnects from the database by releasing the active database connection
     * and setting the client reference to null. This method should be called
     * when the reader is no longer needed to free up resources.
     * @returns {Promise<void>} A promise that resolves when the database connection
     * is successfully released.
     */
    private disconnectDatabase(): Promise<void> {
        if (this.client) {
            this.client.release();
            this.client = null;
        }
        return Promise.resolve();
    }
}