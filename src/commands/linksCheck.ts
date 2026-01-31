#!/usr/bin/env bun
/**
 * Link Checker Command
 *
 * CLI command for checking links in documentation
 */

import { join, resolve } from "path";
import { LinkChecker } from '../../benchmarks-combined/scripts/check-links.ts';
import { fmt } from '../../.claude/lib/cli.ts';
import { EXIT_CODES } from '../../.claude/lib/exit-codes.ts';

interface LinkCheckOptions {
  verbose?: boolean;
  external?: boolean;
  export?: 'json' | 'csv';
  directory?: string;
}

export async function linksCheck(options: LinkCheckOptions = {}): Promise<void> {
  const {
    verbose = false,
    external = false,
    export: exportFormat,
    directory = '.'
  } = options;

  console.log(fmt.bold('🔗 Checking documentation links...'));

  if (external) {
    console.log(fmt.warn('Note: External link checking is enabled (slower)'));
  }

  const checker = new LinkChecker(directory, verbose, external);

  try {
    await checker.checkDirectory();
    checker.printResults();

    if (exportFormat) {
      await checker.exportResults(exportFormat);
    }
  } catch (error) {
    console.error(fmt.fail(`Link check failed: ${error instanceof Error ? error.message : String(error)}`));
    Bun.exit(EXIT_CODES.GENERIC_ERROR);
  }
}

// Quick link check for internal links only
export async function linksQuick(directory: string = '.'): Promise<void> {
  console.log(fmt.bold('🔍 Quick link check (internal only)...'));

  try {
    const scriptPath = join(import.meta.dir, '../../benchmarks-combined/scripts/quick-link-check.ts');
    const absDirectory = resolve(directory);
    const process = Bun.spawn(['bun', scriptPath, absDirectory], {
      cwd: import.meta.dir,
      stdout: 'inherit',
      stderr: 'inherit',
      env: { ...process.env, FORCE_COLOR: '1' }
    });

    const result = await process.exited;

    if (result !== 0) {
      console.error(fmt.fail('Quick link check failed'));
      Bun.exit(EXIT_CODES.GENERIC_ERROR);
    }
  } catch (error) {
    console.error(fmt.fail(`Quick link check failed: ${error instanceof Error ? error.message : String(error)}`));
    Bun.exit(EXIT_CODES.GENERIC_ERROR);
  }
}
