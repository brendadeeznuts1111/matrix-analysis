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
  // Home/Thuis related fields
  thuisConfig?: {
    homeDirectory?: string;
    configFile?: string;
    envVars?: Record<string, string>;
    serviceMode?: 'daemon' | 'cli' | 'gui';
  };
  homeFeatures?: {
    localServer?: boolean;
    autoStart?: boolean;
    trayIcon?: boolean;
    notifications?: boolean;
  };
}

// Matrix data store
class BunMatrixStore {
  private entries = new Map<string, BunDocEntry>();
  private rssCache = new Map<string, { lastFetch: Date; entries: number }>();
  private metricsCache = new Map<string, any>();

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

  // Calculate comprehensive metrics
  calculateMetrics(): any {
    const cacheKey = 'metrics';
    const cached = this.metricsCache.get(cacheKey);

    // Cache for 5 minutes
    if (cached && (Date.now() - cached.timestamp) < 300000) {
      return cached.data;
    }

    const entries = this.getAll();
    const metrics = {
      timestamp: Date.now(),
      totals: this.calculateTotals(entries),
      patterns: this.analyzePatterns(entries),
      performance: this.analyzePerformance(entries),
      security: this.analyzeSecurityPatterns(entries),
      evolution: this.analyzeEvolution(entries),
      correlations: this.analyzeCorrelations(entries),
      homeAutomation: this.analyzeHomeAutomation(entries)
    };

    this.metricsCache.set(cacheKey, { timestamp: Date.now(), data: metrics });
    return metrics;
  }

  private calculateTotals(entries: BunDocEntry[]): any {
    return {
      apis: entries.length,
      platforms: [...new Set(entries.flatMap(e => e.platforms))].length,
      categories: [...new Set(entries.map(e => e.category || 'core'))].length,
      securityFlags: entries.filter(e => e.security.requiresRoot).length,
      zeroTrustApis: entries.filter(e => e.security.zeroTrust).length,
      cliFlags: [...new Set(entries.flatMap(e => e.cliFlags || []))].length,
      relatedTerms: [...new Set(entries.flatMap(e => e.relatedTerms || []))].length,
      avgVersion: this.calculateAverageVersion(entries),
      totalOpsPerSec: entries.reduce((sum, e) => sum + (e.perfProfile?.opsSec || 0), 0),
      homeAutomationApis: entries.filter(e => e.thuisConfig || e.homeFeatures).length
    };
  }

  private analyzePatterns(entries: BunDocEntry[]): any {
    const patterns = {
      versionDistribution: this.getVersionDistribution(entries),
      platformPopularity: this.getPlatformPopularity(entries),
      categoryDistribution: this.getCategoryDistribution(entries),
      securityTrends: this.getSecurityTrends(entries),
      stabilityProgression: this.getStabilityProgression(entries),
      namingPatterns: this.getNamingPatterns(entries),
      dependencyPatterns: this.getDependencyPatterns(entries)
    };

    return patterns;
  }

  private analyzePerformance(entries: BunDocEntry[]): any {
    const withPerf = entries.filter(e => e.perfProfile?.opsSec);

    return {
      avgOpsPerSec: withPerf.length > 0 ?
        withPerf.reduce((sum, e) => sum + e.perfProfile!.opsSec, 0) / withPerf.length : 0,
      maxOpsPerSec: Math.max(...withPerf.map(e => e.perfProfile!.opsSec || 0)),
      minOpsPerSec: Math.min(...withPerf.map(e => e.perfProfile!.opsSec || Infinity)),
      performanceByCategory: this.getPerformanceByCategory(entries),
      topPerformers: withPerf
        .sort((a, b) => (b.perfProfile?.opsSec || 0) - (a.perfProfile?.opsSec || 0))
        .slice(0, 5)
        .map(e => ({ api: e.term, ops: e.perfProfile?.opsSec })),
      baselineImprovements: this.getBaselineImprovements(entries)
    };
  }

  private analyzeSecurityPatterns(entries: BunDocEntry[]): any {
    return {
      classificationDistribution: {
        high: entries.filter(e => e.security.classification === 'high').length,
        medium: entries.filter(e => e.security.classification === 'medium').length,
        low: entries.filter(e => e.security.classification === 'low').length
      },
      rootRequired: entries.filter(e => e.security.requiresRoot).length,
      zeroTrustAdoption: entries.filter(e => e.security.zeroTrust).length,
      securityByCategory: this.getSecurityByCategory(entries),
      securityEvolution: this.getSecurityEvolution(entries),
      highRiskApis: entries.filter(e =>
        e.security.classification === 'high' &&
        (e.stability === 'experimental' || e.security.requiresRoot)
      ).map(e => e.term)
    };
  }

  private analyzeEvolution(entries: BunDocEntry[]): any {
    const sorted = entries.sort((a, b) =>
      this.compareVersions(a.bunMinVersion, b.bunMinVersion)
    );

    return {
      apisByVersion: this.groupByVersion(sorted),
      adoptionRate: this.getAdoptionRate(sorted),
      maturityIndex: this.getMaturityIndex(entries),
      deprecationRate: entries.filter(e => e.stability === 'deprecated').length / entries.length,
      experimentalToStableRatio:
        entries.filter(e => e.stability === 'experimental').length /
        entries.filter(e => e.stability === 'stable').length
    };
  }

  private analyzeCorrelations(entries: BunDocEntry[]): any {
    return {
      securityVsPerformance: this.getSecurityPerformanceCorrelation(entries),
      stabilityVsSecurity: this.getStabilitySecurityCorrelation(entries),
      platformVsFeatures: this.getPlatformFeatureCorrelation(entries),
      versionVsFeatures: this.getVersionFeatureCorrelation(entries),
      categoryVsSecurity: this.getCategorySecurityCorrelation(entries)
    };
  }

