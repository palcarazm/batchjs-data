import { AbstractBatchEntityReaderStream } from "../../../src/common/index";

describe("AbstractBatchEntityReaderStream", () => {
    class AbstractBatchEntityReaderStreamImplementation extends AbstractBatchEntityReaderStream<string> {
        private chunks: string[];

        constructor(chunks: string[], batchSize: number) {
            super({ batchSize });
            this.chunks = chunks;
        }
    
        protected async fetch(size: number): Promise<string[]> {
            const batch = this.chunks.splice(0, size);
            return Promise.resolve(batch);
        }
    }

    let reader: AbstractBatchEntityReaderStreamImplementation;
    let chunks: Array<string>;
    const data: Array<string> = ["A", "B", "C", "D", "E", "F"];
    Object.freeze(data);

    beforeEach(() => {
        chunks = Object.assign([], data);
        reader = new AbstractBatchEntityReaderStreamImplementation(chunks, 2);
    });

    test('should emit end event when all data is read', (done) => {
        reader = new AbstractBatchEntityReaderStreamImplementation([], 2);
        const result: string[] = [];

        reader.on("data", (chunk) => {
            result.push(chunk);
        });

        reader.on("end", () => {
            expect(result).toEqual([]);
            done();
        });
        
        reader.read();
    });

    test('should emit data in batches', (done) => {
        const result: string[] = [];

        reader.on("data", (chunk) => {
            result.push(chunk);
        });

        reader.on("end", () => {
            expect(result).toEqual(data);
            done();
        });
    });


    test('should handle backpressure', (done) => {
        const result: string[] = [];
        const spy = jest.spyOn(reader, "push");

        reader.on("data", (chunk) => {
            result.push(chunk);

            if (result.length === 2) {
                spy.mockImplementationOnce((data) => {
                    reader.emit('data',data);
                    return false;
                });
                setTimeout(()=>{
                    reader.emit("drain");
                },50);
            }
        });

        reader.on("end", () => {
            expect(result).toEqual(data);
            expect(spy).toHaveBeenCalledTimes(data.length + 1);
            done();
        });

        reader.read();
    });

    test('should emit error if fetch fails', (done) => {
        const faultyReader = new AbstractBatchEntityReaderStreamImplementation([], 2);

        jest.spyOn(faultyReader as any, "fetch").mockImplementation(() => {
            return Promise.reject(new Error("Simulated fetch error"));
        });

        faultyReader.on("error", (err) => {
            expect(err).toBeInstanceOf(Error);
            expect(err.message).toBe("Simulated fetch error");
            done();
        });

        faultyReader.read();
    });


    test('should emit all data even if multiple reads are made', (done) => {
        const result: string[] = [];

        const processNextBatch = () => {
            let chunk;
            while ((chunk = reader.read()) !== null) {
                result.push(chunk);
            }
            if (result.length === 6) {
                expect(result).toEqual(data);
                done();
            }
        };

        reader.on("readable", processNextBatch);
    });

    test('should handle with slow fetch', (done) => {
        const result: string[] = [];

        jest.spyOn(reader as any, "fetch").mockImplementation(async(size) => {
            reader._read(size as number);
            await new Promise((resolve) => setTimeout(resolve, 50));
            return chunks.splice(0, size as number);
        });

        reader.on("data", (chunk) => {
            result.push(chunk);
        });

        reader.on("end", () => {
            expect(result).toEqual(data);
            done();
        });
    });
});
