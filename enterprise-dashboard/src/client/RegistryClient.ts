// src/client/RegistryClient.ts
const SERVICE = "matrix-analysis";

export class SecureRegistryClient {
  private token: string;
  private password: string;
  private registryUrl: string;

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
    const response = await fetch(`${this.registryUrl}/${packageName}`, {
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Registry error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getPackageVersions(packageName: string): Promise<string[]> {
    const info = (await this.getPackageInfo(packageName)) as { versions?: Record<string, unknown> };
    return Object.keys(info.versions ?? {});
  }
}
