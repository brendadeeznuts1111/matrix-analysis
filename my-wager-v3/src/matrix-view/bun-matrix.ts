// Bun Min Version Matrix - Tier-1380 Infrastructure
// Comprehensive API documentation matrix with RSS integration

export interface Version {
  major: number;
  minor: number;
  patch: number;
}

export interface PerfProfile {
  opsSec: number;
  baseline: string;
  platform?: string;
}

export interface SecurityScope {
  classification: 'high' | 'medium' | 'low';
  requiresRoot?: boolean;
  zeroTrust?: boolean;
}

export interface BunDocEntry {
  term: string;
  path: string;
  bunMinVersion: `${number}.${number}.${number}`;
  stability: 'experimental' | 'stable' | 'deprecated';
  platforms: ('darwin' | 'linux' | 'win32')[];
  changelogFeed?: URL;
  perfProfile?: PerfProfile;
  security: SecurityScope;
  cliFlags?: string[];
  breakingChanges?: Version[];
  relatedTerms?: string[];
  lastUpdated?: Date;
  category?: 'core' | 'crypto' | 'io' | 'network' | 'ffi' | 'web' | 'cli';
  deprecatedIn?: `${number}.${number}.${number}`;
  removedIn?: `${number}.${number}.${number}`;
}

// Matrix data store
class BunMatrixStore {
  private entries = new Map<string, BunDocEntry>();
  private rssCache = new Map<string, { lastFetch: Date; entries: number }>();

  // Add or update entry
  set(entry: BunDocEntry): void {
    entry.lastUpdated = new Date();
    this.entries.set(entry.term, entry);
  }

  // Get entry
  get(term: string): BunDocEntry | undefined {
    return this.entries.get(term);
  }

  // Get all entries
  getAll(): BunDocEntry[] {
    return Array.from(this.entries.values());
  }

  // Filter by platform
  filterByPlatform(platform: 'darwin' | 'linux' | 'win32'): BunDocEntry[] {
    return this.getAll().filter(entry =>
      entry.platforms.includes(platform)
    );
  }

  // Filter by stability
  filterByStability(stability: 'experimental' | 'stable' | 'deprecated'): BunDocEntry[] {
    return this.getAll().filter(entry => entry.stability === stability);
  }

  // Check version compatibility
  isCompatible(term: string, bunVersion: string): boolean {
    const entry = this.get(term);
    if (!entry) return false;

    const [minMajor, minMinor, minPatch] = entry.bunMinVersion.split('.').map(Number);
    const [major, minor, patch] = bunVersion.split('.').map(Number);

    if (major > minMajor) return true;
    if (major < minMajor) return false;
    if (minor > minMinor) return true;
    if (minor < minMinor) return false;
    return patch >= minPatch;
  }

  // Get breaking changes for version
  getBreakingChanges(version: string): BunDocEntry[] {
    const [major, minor, patch] = version.split('.').map(Number);

    return this.getAll().filter(entry =>
      entry.breakingChanges?.some(b =>
        b.major <= major && b.minor <= minor && b.patch <= patch
      ) ?? false
    );
  }

  // RSS Feed integration
  async updateFromRSS(feedUrl: string): Promise<void> {
    const cacheKey = feedUrl;
    const now = new Date();
    const cached = this.rssCache.get(cacheKey);

    // Cache for 5 minutes
    if (cached && (now.getTime() - cached.lastFetch.getTime()) < 300000) {
      return;
    }

    try {
      const response = await fetch(feedUrl);
      const xml = await response.text();
      const entries = this.parseRSS(xml);

      // Update matrix entries with RSS data
      for (const entry of entries) {
        const matrixEntry = this.get(entry.term);
        if (matrixEntry) {
          matrixEntry.lastUpdated = entry.lastUpdated;
          this.set(matrixEntry);
        }
      }

      this.rssCache.set(cacheKey, { lastFetch: now, entries: entries.length });
    } catch (error) {
      console.error(`Failed to fetch RSS from ${feedUrl}:`, error);
    }
  }

