/// <reference types="jest" />
/// <reference types="node" />

import { AbstractBatchEntityWriterStream } from "../../../main/common/index.js";
import { TestEntity, TestDataGenerator } from "../utils/TestDataGenerator.js";
import { ResourceMonitor } from "../utils/ResourceMonitor.js";

/**
 * Stress test implementation of AbstractBatchEntityWriterStream that
 * simulates slow database writes with a configurable delay per batch.
 */
class StressTestWriter extends AbstractBatchEntityWriterStream<TestEntity> {
    private readonly writeDelayMs: number;
    private batchCount: number = 0;
    private readonly expectedBatches: number;

    constructor(expectedBatches: number, writeDelayMs: number, options: { batchSize: number }) {
        super(options);
        this.expectedBatches = expectedBatches;
        this.writeDelayMs = writeDelayMs;
    }

    protected async batchWrite(): Promise<void> {
        this.batchCount++;
        await new Promise(resolve => setTimeout(resolve, this.writeDelayMs));
        if (this.batchCount % 10 === 0) {
            console.log(`Flushed batch ${this.batchCount}/${this.expectedBatches}`);
        }
    }

    getBatchCount(): number {
        return this.batchCount;
    }
}

describe("AbstractBatchEntityWriterStream Stress Test", () => {

    test("should write 100,000 entities with slow database writes", (done) => {
        const TOTAL_ENTITIES = 100000;
        const BATCH_SIZE = 250;
        const TIMEOUT_MS = 120_000;
        const EXPECTED_BATCHES = Math.ceil(TOTAL_ENTITIES / BATCH_SIZE);

        const writer = new StressTestWriter(EXPECTED_BATCHES, 200, { batchSize: BATCH_SIZE });
        const resourceMonitor = new ResourceMonitor(100); // collect every 100ms
        const startTime = Date.now();

        let writtenCount = 0;

        resourceMonitor.start();

        writer.on("finish", () => {
            const duration = Date.now() - startTime;
            const metrics = resourceMonitor.stop();
            const batchCount = writer.getBatchCount();

            try {
                console.log("\n📊 AbstractBatchEntityWriter Stress Test Results:");
                console.log(`   Total Entities: ${TOTAL_ENTITIES}`);
                console.log(`   Batch Size: ${BATCH_SIZE}`);
                console.log(`   Number of Batches: ${batchCount}`);
                console.log("\n   Resource Metrics:");
                console.log("   ──────────────────────────────────────────────");
                console.log(`   CPU User Avg:     ${metrics.avgCpuUserPercent.toFixed(2)}%`);
                console.log(`   CPU System Avg:   ${metrics.avgCpuSystemPercent.toFixed(2)}%`);
                console.log(`   CPU Total Avg:    ${metrics.avgCpuTotalPercent.toFixed(2)}%`);
                console.log(`   Memory RSS Avg:   ${(metrics.avgMemoryRSS / 1024 / 1024).toFixed(2)} MB`);
                console.log(`   Memory Heap Avg:  ${(metrics.avgMemoryHeapUsed / 1024 / 1024).toFixed(2)} MB`);
                console.log(`   Samples:          ${metrics.samples}`);
                console.log(`   Total Elapsed:    ${metrics.totalElapsedSeconds}s\n`);

                expect(writtenCount).toBe(TOTAL_ENTITIES);
                expect(batchCount).toBe(EXPECTED_BATCHES);
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

        writer.on("error", (err) => {
            done(err);
        });

        while (writtenCount < TOTAL_ENTITIES) {
            TestDataGenerator.generateTestEntities(BATCH_SIZE, writtenCount)
                .forEach(entity => {
                    writer.write(entity);
                    writtenCount++;
                });
        }

        writer.end();
    }, 300_000);
});