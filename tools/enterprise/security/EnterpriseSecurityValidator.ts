/**
 * Enterprise Security Validator for Archive Operations
 * Tier-1380 Security Framework
 * 
 * @version 2.0.0
 * @author Tier-1380 Security Team
 */

export interface SecurityRule {
  id: string;
  name: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  validate: (path: string, content?: Uint8Array) => SecurityViolation | null;
}

export interface SecurityViolation {
  ruleId: string;
  path: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  recommendation: string;
}

export interface SecurityReport {
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  violations: SecurityViolation[];
  recommendations: string[];
  blockedFiles: string[];
  allowedFiles: string[];
  scanTimestamp: Date;
  scanDurationMs: number;
}

export class EnterpriseSecurityValidator {
  private readonly rules: SecurityRule[] = [];
  private readonly blockedExtensions: Set<string>;
  private readonly suspiciousPatterns: RegExp[];

  constructor() {
    this.blockedExtensions = new Set([
      '.exe', '.bat', '.cmd', '.scr', '.pif', '.com',
      '.vbs', '.js', '.jar', '.app', '.deb', '.rpm',
      '.dmg', '.pkg', '.msi', '.dll', '.so', '.dylib'
    ]);

    this.suspiciousPatterns = [
      /\.\.[\/\\]/,           // Path traversal
      /^[\/\\]/,             // Absolute paths
      /^\./,                  // Hidden files
      /password/i,            // Password references
      /secret/i,              // Secret references
      /private[_\s]key/i,     // Private key patterns
      /api[_\s]key/i,         // API key patterns
      /token/i,               // Token references
      /\.env$/i,               // Environment files
      /config.*\.json$/i,      // Config files
    ];

    this.initializeRules();
  }

  private initializeRules(): void {
    // Path traversal protection
    this.rules.push({
      id: 'SEC001',
      name: 'Path Traversal Protection',
      description: 'Detects attempts to traverse directory structures',
      severity: 'critical',
      validate: (path: string) => {
        if (/\.\.[\/\\]/.test(path)) {
          return {
            ruleId: 'SEC001',
            path,
            severity: 'critical',
            message: 'Path traversal attempt detected',
            recommendation: 'Remove file or validate source integrity'
          };
        }
        return null;
      }
    });

    // Absolute path protection
    this.rules.push({
      id: 'SEC002',
      name: 'Absolute Path Protection',
      description: 'Detects absolute paths that could escape extraction directory',
      severity: 'high',
      validate: (path: string) => {
        if (/^[\/\\]/.test(path)) {
          return {
            ruleId: 'SEC002',
            path,
            severity: 'high',
            message: 'Absolute path detected',
            recommendation: 'Use relative paths or sanitize extraction'
          };
        }
        return null;
      }
    });

    // Hidden file detection
    this.rules.push({
      id: 'SEC003',
      name: 'Hidden File Detection',
      description: 'Detects hidden files that may contain sensitive data',
      severity: 'medium',
      validate: (path: string) => {
        if (/^\./.test(path) && !path.startsWith('./')) {
          return {
            ruleId: 'SEC003',
            path,
            severity: 'medium',
            message: 'Hidden file detected',
            recommendation: 'Review hidden files for sensitive content'
          };
        }
        return null;
      }
    });

    // Executable file detection
    this.rules.push({
      id: 'SEC004',
      name: 'Executable File Detection',
      description: 'Detects executable files that pose security risks',
      severity: 'high',
      validate: (path: string) => {
        const ext = path.split('.').pop()?.toLowerCase();
        if (ext && this.blockedExtensions.has(`.${ext}`)) {
          return {
            ruleId: 'SEC004',
            path,
            severity: 'high',
            message: `Executable file detected: .${ext}`,
            recommendation: 'Remove executable files or validate source'
          };
        }
        return null;
      }
    });

    // Sensitive content detection
    this.rules.push({
      id: 'SEC005',
      name: 'Sensitive Content Detection',
      description: 'Detects files that may contain sensitive information',
      severity: 'medium',
      validate: (path: string, content?: Uint8Array) => {
        const suspiciousPatterns = [
          /password/i,
          /secret/i,
          /private[_\s]key/i,
          /api[_\s]key/i,
          /token/i
        ];

        if (content) {
          const contentStr = new TextDecoder().decode(content);
          for (const pattern of suspiciousPatterns) {
            if (pattern.test(contentStr)) {
              return {
                ruleId: 'SEC005',
                path,
                severity: 'medium',
                message: `Sensitive content pattern detected: ${pattern.source}`,
                recommendation: 'Review file for sensitive data and encrypt if necessary'
              };
            }
          }
        }

        // Check filename patterns
        if (/\.env$/i.test(path) || /config.*\.json$/i.test(path)) {
          return {
            ruleId: 'SEC005',
            path,
            severity: 'medium',
            message: 'Configuration file detected',
            recommendation: 'Review configuration files for sensitive data'
          };
        }

        return null;
      }
    });

    // Large file detection
    this.rules.push({
      id: 'SEC006',
      name: 'Large File Detection',
      description: 'Detects unusually large files that may indicate malicious content',
      severity: 'medium',
      validate: (path: string, content?: Uint8Array) => {
        if (content && content.length > 100 * 1024 * 1024) { // 100MB
          return {
            ruleId: 'SEC006',
            path,
            severity: 'medium',
            message: `Large file detected: ${(content.length / 1024 / 1024).toFixed(1)}MB`,
            recommendation: 'Review large files for legitimacy and necessity'
          };
        }
        return null;
      }
    });

    // Suspicious filename patterns
    this.rules.push({
      id: 'SEC007',
      name: 'Suspicious Filename Detection',
      description: 'Detects suspicious filename patterns',
      severity: 'low',
      validate: (path: string) => {
        const suspiciousNames = [
          /hack/i,
          /exploit/i,
          /malware/i,
          /virus/i,
          /trojan/i,
          /backdoor/i,
          /rootkit/i,
          /keylog/i
        ];

        for (const pattern of suspiciousNames) {
          if (pattern.test(path)) {
            return {
              ruleId: 'SEC007',
              path,
              severity: 'low',
              message: `Suspicious filename pattern: ${pattern.source}`,
              recommendation: 'Review file for malicious content'
            };
          }
        }
        return null;
      }
    });
  }

