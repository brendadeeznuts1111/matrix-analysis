#!/usr/bin/env bun
/**
 * JSC Runtime Diagnostic Tool
 * Introspects JavaScriptCore internals via bun:jsc
 */

import { resolve } from "node:path";
import { defineCommand, fmt, jsc } from "../.claude/lib/cli.ts";
import { EXIT_CODES } from "../.claude/lib/exit-codes.ts";

defineCommand({
	name: "jsc-diagnostic",
	description: "Inspect JavaScriptCore runtime: heap, GC, JIT, object types",
	usage: "bun tools/jsc-diagnostic.ts [options] [file]",
	options: {
		heap: { type: "boolean", default: false, description: "Show heap stats and object type breakdown" },
		gc: { type: "boolean", default: false, description: "Run full GC and report freed memory" },
		profile: { type: "boolean", default: false, description: "Profile a file's default export function" },
		describe: { type: "boolean", short: "d", default: false, description: "Describe internal types of module exports" },
		all: { type: "boolean", short: "a", default: false, description: "Run all diagnostics" },
	},
	async run(values, positionals) {
		const showHeap = !!values["heap"] || !!values["all"];
		const showGC = !!values["gc"] || !!values["all"];
		const showProfile = !!values["profile"];
		const showDescribe = !!values["describe"];
		const showAll = !!values["all"];
		const targetFile = positionals[0];

		// Default to --all if no flags given
		const noFlags = !showHeap && !showGC && !showProfile && !showDescribe && !showAll;

		if (noFlags || showHeap) {
			console.log(`\n${fmt.bold("Heap Stats")}`);
			const heap = jsc.heapStats();
			const rows = [
				{ metric: "Heap Size", value: `${(heap.heapSize / 1024 / 1024).toFixed(2)} MB` },
				{ metric: "Heap Capacity", value: `${(heap.heapCapacity / 1024 / 1024).toFixed(2)} MB` },
				{ metric: "Utilization", value: `${((heap.heapSize / heap.heapCapacity) * 100).toFixed(1)}%` },
				{ metric: "Object Count", value: heap.objectCount.toLocaleString() },
				{ metric: "Protected Objects", value: heap.protectedObjectCount.toLocaleString() },
				{ metric: "Memory Pressure", value: `${jsc.memoryPressure().toFixed(1)}%` },
			];
			console.log(Bun.inspect.table(rows, ["metric", "value"]));

			// Object type breakdown (top 15)
			const types = Object.entries(heap.objectTypeCounts)
				.sort((a, b) => b[1] - a[1])
				.slice(0, 15)
				.map(([type, count]) => ({ type, count }));

			if (types.length > 0) {
				console.log(`${fmt.bold("Object Types")} (top 15)`);
				console.log(Bun.inspect.table(types, ["type", "count"]));
			}
		}

		if (noFlags || showGC) {
			console.log(`\n${fmt.bold("GC Analysis")}`);
			const pre = jsc.heapStats();
			const gc = jsc.gc();
			const post = jsc.heapStats();

			const gcRows = [
				{ metric: "Before", value: `${(gc.before / 1024 / 1024).toFixed(2)} MB` },
				{ metric: "After", value: `${(gc.after / 1024 / 1024).toFixed(2)} MB` },
				{ metric: "Freed", value: `${gc.freedMB} MB` },
				{ metric: "Objects Before", value: pre.objectCount.toLocaleString() },
				{ metric: "Objects After", value: post.objectCount.toLocaleString() },
				{ metric: "Objects Collected", value: (pre.objectCount - post.objectCount).toLocaleString() },
			];
			console.log(Bun.inspect.table(gcRows, ["metric", "value"]));
		}

		if (showProfile && targetFile) {
			console.log(`\n${fmt.bold("Profiling")} ${targetFile}`);
			try {
				const mod = await import(resolve(targetFile));
				const fn = mod.default ?? mod.main ?? Object.values(mod).find((v) => typeof v === "function");
				if (typeof fn !== "function") {
					console.error(fmt.fail("No callable export found (expected default, main, or first function)"));
					process.exit(EXIT_CODES.USAGE_ERROR);
				}

				// Warm up
				for (let i = 0; i < 10; i++) fn();
				jsc.optimize(fn);
				fn();

				const result = jsc.profile(fn, 100);
				const info = jsc.compileInfo(fn);

				console.log(`\n${fmt.bold("JIT Compile Stats")}`);
				const compileRows = [
					{ metric: "Total Compile Time", value: `${info.totalCompileTimeMs.toFixed(3)} ms` },
					{ metric: "DFG Compiles", value: info.dfgCompiles.toString() },
					{ metric: "Reopt Retries", value: info.reoptRetries.toString() },
				];
				console.log(Bun.inspect.table(compileRows, ["metric", "value"]));

				if (result.functions) {
					console.log(`\n${fmt.bold("Hot Functions")}`);
					console.log(result.functions);
				}
				if (result.bytecodes) {
					console.log(`\n${fmt.bold("Bytecode Tiers")}`);
					console.log(result.bytecodes);
				}
			} catch (err) {
				console.error(fmt.fail(`Failed to profile: ${err}`));
				process.exit(EXIT_CODES.GENERIC_ERROR);
			}
		} else if (showProfile && !targetFile) {
			console.error(fmt.fail("--profile requires a file argument"));
			console.error("Usage: bun tools/jsc-diagnostic.ts --profile <file.ts>");
			process.exit(EXIT_CODES.USAGE_ERROR);
		}

		if (showDescribe && targetFile) {
			console.log(`\n${fmt.bold("Module Exports")} — ${targetFile}`);
			try {
				const mod = await import(resolve(targetFile));
				const descRows = Object.entries(mod).map(([name, value]) => ({
					export: name,
					type: typeof value,
					jscType: jsc.describe(value),
					size: typeof value === "object" && value !== null
						? `${jsc.sizeOf(value)} bytes`
						: "-",
				}));
				console.log(Bun.inspect.table(descRows, ["export", "type", "jscType", "size"]));
			} catch (err) {
				console.error(fmt.fail(`Failed to describe: ${err}`));
				process.exit(EXIT_CODES.GENERIC_ERROR);
			}
		} else if (showDescribe && !targetFile) {
			console.error(fmt.fail("--describe requires a file argument"));
			console.error("Usage: bun tools/jsc-diagnostic.ts --describe <file.ts>");
			process.exit(EXIT_CODES.USAGE_ERROR);
		}
	},
});
