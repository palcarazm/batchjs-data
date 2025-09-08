import sqlite from "sqlite";
import { AbstractBatchEntityWriterStream, AbstractBatchEntityWriterStreamOptions } from "../../common/index";
import { BatchData, WriteCallback } from "batchjs";

/**
 * @interface
 * Options for the SqliteBatchEntityWriter.
 * @extends AbstractBatchEntityWriterStreamOptions
 */
export interface SqliteBatchEntityWriterOptions extends AbstractBatchEntityWriterStreamOptions {
    dbConnectionFactory: ()=>Promise<sqlite.Database>;
    prepareStatement: string;
}

/**
 * @class
 * Class that write data in batches of a specified size in SQLite databases.
 * @extends AbstractBatchEntityWriterStream
 * @template T
 */
export abstract class SqliteBatchEntityWriter<T> extends AbstractBatchEntityWriterStream<T> {
    private readonly dbConnectionFactory: ()=>Promise<sqlite.Database>;
    private readonly prepareStatementString: string;
    private saveEntityStatement: sqlite.Statement | null = null;

    /**
     * @constructor
     * @param {SqliteBatchEntityWriterOptions} options - The options for the SqliteBatchEntityWriter.
     * @param [options.dbConnectionFactory] {Function} - Function that creates a database connection.
     */
    constructor(options: SqliteBatchEntityWriterOptions) {
        super(options);
        this.dbConnectionFactory = options.dbConnectionFactory;
        this.prepareStatementString = options.prepareStatement;
    }

    /**
     * Writes a batch of data to the storage.
     *
     * @protected
     * @param {BatchData<T>} chunk - The batch of data to write to the storage.
     * @returns {Promise<void>} A promise that resolves when the batch is successfully written.
     *                           The promise should be rejected if there is an error during writing.
     */
    protected async batchWrite(chunk: BatchData<T>): Promise<void>{
        const db = await this.dbConnectionFactory();
        return db.exec("BEGIN TRANSACTION")
            .then(()=>this.executeBatch(db, chunk))
            .then(()=>this.commitTransaction(db))
            .catch((error) => {
                this.rollbackTransaction(db);
                return Promise.reject(error as Error);
            }).finally(async()=>{
                await this.finalizeStatement();
                await db.close();
            });
    }

    /**
     * Executes a batch of data in the database, commits the transaction if all
     * promises are resolved, or rolls back the transaction if any of the promises
     * are rejected.
     * 
     * @private
     * @param {sqlite3.Database} db - The database connection.
     * @param {BatchData<T>} chunk - The batch of data to write to the storage.
     * @returns {Promise<void[]>} A promise that resolves when all promises are resolved.
     */
    private async executeBatch(db: sqlite.Database, chunk: BatchData<T>) : Promise<void[]> {
        const stmt = await this.prepareStatement(db);
        const promises = chunk.map((entity) => this.saveEntity(entity, stmt));
        return Promise.all(promises);
    }

    /**
     * Commits the transaction if no errors occurred during the batch execution.
     * If an error occurred, the transaction is rolled back and the error is propagated.
     * 
     * @private
     * @param {sqlite.Database} db - The database connection.
     * @returns {Promise<void>} A promise that resolves when the transaction is committed.
     */
    private async commitTransaction(db: sqlite.Database):Promise<void> {
        return db.exec("COMMIT");
    }

    /**
     * Rolls back the transaction if an error occurred during the batch execution.
     * The error is propagated to the caller.
     * 
     * @private
     * @param {sqlite.Database} db - The database connection.
     * @returns {Promise<void>} A promise that resolves when the transaction is rolled back.
     */
    private async rollbackTransaction(db: sqlite.Database):Promise<void> {
        return db.exec("ROLLBACK");
    }

    /**
     * Prepares a statement for saving entities. If the statement has already been
     * prepared, it is reused.
     * @private
     * @param {sqlite.Database} db - The database connection.
     * @returns {Promise<sqlite.Statement>} The prepared statement.
     */
    private async prepareStatement(db: sqlite.Database): Promise<sqlite.Statement> {
        this.saveEntityStatement ??= await db.prepare(this.prepareStatementString);
        return this.saveEntityStatement;
    }

    /**
     * Finalizes the statement used to save entities. This method should be
     * called when the writer is no longer needed to free up resources.
     * 
     * @private
     */
    private async finalizeStatement(): Promise<void> {
        if (this.saveEntityStatement) {
            await this.saveEntityStatement.finalize();
            this.saveEntityStatement = null;
        }
    }

    /**
     * Finalizes the writer by calling the _final method of the superclass and
     * finalizing the statement used to save entities. This method should be
     * called when the writer is no longer needed to free up resources.
     * @see AbstractBatchEntityWriterStream._final
     * @private
     * @param callback {WriteCallback} - The callback function to be executed after finalizing the writer.
     * @returns {Promise<void>}
     */
    _final(callback: WriteCallback):void {
        super._final((error?:Error|null|undefined)=>{
            this.finalizeStatement()
                .then(()=>callback(error))
                .catch((error) => callback(error));
        });
    }

    /**
     * Save or update an entity in the database.This method should be implemented
     * by subclasses to define the specific logic for writing a batch of data.
     * 
     * @protected
     * @abstract
     * @param entity {T} - Entity to be added or updated in the database
     * @param stmt {sqlite.Statement} - Database Statement
     * @returns {Promise<void>}
     */
    protected abstract saveEntity(entity: T, stmt: sqlite.Statement): Promise<void>;

}