  private analyzeHomeAutomation(entries: BunDocEntry[]): any {
    const thuisApis = entries.filter(e => e.thuisConfig || e.homeFeatures);

    return {
      totalApis: thuisApis.length,
      serviceModes: this.getServiceModes(thuisApis),
      featureAdoption: {
        localServer: thuisApis.filter(e => e.homeFeatures?.localServer).length,
        autoStart: thuisApis.filter(e => e.homeFeatures?.autoStart).length,
        trayIcon: thuisApis.filter(e => e.homeFeatures?.trayIcon).length,
        notifications: thuisApis.filter(e => e.homeFeatures?.notifications).length
      },
      securityLevel: thuisApis.map(e => e.security.classification),
      integrationPatterns: this.getThuisIntegrationPatterns(thuisApis),
      configurationComplexity: this.getThuisConfigComplexity(thuisApis)
    };
  }

  // Helper methods for pattern analysis
  private calculateAverageVersion(entries: BunDocEntry[]): string {
    const versions = entries.map(e => e.bunMinVersion.split('.').map(Number));
    const avg = versions.reduce((acc, [major, minor, patch]) => ({
      major: acc.major + major / versions.length,
      minor: acc.minor + minor / versions.length,
      patch: acc.patch + patch / versions.length
    }), { major: 0, minor: 0, patch: 0 });

    return `${Math.round(avg.major)}.${Math.round(avg.minor)}.${Math.round(avg.patch)}`;
  }

  private compareVersions(a: string, b: string): number {
    const [am, amn, ap] = a.split('.').map(Number);
    const [bm, bmn, bp] = b.split('.').map(Number);

    if (am !== bm) return am - bm;
    if (amn !== bmn) return amn - bmn;
    return ap - bp;
  }

  private getVersionDistribution(entries: BunDocEntry[]): Record<string, number> {
    const dist: Record<string, number> = {};
    for (const entry of entries) {
      const major = entry.bunMinVersion.split('.')[0];
      dist[`v${major}`] = (dist[`v${major}`] || 0) + 1;
    }
    return dist;
  }

  private getPlatformPopularity(entries: BunDocEntry[]): Record<string, number> {
    const pop: Record<string, number> = {};
    for (const entry of entries) {
      for (const platform of entry.platforms) {
        pop[platform] = (pop[platform] || 0) + 1;
      }
    }
    return pop;
  }

  private getCategoryDistribution(entries: BunDocEntry[]): Record<string, number> {
    const dist: Record<string, number> = {};
    for (const entry of entries) {
      const cat = entry.category?.toUpperCase() || 'CORE';
      dist[cat] = (dist[cat] || 0) + 1;
    }
    return dist;
  }

  private getSecurityTrends(entries: BunDocEntry[]): any {
    return {
      increasingSecurity: entries.filter(e => e.security.zeroTrust).length,
      rootPrivilegeUsage: entries.filter(e => e.security.requiresRoot).length,
      classificationBalance: {
        high: entries.filter(e => e.security.classification === 'high').length,
        medium: entries.filter(e => e.security.classification === 'medium').length,
        low: entries.filter(e => e.security.classification === 'low').length
      }
    };
  }

  private getStabilityProgression(entries: BunDocEntry[]): any {
    const progression = {
      experimental: entries.filter(e => e.stability === 'experimental').length,
      stable: entries.filter(e => e.stability === 'stable').length,
      deprecated: entries.filter(e => e.stability === 'deprecated').length
    };

    return {
      ...progression,
      maturityRatio: progression.stable / (progression.experimental + progression.stable),
      deprecationRate: progression.deprecated / entries.length
    };
  }

  private getNamingPatterns(entries: BunDocEntry[]): any {
    const patterns = {
      withBunPrefix: entries.filter(e => e.term.startsWith('Bun.')).length,
      withDotNotation: entries.filter(e => e.term.includes('.')).length,
      camelCase: entries.filter(e => /^[a-z][A-Za-z]*$/.test(e.term)).length,
      withModuleSuffix: entries.filter(e => /\.(hash|crypt|serve|file)$/.test(e.term)).length
    };

    return {
      ...patterns,
      avgLength: entries.reduce((sum, e) => sum + e.term.length, 0) / entries.length,
      mostCommonPrefix: this.getMostCommonPrefix(entries.map(e => e.term))
    };
  }