  private parseRSS(xml: string): Array<{ term: string; lastUpdated: Date }> {
    // Simple RSS parsing - in production use proper RSS parser
    const items = xml.match(/<item>(.*?)<\/item>/gs) || [];
    return items.map(item => {
      const termMatch = item.match(/<title>(.*?)<\/title>/);
      const dateMatch = item.match(/<pubDate>(.*?)<\/pubDate>/);

      return {
        term: termMatch?.[1] || 'unknown',
        lastUpdated: dateMatch ? new Date(dateMatch[1]) : new Date()
      };
    });
  }
}

// Matrix viewer with table formatting
export class BunMatrixViewer {
  private store = new BunMatrixStore();

  constructor() {
    this.initializeDefaultEntries();
  }

  // Initialize with core Bun APIs
  private initializeDefaultEntries(): void {
    const defaultEntries: BunDocEntry[] = [
      {
        term: 'Bun.file',
        path: '/docs/api/file-io',
        bunMinVersion: '0.1.0',
        stability: 'stable',
        platforms: ['darwin', 'linux', 'win32'],
        perfProfile: { opsSec: 1000000, baseline: '10x fs-extra' },
        security: { classification: 'medium' },
        category: 'io',
        relatedTerms: ['Bun.write', 'Bun.read']
      },
      {
        term: 'Bun.password',
        path: '/docs/api/password',
        bunMinVersion: '1.0.0',
        stability: 'stable',
        platforms: ['darwin', 'linux', 'win32'],
        perfProfile: { opsSec: 50000, baseline: 'Argon2id native' },
        security: { classification: 'high', zeroTrust: true },
        category: 'crypto',
        cliFlags: ['--no-argon2']
      },
      {
        term: 'Bun.serve',
        path: '/docs/api/http',
        bunMinVersion: '0.6.0',
        stability: 'stable',
        platforms: ['darwin', 'linux', 'win32'],
        perfProfile: { opsSec: 50000, baseline: '2.3x Express' },
        security: { classification: 'medium' },
        category: 'network',
        relatedTerms: ['Bun.fetch', 'Bun.websocket']
      },
      {
        term: 'Bun.sqlite',
        path: '/docs/api/sqlite',
        bunMinVersion: '1.0.22',
        stability: 'experimental',
        platforms: ['darwin', 'linux'],
        perfProfile: { opsSec: 100000, baseline: '7.9x better-sqlite3' },
        security: { classification: 'high' },
        category: 'core',
        cliFlags: ['--experimental-sqlite'],
        changelogFeed: new URL('https://bun.sh/blog/rss.xml#tag=sqlite')
      },
      {
        term: 'Bun.inspect.table',
        path: '/docs/api/utils',
        bunMinVersion: '0.1.0',
        stability: 'stable',
        platforms: ['darwin', 'linux', 'win32'],
        security: { classification: 'low' },
        category: 'cli'
      },
      {
        term: 'Bun.CryptoHasher',
        path: '/docs/api/crypto',
        bunMinVersion: '0.5.0',
        stability: 'stable',
        platforms: ['darwin', 'linux', 'win32'],
        perfProfile: { opsSec: 500000, baseline: '3.2x Node crypto' },
        security: { classification: 'high', zeroTrust: true },
        category: 'crypto'
      },
      {
        term: 'Bun.FFI',
        path: '/docs/api/ffi',
        bunMinVersion: '0.2.0',
        stability: 'stable',
        platforms: ['darwin', 'linux', 'win32'],
        security: { classification: 'high', requiresRoot: true },
        category: 'ffi',
        relatedTerms: ['Bun.dlopen', 'Bun.CPointer']
      },
      {
        term: 'Bun.gzip',
        path: '/docs/api/compression',
        bunMinVersion: '0.1.0',
        stability: 'stable',
        platforms: ['darwin', 'linux', 'win32'],
        perfProfile: { opsSec: 100000, baseline: '5.4x Node zlib' },
        security: { classification: 'low' },
        category: 'core'
      }
    ];

    defaultEntries.forEach(entry => this.store.set(entry));
  }

