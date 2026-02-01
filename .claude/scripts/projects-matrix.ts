#!/usr/bin/env bun
/**
 * Projects Matrix Scanner
 *
 * Scans for git repositories and reports branch, status,
 * uncommitted changes, and unpushed commits via Bun.$.
 *
 * @module scripts/projects-matrix
 * @tier 1380-OMEGA-v7.0
 */

import { $, Glob } from "bun";
import { basename, dirname, join } from "path";

interface ProjectStatus {
	path: string;
	name: string;
	branch: string;
	uncommitted: number;
	unpushed: number;
	status: string;
}

async function scanForGitRepos(root: string): Promise<string[]> {
	// Bun.Glob skips hidden directories, so use find via Bun.$
	const result =
		await $`find ${root} -maxdepth 4 -name ".git" -type d -not -path "*/node_modules/*" -not -path "*/.cache/*" 2>/dev/null`
			.text()
			.catch(() => "");

	return result
		.split("\n")
		.filter(Boolean)
		.map((g) => g.replace(/\/\.git$/, ""));
}

async function getRepoStatus(repoPath: string): Promise<ProjectStatus> {
	const name = basename(repoPath) || repoPath;

	const branch = await $`git -C ${repoPath} branch --show-current`
		.text()
		.then((t) => t.trim())
		.catch(() => "unknown");

	const statusOutput = await $`git -C ${repoPath} status --porcelain`
		.text()
		.catch(() => "");
	const uncommitted = statusOutput.split("\n").filter(Boolean).length;

	const unpushedOutput = await $`git -C ${repoPath} log @{upstream}..HEAD --oneline`
		.text()
		.catch(() => "");
	const unpushed = unpushedOutput.split("\n").filter(Boolean).length;

	let status = "clean";
	if (uncommitted > 0 && unpushed > 0) status = "dirty+unpushed";
	else if (uncommitted > 0) status = "dirty";
	else if (unpushed > 0) status = "unpushed";

	return {
		path: repoPath,
		name,
		branch,
		uncommitted,
		unpushed,
		status,
	};
}

async function main(): Promise<number> {
	const args = process.argv.slice(2);
	const command = args[0] || "status";
	const root = args[1] || process.cwd();

	switch (command) {
		case "status": {
			const repos = await scanForGitRepos(root);
			if (repos.length === 0) {
				console.log("No git repositories found");
				return 0;
			}

			const statuses = await Promise.all(repos.map(getRepoStatus));
			console.log(
				Bun.inspect.table(
					statuses.slice(0, 50),
					["name", "branch", "uncommitted", "unpushed", "status"],
					{ colors: process.stdout.isTTY ?? false },
				),
			);
			return 0;
		}

		case "sync": {
			const repos = await scanForGitRepos(root);
			for (const repo of repos) {
				const name = basename(repo);
				console.log(`Syncing ${name}...`);
				const result = await $`git -C ${repo} pull --rebase`.quiet().nothrow();
				if (result.exitCode !== 0) {
					console.log(`  Failed to sync ${name}`);
				}
			}
			return 0;
		}

		case "push": {
			const repos = await scanForGitRepos(root);
			for (const repo of repos) {
				const status = await getRepoStatus(repo);
				if (status.unpushed > 0) {
					console.log(`Pushing ${status.name} (${status.unpushed} commits)...`);
					const result = await $`git -C ${repo} push`.quiet().nothrow();
					if (result.exitCode !== 0) {
						console.log(`  Failed to push ${status.name}`);
					}
				}
			}
			return 0;
		}

		case "pull": {
			const repos = await scanForGitRepos(root);
			for (const repo of repos) {
				console.log(`Pulling ${basename(repo)}...`);
				const result = await $`git -C ${repo} pull`.quiet().nothrow();
				if (result.exitCode !== 0) {
					console.log(`  Failed to pull ${basename(repo)}`);
				}
			}
			return 0;
		}

		case "lockfile":
		case "matrix": {
			const scriptDir = dirname(import.meta.path);
			const script = join(scriptDir, "lockfile-matrix.ts");
			const proc = Bun.spawn(["bun", script, "scan", root], {
				stdio: ["inherit", "inherit", "inherit"],
			});
			return await proc.exited;
		}

		case "clean": {
			const repos = await scanForGitRepos(root);
			for (const repo of repos) {
				const name = basename(repo);
				const result = await $`git -C ${repo} clean -nd`.text().catch(() => "");
				if (result.trim()) {
					const count = result.split("\n").filter(Boolean).length;
					console.log(`${name}: ${count} untracked files`);
				}
			}
			return 0;
		}

		case "health": {
			const repos = await scanForGitRepos(root);
			if (repos.length === 0) {
				console.log("No repositories found");
				return 0;
			}
			const statuses = await Promise.all(repos.map(getRepoStatus));
			const clean = statuses.filter((s) => s.status === "clean").length;
			const dirty = statuses.filter((s) => s.uncommitted > 0).length;
			const unpushed = statuses.filter((s) => s.unpushed > 0).length;
			const score = Math.round((clean / statuses.length) * 100);

			console.log(`Project Health: ${score}%`);
			console.log(`  clean:    ${clean}`);
			console.log(`  dirty:    ${dirty}`);
			console.log(`  unpushed: ${unpushed}`);
			console.log(`  total:    ${statuses.length}`);
			return 0;
		}

		default:
			console.log(
				"Usage: projects-matrix " +
					"<status|sync|push|pull|lockfile|matrix|clean|health> [root]",
			);
			return 1;
	}
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
