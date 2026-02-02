/**
 * Tier-1380 Security Mocks — Preload for bun test
 * Validates test env isolation; wire to CSRFProtector when available
 *
 * Usage: bun test --preload ./security-mocks.ts
 */
import { beforeAll, afterAll } from "bun:test";

declare global {
	// eslint-disable-next-line no-var
	var testSecurity: {
		validateTestEnv: () => void;
	} | undefined;
}

globalThis.testSecurity = {
	validateTestEnv: () => {
		const url = process.env.DATABASE_URL;
		if (url && !url.toLowerCase().includes("test")) {
			throw new Error("Production database URL detected in tests");
		}
		if (process.env.NODE_ENV && process.env.NODE_ENV !== "test") {
			console.warn("⚠️  Tests running outside NODE_ENV=test");
		}
	},
};

beforeAll(() => globalThis.testSecurity?.validateTestEnv());
afterAll(() => {
	delete (globalThis as { testSecurity?: unknown }).testSecurity;
});
