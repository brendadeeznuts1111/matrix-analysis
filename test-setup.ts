/**
 * Global test setup — loaded before tests via bunfig.toml preload
 * @see https://bun.com/docs/test/configuration#preload-scripts
 */
import { beforeAll, afterAll } from "bun:test";

beforeAll(() => {
	process.env.NODE_ENV = process.env.NODE_ENV ?? "test";
});

afterAll(() => {
	// Teardown if needed
});
