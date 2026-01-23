// src/dashboard/KeychainViewer.ts
const SERVICE = "matrix-analysis";

interface SecretStatus {
  name: string;
  description: string;
  status: "set" | "not set";
  env: string;
}

const SECRETS_CONFIG = [
  { name: "npm-token", env: "NPM_TOKEN", description: "npm registry auth token" },
  { name: "registry-password", env: "NPM_PASSWORD", description: "Azure/JFrog registry password" },
] as const;

export class KeychainViewer {
  private secrets: SecretStatus[] = [];

  static async create(): Promise<KeychainViewer> {
    const viewer = new KeychainViewer();
    await viewer.refresh();
    return viewer;
  }

  async refresh(): Promise<void> {
    this.secrets = await Promise.all(
      SECRETS_CONFIG.map(async ({ name, env, description }) => {
        const value = await Bun.secrets.get({ service: SERVICE, name }).catch(() => null);
        return {
          name,
          description,
          env,
          status: value ? "set" : "not set",
        } satisfies SecretStatus;
      })
    );
  }

  getSecrets(): SecretStatus[] {
    return this.secrets;
  }

  async setSecret(name: string, value: string): Promise<void> {
    await Bun.secrets.set({ service: SERVICE, name, value });
    await this.refresh();
  }

  async deleteSecret(name: string): Promise<void> {
    await Bun.secrets.delete({ service: SERVICE, name });
    await this.refresh();
  }

  render(): string {
    const rows = this.secrets.map((s) => ({
      Name: s.name,
      Status: s.status === "set" ? "set" : "not set",
      "Env Var": `$${s.env}`,
      Description: s.description,
    }));

    return Bun.inspect.table(rows, { colors: true });
  }

  toJSON(): SecretStatus[] {
    return this.secrets;
  }
}

// CLI usage
if (import.meta.main) {
  const viewer = await KeychainViewer.create();
  console.log("\n=== Keychain Viewer ===\n");
  console.log(viewer.render());
}
