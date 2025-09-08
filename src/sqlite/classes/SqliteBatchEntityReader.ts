import sqlite from "sqlite";
import { AbstractBatchEntityReaderStream, AbstractBatchEntityReaderStreamOptions } from "../../common/index";
import { BatchData, ReadCallback } from "batchjs";

/**
 * @interface
 * Options for the SqliteBatchEntityReader.
 * @extends AbstractBatchEntityReaderStreamOptions
 */
export interface SqliteBatchEntityReaderOptions extends AbstractBatchEntityReaderStreamOptions {
    dbConnectionFactory: ()=>Promise<sqlite.Database>;
    query: string;
}

/**
 * @class
 * Class that read data in batches of a specified size in SQLite databases.
 * @extends AbstractBatchEntityReaderStream
 * @template T chunk entity
 * @template E row entity
 */
export abstract class SqliteBatchEntityReader<T,E> extends AbstractBatchEntityReaderStream<T> {
    private readonly dbConnectionFactory: ()=>Promise<sqlite.Database>;
    private dbConnection: sqlite.Database | null = null;
    private readonly query: string;
    private fetchEntityStatement: sqlite.Statement | null = null;
    private entitiesRead : number = 0;

    /**
     * @constructor
     * @param {SqliteBatchEntityReaderOptions} options - The options for the SqliteBatchEntityReader.
     * @param [options.dbConnectionFactory] {Function} - Function that creates a database connection.
     */
    constructor(options: SqliteBatchEntityReaderOptions) {
        super(options);
        this.dbConnectionFactory = options.dbConnectionFactory;
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
            .then((db)=>this.prepareStatement(db))
            .then((statement) => statement.all({ "@limit": size, "@offset": this.entitiesRead }))
            .then((results: E[]) => {
                this.entitiesRead += size;
                return results.map(this.rowToEntity);;
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
     * @returns {Promise<sqlite.Database>} A promise that resolves with the database connection.
     */
    private async connectDatabase(): Promise<sqlite.Database> {
        this.dbConnection ??= await this.dbConnectionFactory();
        return this.dbConnection;
    }

    /**
     * Disconnects from the database by closing the active database connection
     * and setting the connection reference to null. This method should be called
     * when the reader is no longer needed to free up resources.
     * @returns {Promise<void>} A promise that resolves when the database connection
     * is successfully closed.
     */
    private async disconnectDatabase(): Promise<void> {
        if (this.dbConnection) {
            await this.dbConnection.close();
            this.dbConnection = null;
        }
    }

    /**
     * Prepares a statement for fetching entities. If the statement has already been
     * prepared, it is reused.
     * @private
     * @param {sqlite.Database} db - The database connection.
     * @returns {Promise<sqlite.Statement>} The prepared statement.
     */
    private async prepareStatement(db: sqlite.Database): Promise<sqlite.Statement> {
        this.fetchEntityStatement ??= await db.prepare( `${this.query} LIMIT @limit OFFSET @offset`);
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
            await this.fetchEntityStatement.finalize();
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