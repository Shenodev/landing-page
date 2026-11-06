#!/usr/bin/env node
/**
 * Load test for the projects API endpoint.
 *
 * Usage:
 *   node scripts/load-test.mjs [url] [concurrency] [totalRequests]
 *
 * Defaults:
 *   url            http://localhost:3000/api/projects
 *   concurrency    10
 *   totalRequests  100
 *
 * Examples:
 *   node scripts/load-test.mjs
 *   node scripts/load-test.mjs https://shenodev.tech/api/projects 50 1000
 *   node scripts/load-test.mjs http://localhost:3000/api/projects 100 5000
 */

const DEFAULT_URL = "http://localhost:3000/api/projects";
const DEFAULT_CONCURRENCY = 10;
const DEFAULT_TOTAL = 100;

const url = process.argv[2] || DEFAULT_URL;
const concurrency = Number(process.argv[3]) || DEFAULT_CONCURRENCY;
const totalRequests = Number(process.argv[4]) || DEFAULT_TOTAL;

const results = [];
let completed = 0;
let errors = 0;
let startTime = 0;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function makeRequest() {
  const reqStart = performance.now();
  try {
    const res = await fetch(url, {
      headers: { "Accept": "application/json" },
    });
    const duration = performance.now() - reqStart;

    if (!res.ok) {
      errors++;
      results.push({ duration, status: res.status, ok: false });
    } else {
      const body = await res.json();
      const count = Array.isArray(body) ? body.length : (body.data?.length ?? 0);
      results.push({ duration, status: res.status, ok: true, count });
    }
  } catch (err) {
    errors++;
    results.push({ duration: performance.now() - reqStart, status: 0, ok: false, error: err.message });
  }
  completed++;
}

async function runWorker() {
  while (completed < totalRequests) {
    if (completed >= totalRequests) break;
    await makeRequest();
  }
}

function percentile(sorted, p) {
  if (sorted.length === 0) return 0;
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

function formatDuration(ms) {
  if (ms < 1) return `${(ms * 1000).toFixed(0)}µs`;
  if (ms < 1000) return `${ms.toFixed(1)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

async function main() {
  console.log(`\n  Load Test: ${url}`);
  console.log(`  Concurrency: ${concurrency} | Total requests: ${totalRequests}\n`);

  startTime = performance.now();

  // Launch workers
  const workers = Array.from({ length: Math.min(concurrency, totalRequests) }, () => runWorker());
  await Promise.all(workers);

  const totalDuration = performance.now() - startTime;
  const sorted = results.map((r) => r.duration).sort((a, b) => a - b);
  const successful = results.filter((r) => r.ok);
  const totalBytes = successful.reduce((sum, r) => sum + (r.count ?? 0), 0);

  console.log(`  Results:`);
  console.log(`  ─────────────────────────────────────────`);
  console.log(`  Total requests:    ${results.length}`);
  console.log(`  Successful:        ${successful.length}`);
  console.log(`  Failed:            ${errors}`);
  console.log(`  Total time:        ${formatDuration(totalDuration)}`);
  console.log(`  Throughput:        ${(results.length / (totalDuration / 1000)).toFixed(1)} req/s`);
  console.log(`  ─────────────────────────────────────────`);
  console.log(`  Latency (ms):`);
  console.log(`    Min:             ${formatDuration(sorted[0] ?? 0)}`);
  console.log(`    p50:             ${formatDuration(percentile(sorted, 50))}`);
  console.log(`    p90:             ${formatDuration(percentile(sorted, 90))}`);
  console.log(`    p95:             ${formatDuration(percentile(sorted, 95))}`);
  console.log(`    p99:             ${formatDuration(percentile(sorted, 99))}`);
  console.log(`    Max:             ${formatDuration(sorted[sorted.length - 1] ?? 0)}`);
  console.log(`  ─────────────────────────────────────────`);

  if (successful.length > 0) {
    const counts = successful.map((r) => r.count).filter((c) => c > 0);
    if (counts.length > 0) {
      console.log(`  Projects returned: ${counts[0]} (first request)`);
    }
  }

  if (errors > 0) {
    console.log(`\n  ⚠️  ${errors} request(s) failed`);
    const errorSamples = results.filter((r) => !r.ok).slice(0, 3);
    for (const e of errorSamples) {
      console.log(`     - Status ${e.status}: ${e.error ?? "HTTP error"}`);
    }
  }

  console.log("");
  process.exit(errors > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Load test failed:", err);
  process.exit(1);
});