  private getDependencyPatterns(entries: BunDocEntry[]): any {
    const relatedTerms = entries.flatMap(e => e.relatedTerms || []);
    const termFrequency: Record<string, number> = {};

    for (const term of relatedTerms) {
      termFrequency[term] = (termFrequency[term] || 0) + 1;
    }

    return {
      totalRelatedTerms: relatedTerms.length,
      uniqueRelatedTerms: Object.keys(termFrequency).length,
      mostReferenced: Object.entries(termFrequency)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([term, count]) => ({ term, count })),
      avgRelatedTerms: relatedTerms.length / entries.length
    };
  }

  private getPerformanceByCategory(entries: BunDocEntry[]): Record<string, number> {
    const perf: Record<string, { sum: number; count: number }> = {};

    for (const entry of entries) {
      if (entry.perfProfile?.opsSec) {
        const cat = entry.category?.toUpperCase() || 'CORE';
        if (!perf[cat]) perf[cat] = { sum: 0, count: 0 };
        perf[cat].sum += entry.perfProfile.opsSec;
        perf[cat].count++;
      }
    }

    const result: Record<string, number> = {};
    for (const [cat, data] of Object.entries(perf)) {
      result[cat] = data.sum / data.count;
    }

    return result;
  }

  private getBaselineImprovements(entries: BunDocEntry[]): any {
    const improvements = entries
      .filter(e => e.perfProfile?.baseline && e.perfProfile.baseline !== 'N/A')
      .map(e => {
        const match = e.perfProfile!.baseline.match(/(\d+\.?\d*)x/);
        return {
          api: e.term,
          improvement: match ? parseFloat(match[1]) : 0,
          baseline: e.perfProfile!.baseline
        };
      })
      .filter(e => e.improvement > 0);

    return {
      count: improvements.length,
      avgImprovement: improvements.reduce((sum, e) => sum + e.improvement, 0) / improvements.length,
      topImprovements: improvements.sort((a, b) => b.improvement - a.improvement).slice(0, 5)
    };
  }

  private getSecurityByCategory(entries: BunDocEntry[]): Record<string, any> {
    const result: Record<string, { high: number; medium: number; low: number }> = {};

    for (const entry of entries) {
      const cat = entry.category?.toUpperCase() || 'CORE';
      if (!result[cat]) result[cat] = { high: 0, medium: 0, low: 0 };
      result[cat][entry.security.classification]++;
    }

    return result;
  }

  private getSecurityEvolution(entries: BunDocEntry[]): any {
    const sorted = entries.sort((a, b) => this.compareVersions(a.bunMinVersion, b.bunMinVersion));
    const evolution = [];

    for (let i = 0; i < sorted.length; i += Math.ceil(sorted.length / 5)) {
      const chunk = sorted.slice(i, i + Math.ceil(sorted.length / 5));
      const version = chunk[0].bunMinVersion;
      const security = {
        high: chunk.filter(e => e.security.classification === 'high').length,
        medium: chunk.filter(e => e.security.classification === 'medium').length,
        low: chunk.filter(e => e.security.classification === 'low').length
      };
      evolution.push({ version, ...security });
    }

    return evolution;
  }

  private groupByVersion(entries: BunDocEntry[]): Record<string, string[]> {
    const grouped: Record<string, string[]> = {};

    for (const entry of entries) {
      const version = entry.bunMinVersion.split('.').slice(0, 2).join('.');
      if (!grouped[version]) grouped[version] = [];
      grouped[version].push(entry.term);
    }

    return grouped;
  }

  private getAdoptionRate(entries: BunDocEntry[]): number {
    const stable = entries.filter(e => e.stability === 'stable').length;
    return stable / entries.length;
  }

  private getMaturityIndex(entries: BunDocEntry[]): number {
    const stable = entries.filter(e => e.stability === 'stable').length;
    const deprecated = entries.filter(e => e.stability === 'deprecated').length;
    const experimental = entries.filter(e => e.stability === 'experimental').length;

    return (stable * 2 + experimental - deprecated * 3) / entries.length;
  }

  private getSecurityPerformanceCorrelation(entries: BunDocEntry[]): any {
    const correlation: Record<string, { avg: number; count: number }> = {};

    for (const entry of entries) {
      if (entry.perfProfile?.opsSec) {
        const level = entry.security.classification;
        if (!correlation[level]) correlation[level] = { avg: 0, count: 0 };
        correlation[level].avg += entry.perfProfile.opsSec;
        correlation[level].count++;
      }
    }

    for (const level of Object.keys(correlation)) {
      correlation[level].avg /= correlation[level].count;
    }

    return correlation;
  }

  private getStabilitySecurityCorrelation(entries: BunDocEntry[]): any {
    const correlation: Record<string, Record<string, number>> = {};

    for (const entry of entries) {
      const stability = entry.stability;
      const security = entry.security.classification;

      if (!correlation[stability]) correlation[stability] = { high: 0, medium: 0, low: 0 };
      correlation[stability][security]++;
    }

    return correlation;
  }

  private getPlatformFeatureCorrelation(entries: BunDocEntry[]): any {
    const correlation: Record<string, { thuis: number; total: number; thuisPct?: string }> = {};

    for (const entry of entries) {
      for (const platform of entry.platforms) {
        if (!correlation[platform]) correlation[platform] = { thuis: 0, total: 0 };
        correlation[platform].total++;
        if (entry.thuisConfig || entry.homeFeatures) {
          correlation[platform].thuis++;
        }
      }
    }

    // Calculate percentages
    for (const platform of Object.keys(correlation)) {
      correlation[platform].thuisPct =
        (correlation[platform].thuis / correlation[platform].total * 100).toFixed(1);
    }

    return correlation;
  }

  private getVersionFeatureCorrelation(entries: BunDocEntry[]): any {
    const correlation: Record<string, { features: number; total: number; avgFeatures?: number }> = {};

    for (const entry of entries) {
      const version = entry.bunMinVersion.split('.')[0];
      if (!correlation[version]) correlation[version] = { features: 0, total: 0 };
      correlation[version].total++;

      const features = [
        entry.perfProfile?.opsSec ? 1 : 0,
        entry.cliFlags?.length ? 1 : 0,
        entry.relatedTerms?.length ? 1 : 0,
        entry.thuisConfig ? 1 : 0
      ].reduce((sum, f) => sum + f, 0);

      correlation[version].features += features;
    }

    // Calculate averages
    for (const version of Object.keys(correlation)) {
      correlation[version].avgFeatures =
        correlation[version].features / correlation[version].total;
    }

    return correlation;
  }

  private getCategorySecurityCorrelation(entries: BunDocEntry[]): any {
    return this.getSecurityByCategory(entries);
  }

  private getServiceModes(thuisApis: BunDocEntry[]): Record<string, number> {
    const modes: Record<string, number> = {};

    for (const api of thuisApis) {
      const mode = api.thuisConfig?.serviceMode || 'unknown';
      modes[mode] = (modes[mode] || 0) + 1;
    }

    return modes;
  }

  private getThuisIntegrationPatterns(thuisApis: BunDocEntry[]): any {
    return {
      withLocalServer: thuisApis.filter(e => e.homeFeatures?.localServer).length,
      withAutomation: thuisApis.filter(e => e.term.includes('automate')).length,
      withSsl: thuisApis.filter(e => e.term.includes('serve')).length,
      daemonServices: thuisApis.filter(e => e.thuisConfig?.serviceMode === 'daemon').length
    };
  }

  private getThuisConfigComplexity(thuisApis: BunDocEntry[]): any {
    const complexities = thuisApis.map(api => ({
      api: api.term,
      envVars: api.thuisConfig?.envVars ? Object.keys(api.thuisConfig.envVars).length : 0,
      features: api.homeFeatures ? Object.values(api.homeFeatures).filter(Boolean).length : 0,
      cliFlags: api.cliFlags?.length || 0
    }));

    return {
      avgEnvVars: complexities.reduce((sum, c) => sum + c.envVars, 0) / complexities.length,
      avgFeatures: complexities.reduce((sum, c) => sum + c.features, 0) / complexities.length,
      mostComplex: complexities.sort((a, b) =>
        (b.envVars + b.features) - (a.envVars + a.features)
      )[0]
    };
  }

  private getMostCommonPrefix(terms: string[]): string {
    const prefixes: Record<string, number> = {};

    for (const term of terms) {
      const parts = term.split('.');
      if (parts.length > 1) {
        const prefix = parts[0];
        prefixes[prefix] = (prefixes[prefix] || 0) + 1;
      }
    }

    return Object.entries(prefixes).sort(([, a], [, b]) => b - a)[0]?.[0] || 'none';
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
      },
      {
        term: 'Bun.thuis',
        path: '/docs/api/thuis',
        bunMinVersion: '1.3.7',
        stability: 'experimental',
        platforms: ['darwin', 'linux', 'win32'],
        perfProfile: { opsSec: 10000, baseline: 'Home automation' },
        security: { classification: 'medium' },
        category: 'cli',
        thuisConfig: {
          homeDirectory: '~/.bun/thuis',
          configFile: 'thuis.config.json',
          envVars: { THUIS_HOME: '~/.bun/thuis', THUIS_MODE: 'daemon' },
          serviceMode: 'daemon'
        },
        homeFeatures: {
          localServer: true,
          autoStart: true,
          trayIcon: true,
          notifications: true
        },
        cliFlags: ['--thuis-daemon', '--thuis-config'],
        relatedTerms: ['Bun.serve', 'Bun.file']
      },
      {
        term: 'Bun.home',
        path: '/docs/api/home',
        bunMinVersion: '1.3.7',
        stability: 'experimental',
        platforms: ['darwin', 'linux', 'win32'],
        perfProfile: { opsSec: 50000, baseline: 'Home directory manager' },
        security: { classification: 'medium' },
        category: 'cli',
        thuisConfig: {
          homeDirectory: process.env.HOME || process.env.USERPROFILE,
          configFile: '.bunhomerc',
          envVars: { BUN_HOME: '~/.bun', BUN_CONFIG: '~/.bun/config' },
          serviceMode: 'cli'
        },
        homeFeatures: {
          localServer: false,
          autoStart: false,
          trayIcon: false,
          notifications: false
        },
        cliFlags: ['--home', '--config'],
        relatedTerms: ['Bun.thuis', 'Bun.file']
      },
      {
        term: 'Bun.thuis.serve',
        path: '/docs/api/thuis/serve',
        bunMinVersion: '1.3.7',
        stability: 'experimental',
        platforms: ['darwin', 'linux', 'win32'],
        perfProfile: { opsSec: 30000, baseline: 'Local home server' },
        security: { classification: 'medium', zeroTrust: true },
        category: 'network',
        thuisConfig: {
          homeDirectory: '~/.bun/thuis/server',
          configFile: 'server.config.json',
          envVars: { THUIS_SERVER_PORT: '3000', THUIS_SSL: 'true' },
          serviceMode: 'daemon'
        },
        homeFeatures: {
          localServer: true,
          autoStart: true,
          trayIcon: true,
          notifications: true
        },
        cliFlags: ['--port', '--ssl', '--thuis-serve'],
        relatedTerms: ['Bun.serve', 'Bun.thuis']
      },
      {
        term: 'Bun.thuis.automate',
        path: '/docs/api/thuis/automate',
        bunMinVersion: '1.3.7',
        stability: 'experimental',
        platforms: ['darwin', 'linux'],
        perfProfile: { opsSec: 5000, baseline: 'Task automation' },
        security: { classification: 'high', requiresRoot: true },
        category: 'cli',
        thuisConfig: {
          homeDirectory: '~/.bun/thuis/automation',
          configFile: 'automation.yaml',
          envVars: { THUIS_AUTOMATE: 'enabled', THUIS_SCHEDULE: 'cron' },
          serviceMode: 'daemon'
        },
        homeFeatures: {
          localServer: false,
          autoStart: true,
          trayIcon: true,
          notifications: true
        },
        cliFlags: ['--schedule', '--thuis-automate'],
        relatedTerms: ['Bun.spawn', 'Bun.thuis']
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
    thuisFeatures?: boolean;
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
    if (options.thuisFeatures) {
      entries = entries.filter(e => e.thuisConfig || e.homeFeatures);
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
      'Updated': entry.lastUpdated?.toLocaleDateString() || 'N/A',
      // Thuis/Home columns
      'Home Dir': entry.thuisConfig?.homeDirectory || 'N/A',
      'Service': entry.thuisConfig?.serviceMode || 'N/A',
      'Local Server': entry.homeFeatures?.localServer ? '✅' : '❌',
      'Auto Start': entry.homeFeatures?.autoStart ? '✅' : '❌',
      'Tray Icon': entry.homeFeatures?.trayIcon ? '✅' : '❌',
      'Notifications': entry.homeFeatures?.notifications ? '✅' : '❌'
    }));

    console.log('\n📊 Bun Min Version Matrix');
    console.log('========================\n');
    console.log(Bun.inspect.table(tableData, [
      'API', 'Min Version', 'Stability', 'Platforms',
      'Perf', 'Security', 'Category', 'Flags', 'Updated',
      'Home Dir', 'Service', 'Local Server', 'Auto Start',
      'Tray Icon', 'Notifications'
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
      highSecurity: entries.filter(e => e.security.classification === 'high').length,
      thuisEnabled: entries.filter(e => e.thuisConfig || e.homeFeatures).length,
      localServers: entries.filter(e => e.homeFeatures?.localServer).length,
      autoStart: entries.filter(e => e.homeFeatures?.autoStart).length,
      withErrors: entries.filter(e => this.hasErrors(e)).length,
      defaultConfigs: entries.filter(e => this.isDefaultConfig(e)).length,
      customConfigs: entries.filter(e => !this.isDefaultConfig(e)).length
    };

    const categories = this.getCategoryStats(entries);
    const platforms = this.getPlatformStats(entries);
    const security = this.getSecurityStats(entries);

    console.log('\n📈 Summary Report:');
    console.log('================');

    // Basic stats
    console.log('\n📊 Basic Statistics:');
    console.log(`  • Total APIs: ${stats.total}`);
    console.log(`  • ✅ Stable: ${stats.stable} (${this.percentage(stats.stable, stats.total)}%)`);
    console.log(`  • 🧪 Experimental: ${stats.experimental} (${this.percentage(stats.experimental, stats.total)}%)`);
    console.log(`  • ⚠️ Deprecated: ${stats.deprecated} (${this.percentage(stats.deprecated, stats.total)}%)`);

    // Thuis/Home features
    console.log('\n🏠 Thuis/Home Features:');
    console.log(`  • APIs with Thuis support: ${stats.thuisEnabled} (${this.percentage(stats.thuisEnabled, stats.total)}%)`);
    console.log(`  • Local servers: ${stats.localServers}`);
    console.log(`  • Auto-start services: ${stats.autoStart}`);

    // Configuration stats
    console.log('\n⚙️ Configuration:');
    console.log(`  • Default configs: ${stats.defaultConfigs}`);
    console.log(`  • Custom configs: ${stats.customConfigs}`);
    console.log(`  • APIs with errors: ${stats.withErrors}`);

    // Categories
    console.log('\n📂 Categories:');
    for (const [category, count] of Object.entries(categories)) {
      const icon = this.getCategoryIcon(category);
      console.log(`  • ${icon} ${category}: ${count}`);
    }

    // Platforms
    console.log('\n� Platform Support:');
    for (const [platform, count] of Object.entries(platforms)) {
      const icon = this.getPlatformIcon(platform);
      console.log(`  • ${icon} ${platform}: ${count} APIs`);
    }

    // Security
    console.log('\n🔒 Security Classification:');
    console.log(`  • � High: ${security.high} (requires special handling)`);
    console.log(`  • 🟡 Medium: ${security.medium} (standard security)`);
    console.log(`  • 🟢 Low: ${security.low} (minimal security)`);

    // Errors and warnings
    if (stats.withErrors > 0) {
      console.log('\n⚠️ Errors Detected:');
      const errorEntries = entries.filter(e => this.hasErrors(e));
      for (const entry of errorEntries) {
        const errors = this.getErrors(entry);
        console.log(`  • ${entry.term}: ${errors.join(', ')}`);
      }
    }

    // Recommendations
    this.displayRecommendations(stats, entries);
  }

  // Helper methods for improved summary
  private percentage(value: number, total: number): string {
    return total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
  }

  private getCategoryStats(entries: BunDocEntry[]): Record<string, number> {
    const stats: Record<string, number> = {};
    for (const entry of entries) {
      const category = entry.category?.toUpperCase() || 'CORE';
      stats[category] = (stats[category] || 0) + 1;
    }
    return stats;
  }

  private getPlatformStats(entries: BunDocEntry[]): Record<string, number> {
    const stats: Record<string, number> = {};
    for (const entry of entries) {
      for (const platform of entry.platforms) {
        stats[platform] = (stats[platform] || 0) + 1;
      }
    }
    return stats;
  }

  private getSecurityStats(entries: BunDocEntry[]): { high: number; medium: number; low: number } {
    return {
      high: entries.filter(e => e.security.classification === 'high').length,
      medium: entries.filter(e => e.security.classification === 'medium').length,
      low: entries.filter(e => e.security.classification === 'low').length
    };
  }

  private getCategoryIcon(category: string): string {
    const icons: Record<string, string> = {
      'CORE': '⚙️',
      'CLI': '💻',
      'NETWORK': '🌐',
      'CRYPTO': '🔐',
      'IO': '📁',
      'FFI': '🔗',
      'WEB': '🌍'
    };
    return icons[category] || '📦';
  }

  private getPlatformIcon(platform: string): string {
    const icons: Record<string, string> = {
      'darwin': '🍎',
      'linux': '🐧',
      'win32': '🪟'
    };
    return icons[platform] || '💻';
  }

  private hasErrors(entry: BunDocEntry): boolean {
    const errors: string[] = [];

    // Check for missing required fields
    if (!entry.term) errors.push('missing term');
    if (!entry.path) errors.push('missing path');
    if (!entry.bunMinVersion) errors.push('missing min version');

    // Check for invalid version format
    if (entry.bunMinVersion && !/^\d+\.\d+\.\d+$/.test(entry.bunMinVersion)) {
      errors.push('invalid version format');
    }

    // Check for empty platforms
    if (!entry.platforms || entry.platforms.length === 0) {
      errors.push('no platforms specified');
    }

    // Check Thuis config consistency
    if (entry.thuisConfig && entry.homeFeatures) {
      if (entry.thuisConfig.serviceMode === 'daemon' && !entry.homeFeatures.autoStart) {
        errors.push('daemon should have auto-start');
      }
    }

    // Check for deprecated APIs without removal version
    if (entry.stability === 'deprecated' && !entry.removedIn) {
      errors.push('deprecated without removal version');
    }

    return errors.length > 0;
  }

  private getErrors(entry: BunDocEntry): string[] {
    const errors: string[] = [];

    if (!entry.term) errors.push('missing term');
    if (!entry.path) errors.push('missing path');
    if (!entry.bunMinVersion) errors.push('missing min version');
    if (entry.bunMinVersion && !/^\d+\.\d+\.\d+$/.test(entry.bunMinVersion)) {
      errors.push('invalid version format');
    }
    if (!entry.platforms || entry.platforms.length === 0) {
      errors.push('no platforms specified');
    }
    if (entry.thuisConfig && entry.homeFeatures) {
      if (entry.thuisConfig.serviceMode === 'daemon' && !entry.homeFeatures.autoStart) {
        errors.push('daemon should have auto-start');
      }
    }
    if (entry.stability === 'deprecated' && !entry.removedIn) {
      errors.push('deprecated without removal version');
    }

    return errors;
  }

  private isDefaultConfig(entry: BunDocEntry): boolean {
    // Check if entry uses default configurations
    const hasDefaultPerf = !entry.perfProfile ||
      (entry.perfProfile.baseline === 'N/A' && !entry.perfProfile.opsSec);
    const hasDefaultSecurity = entry.security.classification === 'medium' &&
      !entry.security.requiresRoot && !entry.security.zeroTrust;
    const hasDefaultFlags = !entry.cliFlags || entry.cliFlags.length === 0;
    const hasDefaultThuis = !entry.thuisConfig && !entry.homeFeatures;

    return hasDefaultPerf && hasDefaultSecurity && hasDefaultFlags && hasDefaultThuis;
  }

  private displayRecommendations(stats: any, entries: BunDocEntry[]): void {
    console.log('\n💡 Recommendations:');

    if (stats.experimental > stats.stable) {
      console.log('  • Consider stabilizing experimental APIs');
    }

    if (stats.withErrors > 0) {
      console.log('  • Fix detected configuration errors');
    }

    if (stats.highSecurity > 0) {
      console.log('  • Review high-security APIs for compliance');
    }

    if (stats.deprecated > 0) {
      console.log('  • Plan migration from deprecated APIs');
    }

    const lowUsageEntries = entries.filter(e =>
      e.perfProfile?.opsSec && e.perfProfile.opsSec < 10000
    );
    if (lowUsageEntries.length > 0) {
      console.log('  • Consider optimizing low-performance APIs');
    }

    if (stats.thuisEnabled > 0 && stats.localServers < stats.thuisEnabled) {
      console.log('  • Enable local servers for all Thuis APIs');
    }

    // Check for missing documentation
    const missingDocs = entries.filter(e => !e.lastUpdated);
    if (missingDocs.length > 0) {
      console.log('  • Update documentation for outdated APIs');
    }
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

  // Display comprehensive metrics
  displayMetrics(): void {
    console.log('\n📊 Comprehensive Metrics Report');
    console.log('==============================\n');

    const metrics = this.store.calculateMetrics();

    // Totals section
    console.log('🔢 Totals & Aggregates:');
    console.log('---------------------');
    console.log(`Total APIs: ${metrics.totals.apis}`);
    console.log(`Platforms Supported: ${metrics.totals.platforms}`);
    console.log(`Categories: ${metrics.totals.categories}`);
    console.log(`Security Flags: ${metrics.totals.securityFlags}`);
    console.log(`Zero Trust APIs: ${metrics.totals.zeroTrustApis}`);
    console.log(`CLI Flags: ${metrics.totals.cliFlags}`);
    console.log(`Related Terms: ${metrics.totals.relatedTerms}`);
    console.log(`Average Version: ${metrics.totals.avgVersion}`);
    console.log(`Total Ops/sec: ${metrics.totals.totalOpsPerSec.toLocaleString()}`);
    console.log(`Home Automation APIs: ${metrics.totals.homeAutomationApis}`);

    // Performance metrics
    console.log('\n⚡ Performance Metrics:');
    console.log('-----------------------');
    console.log(`Average Ops/sec: ${Math.round(metrics.performance.avgOpsPerSec).toLocaleString()}`);
    console.log(`Maximum Ops/sec: ${metrics.performance.maxOpsPerSec.toLocaleString()}`);
    console.log(`Minimum Ops/sec: ${metrics.performance.minOpsPerSec === Infinity ? 'N/A' : metrics.performance.minOpsPerSec.toLocaleString()}`);

    console.log('\nTop Performers:');
    for (const performer of metrics.performance.topPerformers) {
      console.log(`  • ${performer.api}: ${performer.ops?.toLocaleString()} ops/sec`);
    }

    console.log('\nBaseline Improvements:');
    console.log(`  APIs with improvements: ${metrics.performance.baselineImprovements.count}`);
    console.log(`  Average improvement: ${metrics.performance.baselineImprovements.avgImprovement.toFixed(1)}x`);

    // Security metrics
    console.log('\n🔒 Security Overview:');
    console.log('---------------------');
    console.log(`High Security APIs: ${metrics.security.classificationDistribution.high}`);
    console.log(`Medium Security APIs: ${metrics.security.classificationDistribution.medium}`);
    console.log(`Low Security APIs: ${metrics.security.classificationDistribution.low}`);
    console.log(`Root Required: ${metrics.security.rootRequired}`);
    console.log(`Zero Trust Adoption: ${metrics.security.zeroTrustAdoption}`);

    if (metrics.security.highRiskApis.length > 0) {
      console.log('\n⚠️ High-Risk APIs:');
      for (const api of metrics.security.highRiskApis) {
        console.log(`  • ${api}`);
      }
    }

    // Evolution metrics
    console.log('\n📈 Evolution Metrics:');
    console.log('---------------------');
    console.log(`Adoption Rate: ${(metrics.evolution.adoptionRate * 100).toFixed(1)}%`);
    console.log(`Maturity Index: ${metrics.evolution.maturityIndex.toFixed(2)}`);
    console.log(`Deprecation Rate: ${(metrics.evolution.deprecationRate * 100).toFixed(1)}%`);
    console.log(`Experimental/Stable Ratio: ${metrics.evolution.experimentalToStableRatio.toFixed(2)}`);

    // Home automation metrics
    console.log('\n🏠 Home Automation Metrics:');
    console.log('---------------------------');
    console.log(`Total Thuis APIs: ${metrics.homeAutomation.totalApis}`);
    console.log('Service Modes:');
    for (const [mode, count] of Object.entries(metrics.homeAutomation.serviceModes)) {
      console.log(`  • ${mode}: ${count}`);
    }
    console.log('Feature Adoption:');
    for (const [feature, count] of Object.entries(metrics.homeAutomation.featureAdoption)) {
      console.log(`  • ${feature}: ${count}`);
    }
  }

  // Display pattern analysis
  displayPatterns(): void {
    console.log('\n🔍 Pattern Analysis Report');
    console.log('==========================\n');

    const metrics = this.store.calculateMetrics();

    // Version distribution
    console.log('📦 Version Distribution:');
    console.log('------------------------');
    for (const [version, count] of Object.entries(metrics.patterns.versionDistribution)) {
      const countNum = count as number;
      const percentage = ((countNum / metrics.totals.apis) * 100).toFixed(1);
      console.log(`  ${version}: ${countNum} APIs (${percentage}%)`);
    }

    // Platform popularity
    console.log('\n💻 Platform Popularity:');
    console.log('------------------------');
    const sortedPlatforms = Object.entries(metrics.patterns.platformPopularity)
      .sort(([, a], [, b]) => (b as number) - (a as number));
    for (const [platform, count] of sortedPlatforms) {
      const countNum = count as number;
      const percentage = ((countNum / metrics.totals.apis) * 100).toFixed(1);
      console.log(`  ${platform}: ${countNum} APIs (${percentage}%)`);
    }

    // Category distribution
    console.log('\n📂 Category Distribution:');
    console.log('-------------------------');
    const sortedCategories = Object.entries(metrics.patterns.categoryDistribution)
      .sort(([, a], [, b]) => (b as number) - (a as number));
    for (const [category, count] of sortedCategories) {
      const countNum = count as number;
      const percentage = ((countNum / metrics.totals.apis) * 100).toFixed(1);
      console.log(`  ${category}: ${countNum} APIs (${percentage}%)`);
    }

    // Naming patterns
    console.log('\n📝 Naming Patterns:');
    console.log('-------------------');
    console.log(`  With Bun prefix: ${metrics.patterns.namingPatterns.withBunPrefix}`);
    console.log(`  With dot notation: ${metrics.patterns.namingPatterns.withDotNotation}`);
    console.log(`  CamelCase: ${metrics.patterns.namingPatterns.camelCase}`);
    console.log(`  With module suffix: ${metrics.patterns.namingPatterns.withModuleSuffix}`);
    console.log(`  Average name length: ${metrics.patterns.namingPatterns.avgLength.toFixed(1)} characters`);
    console.log(`  Most common prefix: ${metrics.patterns.namingPatterns.mostCommonPrefix}`);

    // Dependency patterns
    console.log('\n🔗 Dependency Patterns:');
    console.log('----------------------');
    console.log(`  Total related terms: ${metrics.patterns.dependencyPatterns.totalRelatedTerms}`);
    console.log(`  Unique related terms: ${metrics.patterns.dependencyPatterns.uniqueRelatedTerms}`);
    console.log(`  Average related terms per API: ${metrics.patterns.dependencyPatterns.avgRelatedTerms.toFixed(1)}`);

    console.log('\n  Most Referenced APIs:');
    for (const ref of metrics.patterns.dependencyPatterns.mostReferenced) {
      console.log(`    • ${ref.term}: referenced ${ref.count} times`);
    }

    // Stability progression
    console.log('\n📊 Stability Progression:');
    console.log('-------------------------');
    console.log(`  Experimental: ${metrics.patterns.stabilityProgression.experimental}`);
    console.log(`  Stable: ${metrics.patterns.stabilityProgression.stable}`);
    console.log(`  Deprecated: ${metrics.patterns.stabilityProgression.deprecated}`);
    console.log(`  Maturity ratio: ${metrics.patterns.stabilityProgression.maturityRatio.toFixed(2)}`);

    // Correlations
    console.log('\n🔗 Key Correlations:');
    console.log('--------------------');

    console.log('\n  Security vs Performance:');
    for (const [level, data] of Object.entries(metrics.correlations.securityVsPerformance)) {
      const dataAny = data as any;
      console.log(`    ${level}: ${Math.round(dataAny.avg).toLocaleString()} avg ops/sec`);
    }

    console.log('\n  Platform vs Thuis Features:');
    for (const [platform, data] of Object.entries(metrics.correlations.platformVsFeatures)) {
      const dataAny = data as any;
      console.log(`    ${platform}: ${dataAny.thuisPct}% with Thuis features`);
    }

    console.log('\n  Version vs Feature Richness:');
    for (const [version, data] of Object.entries(metrics.correlations.versionVsFeatures)) {
      const dataAny = data as any;
      console.log(`    v${version}: ${dataAny.avgFeatures.toFixed(1)} avg features`);
    }
  }

  // Display detailed totals
  displayTotals(): void {
    console.log('\n📊 Detailed Totals Report');
    console.log('========================\n');

    const metrics = this.store.calculateMetrics();

    // API totals by category
    console.log('📂 APIs by Category:');
    console.log('---------------------');
    const categoryTotals: Record<string, { stable: number; experimental: number; deprecated: number }> = {};

    for (const entry of this.store.getAll()) {
      const cat = entry.category?.toUpperCase() || 'CORE';
      if (!categoryTotals[cat]) {
        categoryTotals[cat] = { stable: 0, experimental: 0, deprecated: 0 };
      }
      categoryTotals[cat][entry.stability]++;
    }

    for (const [category, totals] of Object.entries(categoryTotals)) {
      const total = totals.stable + totals.experimental + totals.deprecated;
      console.log(`  ${category}:`);
      console.log(`    Total: ${total}`);
      console.log(`    ✅ Stable: ${totals.stable}`);
      console.log(`    🧪 Experimental: ${totals.experimental}`);
      console.log(`    ⚠️ Deprecated: ${totals.deprecated}`);
    }

    // Platform totals
    console.log('\n💻 Platform Coverage:');
    console.log('---------------------');
    for (const platform of ['darwin', 'linux', 'win32']) {
      const count = this.store.getAll().filter(e => e.platforms.includes(platform as any)).length;
      const percentage = ((count / metrics.totals.apis) * 100).toFixed(1);
      console.log(`  ${platform}: ${count} APIs (${percentage}%)`);
    }

    // Security totals
    console.log('\n🔒 Security Breakdown:');
    console.log('---------------------');
    console.log(`  High Security: ${metrics.security.classificationDistribution.high} APIs`);
    console.log(`  Medium Security: ${metrics.security.classificationDistribution.medium} APIs`);
    console.log(`  Low Security: ${metrics.security.classificationDistribution.low} APIs`);
    console.log(`  Requiring Root: ${metrics.security.rootRequired} APIs`);
    console.log(`  Zero Trust Enabled: ${metrics.security.zeroTrustAdoption} APIs`);

    // Performance totals
    console.log('\n⚡ Performance Totals:');
    console.log('----------------------');
    const withPerf = this.store.getAll().filter(e => e.perfProfile?.opsSec);
    console.log(`  APIs with performance data: ${withPerf.length}`);
    console.log(`  Total throughput: ${metrics.totals.totalOpsPerSec.toLocaleString()} ops/sec`);
    console.log(`  Average throughput: ${Math.round(metrics.performance.avgOpsPerSec).toLocaleString()} ops/sec`);

    // Version totals
    console.log('\n📦 Version Distribution:');
    console.log('------------------------');
    const versionGroups: Record<string, string[]> = {};
    for (const entry of this.store.getAll()) {
      const version = entry.bunMinVersion.split('.').slice(0, 2).join('.');
      if (!versionGroups[version]) versionGroups[version] = [];
      versionGroups[version].push(entry.term);
    }

    for (const [version, apis] of Object.entries(versionGroups).sort()) {
      console.log(`  ${version}: ${apis.length} APIs`);
      if (apis.length <= 5) {
        console.log(`    ${apis.join(', ')}`);
      } else {
        console.log(`    ${apis.slice(0, 3).join(', ')}, ... (+${apis.length - 3} more)`);
      }
    }

    // Feature totals
    console.log('\n🌟 Feature Adoption:');
    console.log('-------------------');
    const withFlags = this.store.getAll().filter(e => e.cliFlags && e.cliFlags.length > 0);
    const withRelated = this.store.getAll().filter(e => e.relatedTerms && e.relatedTerms.length > 0);
    const withPerfProfile = this.store.getAll().filter(e => e.perfProfile);
    const withBreaking = this.store.getAll().filter(e => e.breakingChanges && e.breakingChanges.length > 0);

    console.log(`  APIs with CLI flags: ${withFlags.length}`);
    console.log(`  APIs with related terms: ${withRelated.length}`);
    console.log(`  APIs with performance profiles: ${withPerfProfile.length}`);
    console.log(`  APIs with breaking changes: ${withBreaking.length}`);

    // Thuis feature totals
    console.log('\n🏠 Thuis Feature Totals:');
    console.log('-----------------------');
    const thuisApis = this.store.getAll().filter(e => e.thuisConfig || e.homeFeatures);
    console.log(`  Total Thuis APIs: ${thuisApis.length}`);
    console.log(`  With local server: ${thuisApis.filter(e => e.homeFeatures?.localServer).length}`);
    console.log(`  With auto-start: ${thuisApis.filter(e => e.homeFeatures?.autoStart).length}`);
    console.log(`  With tray icon: ${thuisApis.filter(e => e.homeFeatures?.trayIcon).length}`);
    console.log(`  With notifications: ${thuisApis.filter(e => e.homeFeatures?.notifications).length}`);
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
        } else if (arg === '--thuis') {
          options.thuisFeatures = true;
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

    case 'metrics':
      viewer.displayMetrics();
      break;

    case 'patterns':
      viewer.displayPatterns();
      break;

    case 'totals':
      viewer.displayTotals();
      break;

    default:
      console.log(`
📊 Bun Matrix CLI - Tier-1380 Infrastructure

Usage:
  bun-matrix show [options]     Display matrix
  bun-matrix check [version]    Check compatibility
  bun-matrix breaking [version] Show breaking changes
  bun-matrix sync               Update from RSS feeds
  bun-matrix metrics             Show comprehensive metrics
  bun-matrix patterns            Show pattern analysis
  bun-matrix totals              Show totals and aggregates

Options:
  --platform=darwin|linux|win32   Filter by platform
  --stability=stable|experimental|deprecated  Filter by stability
  --category=core|crypto|io|...   Filter by category
  --search=<term>                 Search APIs
  --thuis                        Show only home/thuis features

Examples:
  bun-matrix show --platform=linux --stability=stable
  bun-matrix check 1.3.7
  bun-matrix breaking 1.4.0
  bun-matrix show --search=sqlite
  bun-matrix show --thuis
  bun-matrix metrics
  bun-matrix patterns
      `);
  }
}

// Export for MCP integration
export const matrixViewer = new BunMatrixViewer();
export const matrixStore = matrixViewer['store'];
