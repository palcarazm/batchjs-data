import { ObjectReadable, ObjectReadableOptions, BatchData, ExtendableReadableEventMap } from "batchjs";

/**
 * @interface
 * Options for the AbstractBatchEntityReaderStream.
 * @extends ObjectReadableOptions
 */
export interface AbstractBatchEntityReaderStreamOptions extends ObjectReadableOptions {
    /** The maximum number of entities to read at once. */
    batchSize: number;
}

/**
 * @class
 * Class that enable to implement classes to read data in batches of a specified size in different types of data storage.
 * @extends ObjectReadable
 * @template T
 */
export abstract class AbstractBatchEntityReaderStream<T> extends ObjectReadable<T, ExtendableReadableEventMap<T,{
    drain: void;
}>> {
    private reading: boolean = false;
    private finished: boolean = false;
    private awaitingDrain: boolean = false;
    protected buffer: BatchData<T> = [];
    private readonly batchSize: number;

    /**
     
     * @param {AbstractBatchEntityReaderStreamOptions} options - The options for the AbstractBatchEntityReaderStream.
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
     */
    _read(size: number): void {
        if (this.reading)
            return;
        this.reading = true;
        this.fetch(Math.min(size, this.batchSize))
            .then((entities) => {
                if (entities.length === 0 && !this.finished) {
                    this.finished=true;
                }
                else {
                    this.buffer.push(...entities);
                }
            })
            .then(()=>this._flush())
            .catch((error) => this.emit("error", error))
            .finally(() => {
                this.reading = false;
            });
    }

    /**
     * Flushes the buffer by pushing its content to the consumer stream. If the consumer stream is not ready to receive data, it waits for the drain event and flushes the buffer again when it is emitted.
     * This function is recursive and will keep flushing the buffer until it is empty.
     *
     * @private
     * @returns {Promise<void>} A promise that resolves when the buffer is flushed.
     */
    private _flush():Promise<void>{
        while (this.buffer.length > 0 && !this.awaitingDrain) {
            const chunk = this.buffer.shift();
            if (!this.push(chunk)) {
                this.awaitingDrain=true;
                const timer = setTimeout(()=>this.emit("drain"), this.drainTimeout);
                this.once("drain", () => {
                    clearTimeout(timer);
                    this.awaitingDrain=false;
                    this._flush();
                });
                return Promise.resolve();
            }
        }
        if(this.buffer.length === 0 && this.finished){
            this.push(null);
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