  // Display matrix as table
  displayMatrix(options: {
    platform?: 'darwin' | 'linux' | 'win32';
    stability?: 'experimental' | 'stable' | 'deprecated';
    category?: string;
    searchTerm?: string;
  } = {}): void {
    let entries = this.store.getAll();

    // Apply filters
    if (options.platform) {
      entries = entries.filter(e => e.platforms.includes(options.platform!));
    }
    if (options.stability) {
      entries = entries.filter(e => e.stability === options.stability);
    }
    if (options.category) {
      entries = entries.filter(e => e.category?.toLowerCase() === options.category!.toLowerCase());
    }
    if (options.searchTerm) {
      const term = options.searchTerm.toLowerCase();
      entries = entries.filter(e =>
        e.term.toLowerCase().includes(term) ||
        e.path.toLowerCase().includes(term) ||
        e.relatedTerms?.some(rt => rt.toLowerCase().includes(term))
      );
    }

    // Format for display
    const tableData = entries.map(entry => ({
      'API': entry.term,
      'Min Version': entry.bunMinVersion,
      'Stability': this.formatStability(entry.stability),
      'Platforms': entry.platforms.join(', '),
      'Perf': entry.perfProfile?.baseline || 'N/A',
      'Security': this.formatSecurity(entry.security),
      'Category': entry.category?.toUpperCase() || 'CORE',
      'Flags': entry.cliFlags?.join(', ') || 'none',
      'Updated': entry.lastUpdated?.toLocaleDateString() || 'N/A'
    }));

    console.log('\n📊 Bun Min Version Matrix');
    console.log('========================\n');
    console.log(Bun.inspect.table(tableData, [
      'API', 'Min Version', 'Stability', 'Platforms',
      'Perf', 'Security', 'Category', 'Flags', 'Updated'
    ]));

    // Summary stats
    this.displaySummary(entries);
  }

  private formatStability(stability: string): string {
    switch (stability) {
      case 'stable': return '✅ Stable';
      case 'experimental': return '🧪 Experimental';
      case 'deprecated': return '⚠️ Deprecated';
      default: return stability;
    }
  }

  private formatSecurity(security: SecurityScope): string {
    const icon = security.classification === 'high' ? '🔴' :
                 security.classification === 'medium' ? '🟡' : '🟢';
    let label = `${icon} ${security.classification}`;
    if (security.requiresRoot) label += ' (root)';
    if (security.zeroTrust) label += ' (ZT)';
    return label;
  }

  private displaySummary(entries: BunDocEntry[]): void {
    const stats = {
      total: entries.length,
      stable: entries.filter(e => e.stability === 'stable').length,
      experimental: entries.filter(e => e.stability === 'experimental').length,
      deprecated: entries.filter(e => e.stability === 'deprecated').length,
      highSecurity: entries.filter(e => e.security.classification === 'high').length
    };

    console.log('\n📈 Summary:');
    console.log(`  • Total APIs: ${stats.total}`);
    console.log(`  • ✅ Stable: ${stats.stable}`);
    console.log(`  • 🧪 Experimental: ${stats.experimental}`);
    console.log(`  • ⚠️ Deprecated: ${stats.deprecated}`);
    console.log(`  • 🔴 High Security: ${stats.highSecurity}`);
  }

