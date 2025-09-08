import { Pool, PoolConnection, Prepare } from "mariadb";
import { AbstractBatchEntityReaderStream, AbstractBatchEntityReaderStreamOptions } from "../../common/index";
import { BatchData, ReadCallback } from "batchjs";

/**
 * @interface
 * Options for the MariadbBatchEntityReader.
 * @extends AbstractBatchEntityReaderStreamOptions
 */
export interface MariadbBatchEntityReaderOptions extends AbstractBatchEntityReaderStreamOptions {
    pool: Pool;
    query: string;
}

/**
 * @class
 * Class that read data in batches of a specified size in Mariadb databases.
 * @extends AbstractBatchEntityReaderStream
 * @template T chunk entity
 * @template E row entity
 */
export abstract class MariadbBatchEntityReader<T,E> extends AbstractBatchEntityReaderStream<T> {
    private readonly pool: Pool;
    private readonly query: string;
    private client: PoolConnection | null = null;
    private fetchEntityStatement: Prepare | null = null;
    private entitiesRead : number = 0;

    /**
     * @constructor
     * @param {MariadbBatchEntityReaderOptions} options - The options for the MariadbBatchEntityReader.
     * @param [options.pool] {Pool} - The MariadbQL connection pool.
     * @param [options.query] {string} - SQL query to be executed (without LIMIT and OFFSET).
     */
    constructor(options: MariadbBatchEntityReaderOptions) {
        super(options);
        this.pool = options.pool;
        this.query = options.query;
    }

    /**
     * Fetches a batch of data from the database.
     * 
     * @private
     * @param {number} size - The size of the batch to fetch.
     * @returns {Promise<BatchData<T>>} A promise that resolves with the batch of data.
     */
    protected async fetch(size:number): Promise<BatchData<T>> {
        return this.connectDatabase()
            .then((client)=>this.prepareStatement(client))
            .then((statement) => statement.execute([size,this.entitiesRead ]))
            .then((results: E[]) => {
                this.entitiesRead += size;
                return results.map(this.rowToEntity);
            });
    }

    /**
     * Destroys the writer by finalizing the statement used to read entities and
     * closing the database connection. This method should be called when the
     * writer is no longer needed to free up resources.
     * @see AbstractBatchEntityReaderStream._destroy
     * @private
     * @param error {Error|null} - The error that caused the destruction.
     * @param callback {ReadCallback} - The callback function to be executed after destroying the reader.
     */
    _destroy(error: Error | null, callback: ReadCallback):void {
        let destroyError = error;

        this.finalizeStatement()
            .then(()=>this.disconnectDatabase())
            .catch((error) => {destroyError = error;})
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
     * Disconnects from the database by closing the active database connection
     * and setting the connection reference to null. This method should be called
     * when the reader is no longer needed to free up resources.
     * @returns {Promise<void>} A promise that resolves when the database connection
     * is successfully closed.
     */
    private async disconnectDatabase(): Promise<void> {
        if (this.client) {
            await this.client.release();
            this.client = null;
        }
    }

    /**
     * Prepares a statement for fetching entities. If the statement has already been
     * prepared, it is reused.
     * @private
     * @param {Mariadb.Database} db - The database connection.
     * @returns {Promise<Mariadb.Statement>} The prepared statement.
     */
    private async prepareStatement(client: PoolConnection): Promise<Prepare> {
        this.fetchEntityStatement ??= await client.prepare( `${this.query} LIMIT ? OFFSET ?`);
        return this.fetchEntityStatement;
    }
    
    /**
     * Finalizes the statement used to fetch entities. This method should be
     * called when the reader is no longer needed to free up resources.
     * 
     * @private
     */
    private async finalizeStatement(): Promise<void> {
        if (this.fetchEntityStatement) {
            this.fetchEntityStatement.close();
            this.fetchEntityStatement = null;
        }
    }


    /**
     * Abstract method to convert a row to an entity. This method should be implemented
     * by subclasses to define the specific logic for reading a batch of data.
     * 
     * @abstract
     * @protected
     * @param row {E} - The row to be converted to an entity.
     */
    protected abstract rowToEntity(row: E): T
}