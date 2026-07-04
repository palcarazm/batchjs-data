/// <reference types="jest" />
/// <reference types="node" />
import { Writable } from "node:stream";
import { AbstractBatchEntityReaderStream } from "../../../main/common/index.js";
import { TestEntity, TestDataGenerator } from "../utils/TestDataGenerator.js";
import { ResourceMonitor } from "../utils/ResourceMonitor.js";

/**
 * Stress test implementation of AbstractBatchEntityReaderStream that
 * reads entities from a pre-generated array in batches.
 */
class StressTestReader extends AbstractBatchEntityReaderStream<TestEntity> {
    private readonly totalEntities: number;
    private offset: number = 0;

    constructor(totalEntities: number, batchSize: number) {
        super({ batchSize });
        this.totalEntities = totalEntities;
    }

    protected async fetch(size: number): Promise<TestEntity[]> {
        const remaining = this.totalEntities - this.offset;
        if (remaining === 0) return [];

        const fetchSize = Math.min(size, remaining);
        const batch = TestDataGenerator.generateTestEntities(fetchSize, this.offset);
        this.offset += fetchSize;
        await new Promise(resolve => setTimeout(resolve, 1));

        return batch;
    }
}

/**
 * Slow consumer that processes one entity at a time with a 1ms delay.
 * This simulates a slow downstream consumer to test backpressure.
 */
class SlowConsumer extends Writable {
    private processedCount: number = 0;
    private readonly delayMs: number = 1;

    constructor() {
        super({ objectMode: true  });
    }

    _write(
        chunk: TestEntity,
        encoding: BufferEncoding,
        callback: (error?: Error | null) => void
    ): void {
        this.processedCount++;
        if (this.processedCount % 250 === 0) {
            // Simulate 1ms processing time per entity
            setTimeout(() => callback(), this.delayMs);
        }else{
            callback();
        }

        if(this.processedCount % 2500 === 0) {
            console.log(`Processed ${this.processedCount} entities...`);
        }
    }

    getProcessedCount(): number {
        return this.processedCount;
    }
}

describe("AbstractBatchEntityReaderStream Stress Test", () => {
    test("should process 100,000 entities with backpressure", (done) => {
        const TOTAL_ENTITIES = 100000;
        const BATCH_SIZE = 250;
        const TIMEOUT_MS = 120_000;

        const reader = new StressTestReader(TOTAL_ENTITIES, BATCH_SIZE);
        const consumer = new SlowConsumer();
        const resourceMonitor = new ResourceMonitor(100); // collect every 100ms
        const startTime = Date.now();

        resourceMonitor.start();

        consumer.on("finish", () => {
            const duration = Date.now() - startTime;
            const metrics = resourceMonitor.stop();
            const processedCount = consumer.getProcessedCount();

            try {
                console.log("\n📊 AbstractBatchEntityReader Stress Test Results:");
                console.log(`   Total Entities: ${TOTAL_ENTITIES}`);
                console.log(`   Batch Size: ${BATCH_SIZE}`);
                console.log("\n   Resource Metrics:");
                console.log("   ──────────────────────────────────────────────");
                console.log(`   CPU User Avg:     ${metrics.avgCpuUserPercent.toFixed(2)}%`);
                console.log(`   CPU System Avg:   ${metrics.avgCpuSystemPercent.toFixed(2)}%`);
                console.log(`   CPU Total Avg:    ${metrics.avgCpuTotalPercent.toFixed(2)}%`);
                console.log(`   Memory RSS Avg:   ${(metrics.avgMemoryRSS / 1024 / 1024).toFixed(2)} MB`);
                console.log(`   Memory Heap Avg:  ${(metrics.avgMemoryHeapUsed / 1024 / 1024).toFixed(2)} MB`);
                console.log(`   Samples:          ${metrics.samples}`);
                console.log(`   Total Elapsed:    ${metrics.totalElapsedSeconds}s\n`);

                expect(processedCount).toBe(TOTAL_ENTITIES);
                expect(duration).toBeLessThan(TIMEOUT_MS);
                expect(metrics.avgCpuUserPercent).toBeLessThanOrEqual(80);
                expect(metrics.avgCpuSystemPercent).toBeLessThanOrEqual(80);
                expect(metrics.avgCpuTotalPercent).toBeLessThanOrEqual(80);
                expect((metrics.avgMemoryRSS / 1024 / 1024)).toBeLessThanOrEqual(250);
                expect((metrics.avgMemoryHeapUsed / 1024 / 1024)).toBeLessThanOrEqual(100);
                expect(metrics.totalElapsedSeconds * 1000).toBeLessThan(TIMEOUT_MS);

                done();
            } catch (error) {
                done(error);
            }
        });

        consumer.on("error", (err) => {
            done(err);
        });

        reader.pipe(consumer);

        // Start the stream by triggering the first read
        reader.read();
    }, 300_000);
});