  // Check compatibility with current Bun version
  checkCompatibility(bunVersion: string = process.env.BUN_VERSION || '1.3.7'): void {
    console.log(`\n🔍 Compatibility Check for Bun ${bunVersion}`);
    console.log('=====================================\n');

    const allEntries = this.store.getAll();
    const compatible = allEntries.filter(e =>
      this.store.isCompatible(e.term, bunVersion)
    );
    const incompatible = allEntries.filter(e =>
      !this.store.isCompatible(e.term, bunVersion)
    );

    if (incompatible.length > 0) {
      console.log('⚠️ Incompatible APIs:\n');
      const tableData = incompatible.map(entry => ({
        'API': entry.term,
        'Required': entry.bunMinVersion,
        'Current': bunVersion,
        'Status': '❌ Upgrade Required'
      }));
      console.log(Bun.inspect.table(tableData));
    }

    console.log(`\n✅ Compatible: ${compatible.length}/${allEntries.length} APIs`);
  }

  // Get breaking changes for version upgrade
  getBreakingChanges(targetVersion: string): void {
    console.log(`\n💥 Breaking Changes for v${targetVersion}`);
    console.log('===================================\n');

    const breaking = this.store.getBreakingChanges(targetVersion);

    if (breaking.length === 0) {
      console.log('✅ No breaking changes detected');
      return;
    }

    const tableData = breaking.map(entry => ({
      'API': entry.term,
      'Stability': entry.stability,
      'Breaking Since': entry.breakingChanges?.map(b =>
        `${b.major}.${b.minor}.${b.patch}`
      ).join(', ') || 'N/A',
      'Action': entry.removedIn ? 'REMOVED' :
                entry.deprecatedIn ? 'DEPRECATED' : 'Review'
    }));

    console.log(Bun.inspect.table(tableData));
  }

  // Update from RSS feeds
  async syncWithRSS(): Promise<void> {
    console.log('🔄 Syncing matrix with RSS feeds...');

    const feeds = [
      'https://bun.sh/blog/rss.xml',
      'https://bun.sh/blog/rss.xml#tag=sqlite',
      'https://bun.sh/blog/rss.xml#tag=ffi'
    ];

    for (const feed of feeds) {
      await this.store.updateFromRSS(feed);
    }

    console.log('✅ RSS sync complete');
  }
}

// CLI integration
export async function runMatrixCLI(args: string[]): Promise<void> {
  const viewer = new BunMatrixViewer();

  const command = args[0] || 'show';

  switch (command) {
    case 'show':
    case 'list':
      const options: any = {};

      // Parse flags
      for (let i = 1; i < args.length; i++) {
        const arg = args[i];
        if (arg.startsWith('--platform=')) {
          options.platform = arg.split('=')[1] as any;
        } else if (arg.startsWith('--stability=')) {
          options.stability = arg.split('=')[1] as any;
        } else if (arg.startsWith('--category=')) {
          options.category = arg.split('=')[1];
        } else if (arg.startsWith('--search=')) {
          options.searchTerm = arg.split('=')[1];
        }
      }

      viewer.displayMatrix(options);
      break;

    case 'check':
      viewer.checkCompatibility(args[1]);
      break;

    case 'breaking':
      viewer.getBreakingChanges(args[1] || '1.4.0');
      break;

    case 'sync':
      await viewer.syncWithRSS();
      break;

    default:
      console.log(`
📊 Bun Matrix CLI - Tier-1380 Infrastructure

Usage:
  bun-matrix show [options]     Display matrix
  bun-matrix check [version]    Check compatibility
  bun-matrix breaking [version] Show breaking changes
  bun-matrix sync               Update from RSS feeds

Options:
  --platform=darwin|linux|win32   Filter by platform
  --stability=stable|experimental|deprecated  Filter by stability
  --category=core|crypto|io|...   Filter by category
  --search=<term>                 Search APIs

Examples:
  bun-matrix show --platform=linux --stability=stable
  bun-matrix check 1.3.7
  bun-matrix breaking 1.4.0
  bun-matrix show --search=sqlite
      `);
  }
}

// Export for MCP integration
export const matrixViewer = new BunMatrixViewer();
export const matrixStore = matrixViewer['store'];
