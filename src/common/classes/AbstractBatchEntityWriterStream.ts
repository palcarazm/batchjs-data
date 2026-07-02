import { ObjectWritable, ObjectWritableOptions, WriteCallback, BatchData } from "batchjs";

/**
 * @interface
 * Options for the AbstractBatchEntityWriterStream.
 * @extends ObjectWritableOptions
 */
export interface AbstractBatchEntityWriterStreamOptions extends ObjectWritableOptions {
    /** The maximum number of entities to write at once. */
    batchSize: number;
}

/**
 * @class
 * Class that enable to implement classes to write data in batches of a specified size in different types of data storage.
 * @extends ObjectWritable
 * @template T
 */
export abstract class AbstractBatchEntityWriterStream<T> extends ObjectWritable<T> {
    protected buffer: BatchData<T> = [];
    private readonly batchSize: number;

    /**
     
     * @param {AbstractBatchEntityWriterStreamOptions} options - The options for the AbstractBatchEntityWriterStream.
     */
    constructor(options: AbstractBatchEntityWriterStreamOptions) {
        super(options);
        this.batchSize = options.batchSize;
    }

    /**
     * A method to write data to the stream, push the chunk to the buffer, and execute the callback.
     *
     * @param {T} chunk - The data chunk to write to the stream.
     * @param {BufferEncoding} encoding - The encoding of the data.
     * @param {WriteCallback} callback - The callback function to be executed after writing the data.
     */
    _write(chunk: T, encoding: BufferEncoding, callback: WriteCallback): void {
        this.buffer.push(chunk);
        if (this.buffer.length >= this.batchSize) {
            this._flush()
                .then(() => callback())
                .catch((error) => callback(error));
        } else {
            callback();
        }
    }

    /**
     * Finalizes the stream by pushing remaining data batches, handling errors,
     * and executing the final callback.
     *
     * @param {WriteCallback} callback - The callback function to be executed after finalizing the stream.
     * @return {Promise<void>} This function does not return anything.
     */
    _final(callback: WriteCallback): void {
        this._flush()
            .then(() => callback())
            .catch((error) => callback(error));
    }

    /**
     * Creates a batch of data from the buffer and flushes it to the storage.
     * 
     * @private
     * @returns {Promise<void>}
     */
    private async _flush(): Promise<void> {
        if (this.buffer.length === 0) return Promise.resolve();
        const batch = [...this.buffer];
        this.buffer = [];
        try {
            await this.batchWrite(batch);
        } catch (error) {
            this.buffer.unshift(...batch);
            return Promise.reject(error as Error);
        }
    }

    /**
     * Writes a batch of data to the storage. This method should be implemented
     * by subclasses to define the specific logic for writing a batch of data.
     *
     * @protected
     * @abstract
     * @param {BatchData<T>} chunk - The batch of data to write to the storage.
     * @returns {Promise<void>} A promise that resolves when the batch is successfully written.
     *                           The promise should be rejected if there is an error during writing.
     */
    protected abstract batchWrite(chunk: BatchData<T>): Promise<void>;

}