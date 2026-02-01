#!/usr/bin/env bun
/**
 * Lockfile Matrix Scanner
 *
 * Scans directories for package.json files, identifies lockfile types,
 * calculates health scores, and displays results via Bun.inspect.table().
 *
 * @module scripts/lockfile-matrix
 * @tier 1380-OMEGA-v7.0
 */

import { Glob } from "bun";
import { dirname, join } from "path";

interface ProjectEntry {
	path: string;
	name: string;
	lockfile: string;
	manager: string;
	healthy: boolean;
}

const LOCKFILE_MAP = [
	{ file: "bun.lock", manager: "bun" },
	{ file: "bun.lockb", manager: "bun" },
	{ file: "package-lock.json", manager: "npm" },
	{ file: "yarn.lock", manager: "yarn" },
	{ file: "pnpm-lock.yaml", manager: "pnpm" },
] as const;

async function scanForProjects(root: string): Promise<ProjectEntry[]> {
	const entries: ProjectEntry[] = [];
	const glob = new Glob("**/package.json");
	const matches: string[] = [];

	try {
		for await (const match of glob.scan({
			cwd: root,
			followSymlinks: false,
		})) {
			matches.push(match);
		}
	} catch {
		// EINTR or permission errors on system directories
	}

	for (const match of matches) {
		if (match.includes("node_modules")) continue;
		if (match.includes(".cache")) continue;
		if (match.includes("Library/")) continue;

		const dir = join(root, dirname(match));
		const pkgFile = Bun.file(join(root, match));
		const pkg = await pkgFile.json().catch(() => null);
		if (!pkg) continue;

		let found = false;
		for (const lf of LOCKFILE_MAP) {
			if (await Bun.file(join(dir, lf.file)).exists()) {
				entries.push({
					path: dir.replace(root, ".") || ".",
					name: pkg.name || dirname(match) || "root",
					lockfile: lf.file,
					manager: lf.manager,
					healthy: lf.manager === "bun",
				});
				found = true;
				break;
			}
		}

		if (!found) {
			entries.push({
				path: dir.replace(root, ".") || ".",
				name: pkg.name || dirname(match) || "root",
				lockfile: "none",
				manager: "unknown",
				healthy: false,
			});
		}
	}

	return entries;
}

function calculateHealthScore(entries: ProjectEntry[]): number {
	if (entries.length === 0) return 100;
	const healthy = entries.filter((e) => e.healthy).length;
	return Math.round((healthy / entries.length) * 100);
}

async function main(): Promise<number> {
	const args = process.argv.slice(2);
	const command = args[0] || "scan";
	const root = args[1] || process.cwd();

	switch (command) {
		case "scan": {
			const entries = await scanForProjects(root);
			if (entries.length === 0) {
				console.log("No projects found");
				return 0;
			}
			console.log(
				Bun.inspect.table(
					entries.slice(0, 50),
					["path", "name", "lockfile", "manager", "healthy"],
					{ colors: process.stdout.isTTY ?? false },
				),
			);
			const score = calculateHealthScore(entries);
			console.log(`\nHealth score: ${score}% (${entries.length} projects)`);
			return 0;
		}

		case "health": {
			const entries = await scanForProjects(root);
			const score = calculateHealthScore(entries);
			const bunCount = entries.filter((e) => e.manager === "bun").length;
			const npmCount = entries.filter((e) => e.manager === "npm").length;
			const yarnCount = entries.filter((e) => e.manager === "yarn").length;
			const pnpmCount = entries.filter((e) => e.manager === "pnpm").length;
			const noneCount = entries.filter((e) => e.manager === "unknown").length;

			console.log(`Lockfile Health: ${score}%`);
			console.log(`  bun:     ${bunCount}`);
			console.log(`  npm:     ${npmCount}`);
			console.log(`  yarn:    ${yarnCount}`);
			console.log(`  pnpm:    ${pnpmCount}`);
			console.log(`  none:    ${noneCount}`);
			console.log(`  total:   ${entries.length}`);
			return 0;
		}

		case "migrate": {
			const entries = await scanForProjects(root);
			const nonBun = entries.filter(
				(e) => e.manager !== "bun" && e.manager !== "unknown",
			);
			if (nonBun.length === 0) {
				console.log("All projects already use bun");
				return 0;
			}
			console.log(`Found ${nonBun.length} projects to migrate:`);
			for (const entry of nonBun) {
				console.log(`  ${entry.path} (${entry.manager} -> bun)`);
			}
			console.log("\nRun 'bun install' in each directory to migrate");
			return 0;
		}

		case "clean": {
			const entries = await scanForProjects(root);
			// Find projects with non-bun lockfiles alongside bun lockfile
			const toClean: Array<{ path: string; lockfile: string }> = [];
			for (const entry of entries) {
				if (entry.manager === "bun") {
					// Check for stale non-bun lockfiles in the same dir
					const dir = join(root, entry.path);
					for (const lf of LOCKFILE_MAP) {
						if (lf.manager === "bun") continue;
						if (await Bun.file(join(dir, lf.file)).exists()) {
							toClean.push({
								path: join(entry.path, lf.file),
								lockfile: lf.file,
							});
						}
					}
				}
			}
			if (toClean.length === 0) {
				console.log("No stale lockfiles to clean");
				return 0;
			}
			console.log(`Found ${toClean.length} stale lockfiles:`);
			for (const item of toClean) {
				console.log(`  ${item.path}`);
			}
			console.log("\nRemove manually to confirm cleanup");
			return 0;
		}

		default:
			console.log("Usage: lockfile-matrix <scan|health|migrate|clean> [root]");
			return 1;
	}
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
