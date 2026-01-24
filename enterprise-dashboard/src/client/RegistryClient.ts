// src/client/RegistryClient.ts
const SERVICE = "matrix-analysis";

export class SecureRegistryClient {
  private token: string;
  private password: string;
  private registryUrl: string;
  private cache = new Map<string, { data: unknown; expires: number }>();
  private static TTL_MS = 5 * 60 * 1000; // 5-minute cache
  private static FETCH_TIMEOUT_MS = 10_000; // 10-second fetch timeout

  private constructor(token: string, password: string, registryUrl: string) {
    this.token = token;
    this.password = password;
    this.registryUrl = registryUrl;
  }

  static async create(): Promise<SecureRegistryClient> {
    const [token, password] = await Promise.all([
      Bun.secrets.get({ service: SERVICE, name: "npm-token" }),
      Bun.secrets.get({ service: SERVICE, name: "registry-password" }),
    ]);

    if (!token || !password) {
      throw new Error("Required secrets not found. Run: bun scripts/setup-secrets.ts");
    }

    const registryUrl = process.env.REGISTRY_URL ?? "https://registry.npmjs.org";

    return new SecureRegistryClient(token, password, registryUrl);
  }

  async getPackageInfo(packageName: string): Promise<unknown> {
    // Check cache first
    const cached = this.cache.get(packageName);
    const now = Date.now();
    if (cached && cached.expires > now) {
      return cached.data;
    }

    const response = await fetch(`${this.registryUrl}/${packageName}`, {
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
      signal: AbortSignal.timeout(SecureRegistryClient.FETCH_TIMEOUT_MS),
    });

    if (!response.ok) {
      throw new Error(`Registry error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    this.cache.set(packageName, { data, expires: now + SecureRegistryClient.TTL_MS });
    return data;
  }

  async getPackageVersions(packageName: string): Promise<string[]> {
    const info = (await this.getPackageInfo(packageName)) as { versions?: Record<string, unknown> };
    return Object.keys(info.versions ?? {});
  }
}
