import { describe, it, expect, beforeEach, afterEach, mock, spyOn } from 'bun:test';
import { CIDetector } from '../../src/lib/ci-detector';
import { testConfig } from '../../src/lib/test-config';

describe('CI Detection', () => {
  let originalEnv: Record<string, string | undefined>;
  let detector: CIDetector;

  beforeEach(() => {
    // Store original environment
    originalEnv = { ...process.env };
    detector = CIDetector.getInstance();
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('Environment Detection', () => {
    it('should detect local environment', () => {
      // Clear CI variables
      delete process.env.CI;
      delete process.env.GITHUB_ACTIONS;
      delete process.env.GITLAB_CI;

      const ci = detector.detect();

      expect(ci.isCI).toBe(false);
      expect(ci.name).toBe('Local');
      expect(ci.isGitHubActions).toBe(false);
    });

    it('should detect GitHub Actions', () => {
      process.env.GITHUB_ACTIONS = 'true';
      process.env.GITHUB_REF_NAME = 'main';
      process.env.GITHUB_SHA = 'abc123';
      process.env.GITHUB_RUN_NUMBER = '42';

      const ci = detector.detect();

      expect(ci.isCI).toBe(true);
      expect(ci.name).toBe('GitHub Actions');
      expect(ci.isGitHubActions).toBe(true);
      expect(ci.branch).toBe('main');
      expect(ci.commit).toBe('abc123');
      expect(ci.buildNumber).toBe('42');
      expect(ci.annotations.enabled).toBe(true);
      expect(ci.annotations.format).toBe('github');
    });

    it('should detect GitLab CI', () => {
      process.env.GITLAB_CI = 'true';
      process.env.CI_COMMIT_REF_NAME = 'develop';
      process.env.CI_COMMIT_SHA = 'def456';
      process.env.CI_JOB_ID = '123';

      const ci = detector.detect();

      expect(ci.isCI).toBe(true);
      expect(ci.name).toBe('GitLab CI');
      expect(ci.isGitHubActions).toBe(false);
      expect(ci.branch).toBe('develop');
      expect(ci.commit).toBe('def456');
      expect(ci.buildNumber).toBe('123');
    });

    it('should detect generic CI', () => {
      process.env.CI = 'true';

      const ci = detector.detect();

      expect(ci.isCI).toBe(true);
      expect(ci.name).toBe('Unknown CI');
      expect(ci.isGitHubActions).toBe(false);
    });
  });

  describe('Pull Request Detection', () => {
    it('should detect GitHub pull request', () => {
      process.env.GITHUB_ACTIONS = 'true';
      process.env.GITHUB_EVENT_NAME = 'pull_request';

      const ci = detector.detect();

      expect(ci.isPR).toBe(true);
    });

    it('should detect GitLab merge request', () => {
      process.env.GITLAB_CI = 'true';
      process.env.CI_MERGE_REQUEST_ID = '123';

      const ci = detector.detect();

      expect(ci.isPR).toBe(true);
    });

    it('should not detect PR on main branch', () => {
      process.env.GITHUB_ACTIONS = 'true';
      process.env.GITHUB_EVENT_NAME = 'push';
      process.env.GITHUB_REF_NAME = 'main';

      const ci = detector.detect();

      expect(ci.isPR).toBe(false);
    });
  });

  describe('Tag Detection', () => {
    it('should detect GitHub tag', () => {
      process.env.GITHUB_ACTIONS = 'true';
      process.env.GITHUB_REF_TYPE = 'tag';
      process.env.GITHUB_REF_NAME = 'v1.0.0';

      const ci = detector.detect();

      expect(ci.tag).toBe('v1.0.0');
    });

    it('should detect GitLab tag', () => {
      process.env.GITLAB_CI = 'true';
      process.env.CI_COMMIT_TAG = 'v2.0.0';

      const ci = detector.detect();

      expect(ci.tag).toBe('v2.0.0');
    });
  });

  describe('Annotations', () => {
    it('should emit GitHub Actions annotations', () => {
      process.env.GITHUB_ACTIONS = 'true';

      const consoleSpy = mock(() => {});
      const originalLog = console.log;
      console.log = consoleSpy;

      detector.emitAnnotation('error', 'Test failed', {
        file: 'test.ts',
        line: 10,
        title: 'Failure'
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        '::error title=Failure,file=test.ts,line=10::Test failed'
      );

      console.log = originalLog;
    });

    it('should emit generic annotations', () => {
      process.env.CI = 'true';

      const consoleSpy = mock(() => {});
      const originalLog = console.log;
      console.log = consoleSpy;

      detector.emitAnnotation('warning', 'Low coverage', {
        file: 'test.ts'
      });

      expect(consoleSpy).toHaveBeenCalledWith('[WARNING] Low coverage');
      expect(consoleSpy).toHaveBeenCalledWith('  File: test.ts');

      console.log = originalLog;
    });

    it('should handle groups', () => {
      process.env.GITHUB_ACTIONS = 'true';

      const consoleSpy = mock(() => {});
      const originalLog = console.log;
      console.log = consoleSpy;

      detector.startGroup('Test Group');
      detector.endGroup();

      expect(consoleSpy).toHaveBeenCalledWith('::group::Test Group');
      expect(consoleSpy).toHaveBeenCalledWith('::endgroup::');

      console.log = originalLog;
    });
  });
});

describe('Test Configuration', () => {
  let originalEnv: Record<string, string | undefined>;

  beforeEach(() => {
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('CI Configuration', () => {
    it('should use CI-specific timeouts', () => {
      process.env.CI = 'true';

      const config = new (testConfig.constructor as any)();

      expect(config.getTimeout()).toBe(30000);
    });

    it('should use local timeouts', () => {
      delete process.env.CI;

      const config = new (testConfig.constructor as any)();

      expect(config.getTimeout()).toBe(10000);
    });

    it('should enable coverage in CI', () => {
      process.env.CI = 'true';

      expect(testConfig.shouldEnableCoverage()).toBe(true);
    });

    it('should disable coverage locally by default', () => {
      delete process.env.CI;
      delete process.env.COVERAGE;

      expect(testConfig.shouldEnableCoverage()).toBe(false);
    });

    it('should limit concurrency in CI', () => {
      process.env.CI = 'true';

      const config = new (testConfig.constructor as any)();

      expect(config.getConcurrency()).toBe(4);
    });

    it('should use all cores locally', () => {
      delete process.env.CI;

      const config = new (testConfig.constructor as any)();

      expect(config.getConcurrency()).toBe(require('os').cpus().length);
    });
  });

  describe('Environment Configuration', () => {
    it('should configure CI environment variables', () => {
      process.env.CI = 'true';
      process.env.GITHUB_ACTIONS = 'true';

      const config = new (testConfig.constructor as any)();
      config.configureEnvironment();

      expect(process.env.NODE_ENV).toBe('test');
      expect(process.env.CI).toBe('true');
      expect(process.env.BUN_FROZEN_LOCKFILE).toBe('1');
    });

    it('should configure GitHub Actions annotations', () => {
      process.env.GITHUB_ACTIONS = 'true';

      const config = new (testConfig.constructor as any)();
      config.configureEnvironment();

      expect(process.env.BUN_GITHUB_ACTIONS_ANNOTATIONS).toBe('1');
    });
  });
});
