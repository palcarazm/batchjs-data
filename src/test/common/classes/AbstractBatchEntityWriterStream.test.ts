/* eslint-disable @typescript-eslint/no-explicit-any */
import { AbstractBatchEntityWriterStream } from "../../../main/common/index.js";

describe("AbstractBatchEntityWriterStream", () => {
    class AbstractBatchEntityWriterStreamImplementation extends AbstractBatchEntityWriterStream<number> {
        protected async batchWrite(): Promise<void> {
            return new Promise((resolve) => setTimeout(resolve, 10));
        }
    }

    let writer: AbstractBatchEntityWriterStreamImplementation;

    beforeEach(() => {
        writer = new AbstractBatchEntityWriterStreamImplementation({ batchSize: 3 });
    });

    test("should accumulate data in buffer when writing chunks", async () => {
        expect(writer["buffer"]).toHaveLength(0);

        await writer.write(1);
        await writer.write(2);

        expect(writer["buffer"]).toHaveLength(2);
    });

    test("should automatically flush the buffer when batchSize is reached", async () => {
        const flushSpy = jest.spyOn(writer as any, "_flush");

        await writer.write(1);
        await writer.write(2);
        await writer.write(3); 

        expect(flushSpy).toHaveBeenCalledTimes(1);
    });

    test("should flush remaining data in buffer on final", (done) => {
        const finalSpy = jest.spyOn(writer as any, "_final");
        const flushSpy = jest.spyOn(writer as any, "_flush");

        writer.once("finish", () => {
            expect(writer["buffer"]).toHaveLength(0);
            expect(flushSpy).toHaveBeenCalledTimes(2);
            expect(finalSpy).toHaveBeenCalledTimes(1);
            done();
        });

        writer.write(1);
        writer.write(2);
        writer.write(3);
        writer.write(4);
        writer.end();

    });

    test("should not call batchWrite when there is no  remaining data in buffer", (done) => {
        const finalSpy = jest.spyOn(writer as any, "_final");
        const flushSpy = jest.spyOn(writer as any, "_flush");
        const batchWriteSpy = jest.spyOn(writer as any, "batchWrite");

        writer.once("finish", () => {
            expect(writer["buffer"]).toHaveLength(0);
            expect(flushSpy).toHaveBeenCalledTimes(2);
            expect(batchWriteSpy).toHaveBeenCalledTimes(1);
            expect(finalSpy).toHaveBeenCalledTimes(1);
            done();
        });

        writer.write(1);
        writer.write(2);
        writer.write(3);
        writer.end();

    });


    test("should handle errors in batchWrite correctly", (done) => {
        const errorWriter = new AbstractBatchEntityWriterStreamImplementation({
            batchSize: 1
        });
        errorWriter["batchWrite"] = jest.fn(() => Promise.reject(new Error("Write failed")));

        errorWriter.on("error", (err) => {
            expect(err).toBeInstanceOf(Error);
            expect(err.message).toBe("Write failed");
            done();
        });

        errorWriter.write(1);
    });

    test("should handle errors on final in batchWrite correctly", (done) => {
        const errorWriter = new AbstractBatchEntityWriterStreamImplementation({
            batchSize: 2
        });
        errorWriter["batchWrite"] = jest.fn(() => Promise.reject(new Error("Write failed")));

        errorWriter.on("error", (err) => {
            expect(err).toBeInstanceOf(Error);
            expect(err.message).toBe("Write failed");
            done();
        });

        errorWriter.write(1);
        errorWriter.end();
    });

    test("should handle high load and concurrent writes correctly", async () => {
        const startTime = Date.now();
        const numWrites = 1000;
        const writePromises : boolean[] = [];

        for (let i = 0; i < numWrites; i++) {
            writePromises.push(writer.write(i));
        }

        await Promise.all(writePromises);

        const endTime = Date.now();
        const duration = endTime - startTime;

        expect(duration).toBeLessThan(5000); 
        expect(writer["buffer"]).toHaveLength(0);
    });
});
