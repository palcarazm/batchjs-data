import { ObjectReadable, ObjectReadableOptions, BatchData } from "batchjs";

/**
 * @interface
 * Options for the AbstractBatchEntityReaderStream.
 * @extends ObjectReadableOptions
 */
export interface AbstractBatchEntityReaderStreamOptions extends ObjectReadableOptions {
    batchSize: number;
}

/**
 * @class
 * Class that enable to implement classes to read data in batches of a specified size in different types of data storage.
 * @extends ObjectReadable
 * @template T
 */
export abstract class AbstractBatchEntityReaderStream<T> extends ObjectReadable {
    private reading: boolean = false;
    protected buffer: BatchData<T> = [];
    private readonly batchSize: number;

    /**
     * @constructor
     * @param {AbstractBatchEntityReaderStreamOptions} options - The options for the AbstractBatchEntityReaderStream.
     * @param [options.batchSize] {number} - The maximum number of elements in a batch.
     */
    constructor(options: AbstractBatchEntityReaderStreamOptions) {
        super(options);
        this.batchSize = options.batchSize;
    }

    /**
     * Reads a batch of data from the data storage and pushes it to the consumer stream.
     * If the size parameter is not specified, it reads the number of entities specified in the `batchSize` option.
     * If the size parameter is specified, it reads the minimum of the size and the `batchSize` option.
     * If no data is available, it pushes null to the consumer stream to signal that the end of the stream has been reached.
     * If an error occurs while reading data, it emits an error event to the stream.
     *
     * @param {number} [size] - The size parameter for controlling the read operation.
     * @returns {Promise<void>} A promise that resolves when the data has been read and pushed to the consumer stream.
     */
    async _read(size: number): Promise<void> {
        if (this.reading) return;
        this.reading = true;
        try {
            const entities: T[] = await this.fetch(Math.min(size, this.batchSize));
            if (entities.length === 0) {
                this.push(null);
            }else{
                this.buffer.push(...entities);
                await this._flush();
            }
        } catch (error) {
            this.emit("error", error as Error);
        }finally{
            this.reading = false;
        }
    }

    /**
     * Flushes the buffer by pushing its content to the consumer stream. If the consumer stream is not ready to receive data, it waits for the drain event and flushes the buffer again when it is emitted.
     * This function is recursive and will keep flushing the buffer until it is empty.
     *
     * @private
     * @returns {Promise<void>} A promise that resolves when the buffer is flushed.
     */
    private async _flush():Promise<void>{
        while (this.buffer.length > 0) {
            const chunk = this.buffer.shift() as T;
            if (!this.push(chunk)) {
                this.buffer.unshift(chunk);
                await new Promise<void>((resolve) => this.once("drain", resolve));
            }
        }
        return Promise.resolve();
    };

    /**
     * Abstract method for fetching data from the data storage. This method should be implemented
     * by subclasses to define the specific logic for reading a batch of data.
     * 
     * @protected
     * @abstract
     * @param size {number} - The size parameter for controlling the read operation.
     * @returns {Promise<T[]>} A promise that resolves with an array of entities.
     */
    protected abstract fetch(size: number): Promise<T[]>;

}