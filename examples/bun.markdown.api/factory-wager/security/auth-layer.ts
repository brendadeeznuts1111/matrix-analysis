// factory-wager/security/auth-layer.ts
import { MarkdownEngine } from '../render/markdown-engine';

interface PublishPayload {
  version: string;
  timestamp: string;
  metadata: Record<string, any>;
  artifacts: Array<{
    name: string;
    type: string;
    size: number;
    checksum: string;
  }>;
}

interface PublishResponse {
  success: boolean;
  published: boolean;
  version: string;
  timestamp: string;
  artifacts: Array<{
    name: string;
    url: string;
    size: number;
    checksum: string;
  }>;
  errors?: string[];
}

class AuthLayer {
  private baseUrl: string;
  private clientVersion: string;

  constructor(baseUrl: string = "https://registry.factory-wager.internal") {
    this.baseUrl = baseUrl;
    this.clientVersion = "CLI-v5.3";
  }

  async publish(payload: PublishPayload): Promise<PublishResponse> {
    console.log(`🔐 Publishing to FactoryWager Registry...`);
    console.log(`   URL: ${this.baseUrl}/api/v3/publish`);
    console.log(`   Version: ${payload.version}`);
    console.log(`   Artifacts: ${payload.artifacts.length} items`);

    try {
      const response = await fetch(`${this.baseUrl}/api/v3/publish`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${Bun.env.TIER_API_TOKEN}`,
          "X-FactoryWager-Client": this.clientVersion,
          "Content-Type": "application/json",
          "X-Custom-Trace-ID": crypto.randomUUID(),
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Publish failed: ${response.status} ${response.statusText}`);
        console.error(`   Details: ${errorText}`);
        
        return {
          success: false,
          published: false,
          version: payload.version,
          timestamp: payload.timestamp,
          artifacts: [],
          errors: [errorText]
        };
      }

      const result: PublishResponse = await response.json();
      
      console.log(`✅ Publish successful!`);
      console.log(`   Published: ${result.published}`);
      console.log(`   Version: ${result.version}`);
      console.log(`   Artifacts: ${result.artifacts.length} items`);

      if (result.errors && result.errors.length > 0) {
        console.warn(`⚠️  Warnings: ${result.errors.length}`);
        result.errors.forEach(error => console.warn(`   - ${error}`));
      }

      return result;

    } catch (error) {
      console.error(`❌ Network error during publish:`, error);
      
      return {
        success: false,
        published: false,
        version: payload.version,
        timestamp: payload.timestamp,
        artifacts: [],
        errors: [(error as Error).message]
      };
    }
  }

  async validateToken(): Promise<boolean> {
    console.log(`🔍 Validating API token...`);
    
    try {
      const response = await fetch(`${this.baseUrl}/api/v3/validate`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${Bun.env.TIER_API_TOKEN}`,
          "X-FactoryWager-Client": this.clientVersion,
          "X-Custom-Trace-ID": crypto.randomUUID(),
        },
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Token validation successful`);
        console.log(`   Client: ${result.client || 'Unknown'}`);
        console.log(`   Expires: ${result.expires || 'Unknown'}`);
        console.log(`   Permissions: ${result.permissions?.join(', ') || 'None'}`);
        return true;
      } else {
        console.error(`❌ Token validation failed: ${response.status}`);
        return false;
      }
    } catch (error) {
      console.error(`❌ Token validation error:`, error);
      return false;
    }
  }

  async getRegistryStatus(): Promise<{ status: string; version: string; uptime: number }> {
    console.log(`📊 Checking registry status...`);
    
    try {
      const response = await fetch(`${this.baseUrl}/api/v3/status`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${Bun.env.TIER_API_TOKEN}`,
          "X-FactoryWager-Client": this.clientVersion,
          "X-Custom-Trace-ID": crypto.randomUUID(),
        },
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Registry status: ${result.status}`);
        console.log(`   Version: ${result.version}`);
        console.log(`   Uptime: ${result.uptime}s`);
        return result;
      } else {
        console.error(`❌ Status check failed: ${response.status}`);
        return { status: 'error', version: 'unknown', uptime: 0 };
      }
    } catch (error) {
      console.error(`❌ Status check error:`, error);
      return { status: 'error', version: 'unknown', uptime: 0 };
    }
  }
}

// Export for use in other modules
export { AuthLayer, PublishPayload, PublishResponse };

// Example usage:
// const auth = new AuthLayer();
// const payload = {
//   version: "1.3.0",
//   timestamp: new Date().toISOString(),
//   metadata: { environment: "production", client: "CLI-v5.3" },
//   artifacts: [
//     { name: "config.yaml", type: "yaml", size: 1024, checksum: "abc123" }
//   ]
// };
// const result = await auth.publish(payload);