  /**
   * Perform comprehensive security validation on archive files
   */
  async validateArchive(files: Map<string, Uint8Array>): Promise<SecurityReport> {
    const startTime = performance.now();
    const violations: SecurityViolation[] = [];
    const blockedFiles: string[] = [];
    const allowedFiles: string[] = [];

    console.log(`🔒 Starting security validation on ${files.size} files...`);

    // Validate each file against all rules
    for (const [path, content] of files) {
      let fileBlocked = false;
      let fileViolations: SecurityViolation[] = [];

      for (const rule of this.rules) {
        const violation = rule.validate(path, content);
        if (violation) {
          violations.push(violation);
          fileViolations.push(violation);

          // Block files with critical or high severity violations
          if (violation.severity === 'critical' || violation.severity === 'high') {
            blockedFiles.push(path);
            fileBlocked = true;
          }
        }
      }

      if (!fileBlocked) {
        allowedFiles.push(path);
      }

      // Log progress for large archives
      if (files.size > 100 && violations.length % 10 === 0) {
        console.log(`  Processed ${violations.length} files...`);
      }
    }

    // Calculate overall risk level
    const overallRisk = this.calculateOverallRisk(violations);

    // Generate recommendations
    const recommendations = this.generateRecommendations(violations, overallRisk);

    const scanDuration = performance.now() - startTime;

    const report: SecurityReport = {
      overallRisk,
      violations,
      recommendations,
      blockedFiles,
      allowedFiles,
      scanTimestamp: new Date(),
      scanDurationMs: scanDuration
    };

    console.log(`🔍 Security validation complete in ${scanDuration.toFixed(2)}ms`);
    console.log(`📊 Risk level: ${overallRisk.toUpperCase()}`);
    console.log(`🚫 Blocked files: ${blockedFiles.length}`);
    console.log(`✅ Allowed files: ${allowedFiles.length}`);

    return report;
  }

  /**
   * Quick validation for individual files
   */
  validateFile(path: string, content?: Uint8Array): SecurityViolation | null {
    for (const rule of this.rules) {
      const violation = rule.validate(path, content);
      if (violation) {
        return violation;
      }
    }
    return null;
  }

  /**
   * Add custom security rule
   */
  addRule(rule: SecurityRule): void {
    this.rules.push(rule);
  }

