/// <reference types="node" />
interface ResourceSample {
  timestamp: number;
  cpuUser: number;
  cpuSystem: number;
  memoryRSS: number;
  memoryHeapUsed: number;
  memoryHeapTotal: number;
  memoryExternal: number;
}

interface ResourceMetrics {
  avgCpuUserPercent: number;
  avgCpuSystemPercent: number;
  avgCpuTotalPercent: number;
  avgMemoryRSS: number;
  avgMemoryHeapUsed: number;
  avgMemoryHeapTotal: number;
  avgMemoryExternal: number;
  samples: number;
  totalElapsedSeconds: number;
}

/**
 * Utility class for continuous CPU and memory monitoring during test execution.
 * Collects resource usage samples at a specified interval and calculates
 * meaningful metrics including CPU usage as percentages (via deltas between samples).
 */
export class ResourceMonitor {
    private readonly intervalMs: number;
    private intervalId: NodeJS.Timeout | null = null;
    private samples: ResourceSample[] = [];
    private previousSample: ResourceSample | null = null;
    private startTime: number = 0;

    /**
     * Creates a new ResourceMonitor instance.
     * @param intervalMs - Interval in milliseconds between samples (default: 100ms)
     */
    constructor(intervalMs: number = 100) {
        this.intervalMs = intervalMs;
    }

    /**
     * Starts the resource monitoring process.
     * Records an initial sample and then continues sampling at the configured interval.
     */
    start(): void {
        this.startTime = Date.now();
        this.previousSample = null;
        this.samples = [];

        // Collect initial sample
        this.collectSample();

        this.intervalId = setInterval(() => {
            this.collectSample();
        }, this.intervalMs);
    }

    /**
     * Stops the resource monitoring process and calculates aggregated metrics.
     * @returns ResourceMetrics object containing average values and sample count
     */
    stop(): ResourceMetrics {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }

        // Collect final sample
        this.collectSample();

        if (this.samples.length === 0) {
            return {
                avgCpuUserPercent: 0,
                avgCpuSystemPercent: 0,
                avgCpuTotalPercent: 0,
                avgMemoryRSS: 0,
                avgMemoryHeapUsed: 0,
                avgMemoryHeapTotal: 0,
                avgMemoryExternal: 0,
                samples: 0,
                totalElapsedSeconds: 0,
            };
        }

        // Calculate CPU usage percentages from deltas between consecutive samples
        let totalCpuUserDelta = 0;
        let totalCpuSystemDelta = 0;
        let deltaCount = 0;

        for (let i = 1; i < this.samples.length; i++) {
            const prev = this.samples[i - 1];
            const curr = this.samples[i];
            const elapsedMs = curr.timestamp - prev.timestamp;
      
            if (elapsedMs > 0) {
                const cpuUserDelta = curr.cpuUser - prev.cpuUser;
                const cpuSystemDelta = curr.cpuSystem - prev.cpuSystem;
        
                // CPU usage percentage = (cpuTimeDelta / elapsedTime) * 100
                // cpuTimeDelta is in microseconds, elapsedTime is in milliseconds
                // Convert: (microseconds / (milliseconds * 1000)) * 100
                totalCpuUserDelta += (cpuUserDelta / (elapsedMs * 1000)) * 100;
                totalCpuSystemDelta += (cpuSystemDelta / (elapsedMs * 1000)) * 100;
                deltaCount++;
            }
        }

        const avgCpuUserPercent = deltaCount > 0 ? totalCpuUserDelta / deltaCount : 0;
        const avgCpuSystemPercent = deltaCount > 0 ? totalCpuSystemDelta / deltaCount : 0;
        const avgCpuTotalPercent = avgCpuUserPercent + avgCpuSystemPercent;

        // Calculate average memory values
        const sums = this.samples.reduce(
            (acc, sample) => {
                acc.memoryRSS += sample.memoryRSS;
                acc.memoryHeapUsed += sample.memoryHeapUsed;
                acc.memoryHeapTotal += sample.memoryHeapTotal;
                acc.memoryExternal += sample.memoryExternal;
                return acc;
            },
            { memoryRSS: 0, memoryHeapUsed: 0, memoryHeapTotal: 0, memoryExternal: 0 }
        );

        const count = this.samples.length;

        return {
            avgCpuUserPercent: Math.round(avgCpuUserPercent * 100) / 100,
            avgCpuSystemPercent: Math.round(avgCpuSystemPercent * 100) / 100,
            avgCpuTotalPercent: Math.round(avgCpuTotalPercent * 100) / 100,
            avgMemoryRSS: Math.round(sums.memoryRSS / count),
            avgMemoryHeapUsed: Math.round(sums.memoryHeapUsed / count),
            avgMemoryHeapTotal: Math.round(sums.memoryHeapTotal / count),
            avgMemoryExternal: Math.round(sums.memoryExternal / count),
            samples: count,
            totalElapsedSeconds: Math.round(((Date.now() - this.startTime) / 1000) * 100) / 100,
        };
    }

    /**
     * Collects a single sample of current resource usage.
     * @private
     */
    private collectSample(): void {
        const cpuUsage = process.cpuUsage();
        const memoryUsage = process.memoryUsage();

        const sample: ResourceSample = {
            timestamp: Date.now(),
            cpuUser: cpuUsage.user,
            cpuSystem: cpuUsage.system,
            memoryRSS: memoryUsage.rss,
            memoryHeapUsed: memoryUsage.heapUsed,
            memoryHeapTotal: memoryUsage.heapTotal,
            memoryExternal: memoryUsage.external,
        };

        this.samples.push(sample);
    }
}