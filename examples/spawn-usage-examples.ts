#!/usr/bin/env bun
/**
 * Real-World Spawn Usage Examples
 * 
 * Demonstrates safe, production-ready patterns for Bun.spawn()
 * with security validation and performance monitoring.
 */

// Safe spawn wrapper with validation
export function spawnSafe(
	command: string[],
	options: Parameters<typeof Bun.spawn>[1] = {},
) {
	// Validate command
	if (!command || command.length === 0) {
		throw new Error("Empty command");
	}

	// Basic security: reject suspicious patterns
	const cmd = command[0];
	if (cmd.includes("..") || cmd.includes(";") || cmd.includes("|")) {
		throw new Error(`Suspicious command: ${cmd}`);
	}

	const start = performance.now();
	const result = Bun.spawnSync(command, {
		...options,
		stdout: options.stdout ?? "pipe",
		stderr: options.stderr ?? "pipe",
	});
	const duration = performance.now() - start;

	// Warn on slow spawns
	if (duration > 5 && process.env.NODE_ENV === "production") {
		console.warn(
			`⚠️  Slow spawn: ${command.join(" ")} took ${duration.toFixed(1)}ms`,
		);
	}

	return { ...result, duration };
}

// Example 1: Safe git operations
async function gitStatus(): Promise<string> {
	const result = spawnSafe(["git", "status", "--porcelain"]);

	if (result.exitCode !== 0) {
		const stderr = await new Response(result.stderr).text();
		throw new Error(`Git failed: ${stderr}`);
	}

	return await new Response(result.stdout).text();
}

// Example 2: Batch processing with concurrency limit
async function batchLint(files: string[], concurrency = 10): Promise<void> {
	console.log(`Linting ${files.length} files (concurrency: ${concurrency})...`);

	for (let i = 0; i < files.length; i += concurrency) {
		const batch = files.slice(i, i + concurrency);
		const procs = batch.map((file) =>
			Bun.spawn(["biome", "check", file], { stdout: "pipe", stderr: "pipe" }),
		);

		const results = await Promise.all(
			procs.map(async (proc) => ({
				exitCode: await proc.exitCode,
				stdout: await new Response(proc.stdout).text(),
				stderr: await new Response(proc.stderr).text(),
			})),
		);

		// Check for failures
		for (let j = 0; j < results.length; j++) {
			const result = results[j];
			const file = batch[j];
			if (result.exitCode !== 0) {
				console.error(`❌ ${file}: ${result.stderr.trim()}`);
			} else {
				console.log(`✅ ${file}`);
			}
		}
	}
}

// Example 3: Command whitelist pattern
const ALLOWED_COMMANDS = new Set([
	"git",
	"npm",
	"bun",
	"node",
	"biome",
	"prettier",
	"eslint",
]);

function spawnWhitelisted(command: string, args: string[]) {
	if (!ALLOWED_COMMANDS.has(command)) {
		throw new Error(`Command not allowed: ${command}`);
	}

	// Validate arguments (no shell metacharacters)
	for (const arg of args) {
		if (/[;&|`$()]/.test(arg)) {
			throw new Error(`Invalid argument: ${arg}`);
		}
	}

	return Bun.spawnSync([command, ...args], {
		stdout: "pipe",
		stderr: "pipe",
	});
}

// Example 4: Performance monitoring
class SpawnMonitor {
	private samples: number[] = [];
	private slowCount = 0;
	private readonly maxSamples = 1000;
	private readonly slowThreshold = 10; // ms

	record(duration: number): void {
		this.samples.push(duration);
		if (this.samples.length > this.maxSamples) {
			this.samples.shift();
		}
		if (duration > this.slowThreshold) {
			this.slowCount++;
		}
	}

	getStats() {
		if (this.samples.length === 0) {
			return { mean: 0, p95: 0, samples: 0, slowCount: 0 };
		}

		const sorted = [...this.samples].sort((a, b) => a - b);
		const mean = this.samples.reduce((a, b) => a + b, 0) / this.samples.length;
		const p95 = sorted[Math.floor(sorted.length * 0.95)];

		return { mean, p95, samples: this.samples.length, slowCount: this.slowCount };
	}
}

const monitor = new SpawnMonitor();

function monitoredSpawn(command: string[]) {
	const start = performance.now();
	const result = Bun.spawnSync(command);
	monitor.record(performance.now() - start);
	return result;
}

// Example 5: Retry pattern with exponential backoff
async function spawnWithRetry(
	command: string[],
	maxRetries = 3,
	baseDelay = 100,
): Promise<Bun.SpawnResult> {
	let lastError: Error | null = null;

	for (let attempt = 0; attempt <= maxRetries; attempt++) {
		try {
			const proc = Bun.spawn(command, { stdout: "pipe", stderr: "pipe" });
			const exitCode = await proc.exitCode;

			if (exitCode === 0) {
				return proc;
			}

			const stderr = await new Response(proc.stderr).text();
			lastError = new Error(`Command failed (exit ${exitCode}): ${stderr}`);
		} catch (error) {
			lastError = error as Error;
		}

		if (attempt < maxRetries) {
			const delay = baseDelay * 2 ** attempt;
			console.warn(
				`Retry ${attempt + 1}/${maxRetries} after ${delay}ms: ${command.join(" ")}`,
			);
			await Bun.sleep(delay);
		}
	}

	throw lastError;
}

// Demo: Run all examples
async function demo() {
	console.log("🚀 Spawn Usage Examples\n");

	// Example 1: Git status
	console.log("1️⃣ Git Status:");
	try {
		const status = await gitStatus();
		console.log(status || "  (clean working tree)");
	} catch (error) {
		console.error(`  Error: ${error}`);
	}

	// Example 2: Batch lint (demo with small list)
	console.log("\n2️⃣ Batch Processing:");
	const testFiles = ["package.json", "tsconfig.json", "README.md"];
	try {
		await batchLint(testFiles, 2);
	} catch (error) {
		console.error(`  Error: ${error}`);
	}

	// Example 3: Whitelisted command
	console.log("\n3️⃣ Whitelisted Command:");
	try {
		const result = spawnWhitelisted("bun", ["--version"]);
		const output = await new Response(result.stdout).text();
		console.log(`  Bun version: ${output.trim()}`);
	} catch (error) {
		console.error(`  Error: ${error}`);
	}

	// Example 4: Monitor stats
	console.log("\n4️⃣ Performance Monitoring:");
	for (let i = 0; i < 10; i++) {
		monitoredSpawn(["true"]);
	}
	const stats = monitor.getStats();
	console.log(`  Mean: ${stats.mean.toFixed(2)}ms`);
	console.log(`  P95: ${stats.p95.toFixed(2)}ms`);
	console.log(`  Slow spawns (>10ms): ${stats.slowCount}`);

	// Example 5: Retry pattern
	console.log("\n5️⃣ Retry Pattern:");
	try {
		await spawnWithRetry(["bun", "--version"], 2, 50);
		console.log("  ✅ Command succeeded (or after retry)");
	} catch (error) {
		console.error(`  ❌ All retries failed: ${error}`);
	}

	console.log("\n✨ Done!");
}

// Run demo if called directly
if (import.meta.main) {
	demo().catch(console.error);
}