  /**
   * Remove security rule by ID
   */
  removeRule(ruleId: string): boolean {
    const index = this.rules.findIndex(rule => rule.id === ruleId);
    if (index > -1) {
      this.rules.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Get all security rules
   */
  getRules(): SecurityRule[] {
    return [...this.rules];
  }

  /**
   * Generate security summary report
   */
  generateSummaryReport(report: SecurityReport): string {
    let summary = `# Security Validation Report\n\n`;
    summary += `**Scan Time**: ${report.scanTimestamp.toISOString()}\n`;
    summary += `**Duration**: ${report.scanDurationMs.toFixed(2)}ms\n`;
    summary += `**Overall Risk**: ${report.overallRisk.toUpperCase()}\n`;
    summary += `**Total Files**: ${report.blockedFiles.length + report.allowedFiles.length}\n`;
    summary += `**Blocked Files**: ${report.blockedFiles.length}\n`;
    summary += `**Allowed Files**: ${report.allowedFiles.length}\n\n`;

    if (report.violations.length > 0) {
      summary += `## Security Violations\n\n`;
      
      // Group violations by severity
      const violationsBySeverity = report.violations.reduce((acc, violation) => {
        if (!acc[violation.severity]) {
          acc[violation.severity] = [];
        }
        acc[violation.severity].push(violation);
        return acc;
      }, {} as Record<string, SecurityViolation[]>);

      for (const severity of ['critical', 'high', 'medium', 'low']) {
        const violations = violationsBySeverity[severity];
        if (violations && violations.length > 0) {
          summary += `### ${severity.toUpperCase()} (${violations.length})\n\n`;
          for (const violation of violations) {
            summary += `- **${violation.path}**: ${violation.message}\n`;
            summary += `  - Rule: ${violation.ruleId}\n`;
            summary += `  - Recommendation: ${violation.recommendation}\n\n`;
          }
        }
      }
    }

    if (report.recommendations.length > 0) {
      summary += `## Recommendations\n\n`;
      for (const recommendation of report.recommendations) {
        summary += `- ${recommendation}\n`;
      }
      summary += `\n`;
    }

    if (report.blockedFiles.length > 0) {
      summary += `## Blocked Files\n\n`;
      for (const file of report.blockedFiles) {
        summary += `- ${file}\n`;
      }
      summary += `\n`;
    }

    return summary;
  }

  // ─── Private Helper Methods ────────────────────────────────────────────────────
  private calculateOverallRisk(violations: SecurityViolation[]): 'low' | 'medium' | 'high' | 'critical' {
    if (violations.length === 0) return 'low';

    const criticalCount = violations.filter(v => v.severity === 'critical').length;
    const highCount = violations.filter(v => v.severity === 'high').length;
    const mediumCount = violations.filter(v => v.severity === 'medium').length;

    if (criticalCount > 0) return 'critical';
    if (highCount > 2) return 'critical';
    if (highCount > 0 || mediumCount > 5) return 'high';
    if (mediumCount > 0) return 'medium';
    return 'low';
  }

  private generateRecommendations(violations: SecurityViolation[], overallRisk: string): string[] {
    const recommendations: string[] = [];

    if (overallRisk === 'critical') {
      recommendations.push('🚨 CRITICAL: Do not extract this archive without manual review');
      recommendations.push('Quarantine the archive and perform thorough security analysis');
      recommendations.push('Consider scanning with additional security tools');
    }

    if (overallRisk === 'high') {
      recommendations.push('⚠️ HIGH RISK: Exercise extreme caution with this archive');
      recommendations.push('Extract in a sandboxed environment only');
      recommendations.push('Review all blocked files before proceeding');
    }

    if (overallRisk === 'medium') {
      recommendations.push('🔍 MEDIUM RISK: Review violations before extraction');
      recommendations.push('Consider removing suspicious files');
    }

    // Specific recommendations based on violation types
    const ruleTypes = new Set(violations.map(v => v.ruleId));
    
    if (ruleTypes.has('SEC001')) {
      recommendations.push('Path traversal attempts detected - validate archive source');
    }
    
    if (ruleTypes.has('SEC004')) {
      recommendations.push('Executable files detected - scan for malware');
    }
    
    if (ruleTypes.has('SEC005')) {
      recommendations.push('Sensitive content detected - review and encrypt if necessary');
    }

    if (recommendations.length === 0) {
      recommendations.push('✅ No significant security concerns detected');
    }

    return recommendations;
  }
}

// ─── Export singleton instance ───────────────────────────────────────────────────
export const securityValidator = new EnterpriseSecurityValidator();
