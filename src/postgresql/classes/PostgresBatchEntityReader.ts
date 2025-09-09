import { Pool, PoolClient } from "pg";
import { AbstractBatchEntityReaderStream, AbstractBatchEntityReaderStreamOptions } from "../../common/index";
import { BatchData } from "batchjs";

/**
 * @interface
 * Options for the PostgresBatchEntityReader.
 * @extends AbstractBatchEntityReaderStreamOptions
 * @template T chunk entity
 * @template E row entity
 */
export interface PostgresBatchEntityReaderOptions<T,E> extends AbstractBatchEntityReaderStreamOptions {
    pool: Pool; // The PostgreSQL connection pool
    query: string; // SQL query (without LIMIT and OFFSET)
    rowToEntity:(row: E) => T
}

/**
 * @class
 * Class that reads data in batches of a specified size using PostgreSQL cursors.
 * @extends AbstractBatchEntityReaderStream
 * @template T chunk entity
 * @template E row entity
 */
export class PostgresBatchEntityReader<T,E> extends AbstractBatchEntityReaderStream<T> {
    private readonly pool: Pool;
    private readonly query: string;
    private readonly rowToEntity:(row: E) => T;
    private client: PoolClient | null = null;
    private cursorName: string | null = null;
    private cursorOpened: boolean = false;

    /**
     * @constructor
     * @param {PostgresBatchEntityReaderOptions} options - The options for the PostgresBatchEntityReader.
     * @param [options.pool] {Pool} - The PostgreSQL connection pool.
     * @param [options.query] {string} - SQL query to be executed (without LIMIT and OFFSET).
     * @param [options.rowToEntity] {Function} - Function that converts a row to an entity.
     */
    constructor(options: PostgresBatchEntityReaderOptions<T,E>) {
        super(options);
        this.pool = options.pool;
        this.query = options.query;
        this.rowToEntity = options.rowToEntity;
    }

    /**
     * Fetches a batch of data using a PostgreSQL cursor.
     * 
     * @protected
     * @param {number} size - The size of the batch to fetch.
     * @returns {Promise<BatchData<T>>} A promise that resolves with the batch of data.
     */
    protected fetch(size: number): Promise<BatchData<T>> {
        return this.initializeCursor()
            .then(({cursorName,client})=>client.query({
                text: `FETCH ${size} FROM ${cursorName};`,
            }))
            .then((result) => result.rows.map(this.rowToEntity));
    }

    /**
     * Initializes the cursor for the query if not already initialized.
     * 
     * @private
     * @returns {Promise<{cursorName:string,client:PoolClient}>} A promise that resolves when the cursor is initialized.
     */
    private async initializeCursor(): Promise<{cursorName:string,client:PoolClient}> {
        if (!this.cursorOpened ) {
            this.cursorName = `cursor_${Date.now()}`;
            return this.pool.connect()
                .then((client) => {
                    this.client = client;
                    return this.client.query("BEGIN;");
                })
                .then(() => (this.client as PoolClient).query(`DECLARE ${this.cursorName} CURSOR FOR ${this.query};`))
                .then(() => {
                    this.cursorOpened = true;
                })
                .then(() => ({cursorName:this.cursorName as string,client:this.client as PoolClient}));
        }
        return Promise.resolve({cursorName:this.cursorName as string,client:this.client as PoolClient});
    }

    /**
     * Closes the cursor and releases the client connection.
     * 
     * @private
     * @returns {Promise<void>} A promise that resolves when the cursor is closed.
     */
    private async closeCursor(): Promise<void> {
        if (this.cursorOpened && this.cursorName && this.client) {
            try {
                await this.client.query(`CLOSE ${this.cursorName};`);
                await this.client.query("COMMIT;");
            } finally {
                this.client.release();
                this.client = null;
                this.cursorName = null;
                this.cursorOpened = false;
            }
        }
    }

    /**
     * Destroys the reader by closing the cursor and releasing resources.
     * 
     * @param {Error|null} error - The error that caused the destruction.
     * @param {Function} callback - The callback function to be executed after destruction.
     */
    _destroy(error: Error | null, callback: (error?: Error | null) => void): void {
        let destroyError = error;

        this.closeCursor()
            .catch((error) => {destroyError = error;})
            .finally(() => super._destroy(destroyError, callback));
    }
}
