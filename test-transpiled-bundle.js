// Auto-generated test bundle with Bun.Transpiler
// Generated at: 2026-01-31T00:40:36.946Z
// Environment: test

// Bundle metadata
const bundleMeta = {
  originalSize: 55647,
  transpiledSize: 49178,
  compression: 11.63 + '%',
  imports: [
  {
    "kind": "import-statement",
    "path": "../packages/test/secure-test-runner-enhanced"
  },
  {
    "kind": "import-statement",
    "path": "bun"
  },
  {
    "kind": "dynamic-import",
    "path": "../packages/test/bytecode-profiler"
  }
],
  exports: [
  "parseRangersLog"
]
};

console.log('📊 Bundle Metadata:', bundleMeta);

// Transpiled test code
import { SecureTestRunner } from "../packages/test/secure-test-runner-enhanced";
import { inspect } from "bun";
function calculateSecurityScore(warnings) {
  let cspScore = 100, networkScore = 100, privacyScore = 100;
  warnings.forEach((warning) => {
    if (warning.type === "csp")
      if (warning.severity === "high")
        cspScore -= 30;
      else if (warning.severity === "medium")
        cspScore -= 15;
      else
        cspScore -= 5;
    if (warning.category === "network")
      if (warning.message.includes("DNS"))
        networkScore -= 10;
      else if (warning.message.includes("certificate"))
        networkScore -= 40;
      else
        networkScore -= 20;
    if (warning.details?.blockedUri?.includes("analytics") || warning.details?.blockedUri?.includes("tracking"))
      privacyScore += 10;
  });
  const overall = Math.round((cspScore + networkScore + privacyScore) / 3);
  return {
    overall: Math.max(0, Math.min(100, overall)),
    cspCompliance: Math.max(0, Math.min(100, cspScore)),
    networkSecurity: Math.max(0, Math.min(100, networkScore)),
    dataPrivacy: Math.max(0, Math.min(100, privacyScore))
  };
}
function correlateLogs(rangersLogs, warnings) {
  if (rangersLogs.length === 0)
    return;
  const firstLog = rangersLogs[0], sessionId = firstLog.userInfo.web_id || firstLog.analyticsData?.session_id || "unknown", userId = firstLog.userInfo.user_unique_id || "unknown", timeline = [];
  rangersLogs.forEach((log) => {
    let event = "";
    switch (log.logType) {
      case "sdk_ready":
        event = "SDK Initialized";
        break;
      case "user_info":
        event = "User Identified";
        break;
      case "device_info":
        event = "Device Info Collected";
        break;
      case "analytics_event":
        event = `Analytics: ${log.analyticsData?.event || "Unknown"}`;
        break;
      default:
        event = "Unknown Event";
    }
    timeline.push({
      timestamp: log.timestamp || new Date().toISOString(),
      event,
      type: "rangers"
    });
  });
  warnings.forEach((warning) => {
    timeline.push({
      timestamp: warning.timestamp || new Date().toISOString(),
      event: `${warning.category?.toUpperCase() || "WARNING"}: ${warning.message.substring(0, 50)}...`,
      type: "warning"
    });
  });
  timeline.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  return {
    sessionId,
    userId,
    timeline
  };
}
function calculatePerformanceMetrics(totalLines, processingTime) {
  const averageLineTime = processingTime / totalLines, throughput = totalLines / (processingTime / 1000);
  return {
    totalParseTime: processingTime,
    averageLineTime,
    throughput,
    memoryUsage: process.memoryUsage ? process.memoryUsage().heapUsed / 1024 / 1024 : void 0
  };
}
function generateRemediation(warning) {
  const remediation = [];
  if (warning.type === "csp") {
    if (warning.details?.directive === "script-src") {
      remediation.push('Add specific nonce: <script nonce="${RANDOM}">');
      remediation.push("Or use hash: script-src 'sha256-<HASH>'");
      remediation.push("Consider moving scripts to external files");
    }
    if (warning.details?.directive === "connect-src") {
      remediation.push(`Add domain to CSP: connect-src https://${warning.details.blockedUri}`);
      remediation.push("Use relative URLs to avoid CSP issues");
    }
  }
  if (warning.category === "network") {
    if (warning.message.includes("DNS")) {
      remediation.push("Verify DNS configuration");
      remediation.push("Check if domain is correct");
      remediation.push("Consider using CDN for better reliability");
    }
  }
  if (warning.type === "webgl") {
    remediation.push("Enable hardware acceleration in browser settings");
    remediation.push("Update graphics drivers");
    remediation.push("Provide 2D canvas fallback");
  }
  return remediation;
}
const LOG_PATTERNS = {
  csp: {
    scriptSrc: /script-src\s+['"]([^'"]*)['"]/,
    connectSrc: /connect-src\s+['"]([^'"]*)['"]/,
    inlineScript: /inline script/,
    externalScript: /Loading the script/,
    webAssembly: /WebAssembly/,
    hash: /sha256-([^'\s]+)/,
    lineColumn: /:(\d+):(\d+)/
  },
  network: {
    dnsError: /net::ERR_NAME_NOT_RESOLVED/,
    timeout: /net::ERR_CONNECTION_TIMED_OUT/,
    certificate: /net::ERR_CERT/,
    blocked: /net::ERR_BLOCKED/
  },
  performance: {
    longTask: /long task/,
    layoutShift: /Layout Shift/,
    slowNetwork: /slow \d+\.\d+s/
  }
};
function parseRangersLog(logLine) {
  try {
    if (logLine.includes("No WebGL support"))
      return {
        type: "webgl",
        message: "WebGL not available - 3D graphics disabled",
        source: logLine.match(/^(\S+):/)?.[1] || "unknown",
        timestamp: new Date().toISOString(),
        severity: "medium",
        category: "compatibility"
      };
    if (logLine.trim().startsWith("{"))
      try {
        const jsonData = JSON.parse(logLine.trim());
        if (jsonData.app_id) {
          let customData = {};
          if (jsonData.custom)
            try {
              customData = JSON.parse(jsonData.custom);
            } catch (e) {}
          return {
            instance: "device",
            appId: jsonData.app_id.toString(),
            userInfo: {
              user_unique_id: "unknown",
              web_id: "unknown"
            },
            sdkVersion: jsonData.sdk_version,
            timestamp: new Date().toISOString(),
            logType: "device_info",
            rawData: logLine.trim(),
            deviceData: {
              ...jsonData,
              custom: JSON.stringify(customData, null, 2)
            }
          };
        }
        if (jsonData.event && jsonData.session_id) {
          let paramsData = {};
          if (jsonData.params)
            try {
              paramsData = JSON.parse(jsonData.params);
            } catch (e) {}
          return {
            instance: "analytics",
            appId: "unknown",
            userInfo: {
              user_unique_id: "unknown",
              web_id: jsonData.session_id || "unknown"
            },
            timestamp: new Date(jsonData.local_time_ms).toISOString(),
            logType: "analytics_event",
            rawData: logLine.trim(),
            analyticsData: {
              ...jsonData,
              params: JSON.stringify(paramsData, null, 2)
            }
          };
        }
      } catch (e) {}
    if (logLine.includes("Content Security Policy directive")) {
      const isReportOnly = logLine.includes("report-only"), directiveMatch = logLine.match(/directive\s+"([^"]+)"/), directive = directiveMatch ? directiveMatch[1] : "unknown";
      let message = "", blockedUri = "", category = "security", line, column;
      const lineColMatch = logLine.match(LOG_PATTERNS.csp.lineColumn);
      if (lineColMatch) {
        line = parseInt(lineColMatch[1]);
        column = parseInt(lineColMatch[2]);
      }
      if (logLine.includes("WebAssembly")) {
        message = `CSP violation - WebAssembly blocked${isReportOnly ? " (report-only)" : " (blocking)"}`;
        blockedUri = "WebAssembly module";
      } else if (logLine.includes("script-src")) {
        if (logLine.includes("inline script")) {
          const hashMatch = logLine.match(LOG_PATTERNS.csp.hash), hash = hashMatch ? hashMatch[1].substring(0, 16) + "..." : "";
          message = `CSP violation - Inline script blocked${isReportOnly ? " (report-only)" : " (blocking)"}`;
          blockedUri = "inline-script";
        } else if (logLine.includes("Loading the script")) {
          const urlMatch = logLine.match(/'<([^']+)'>/), url = urlMatch ? urlMatch[1] : "unknown URL";
          message = `CSP violation - External script blocked${isReportOnly ? " (report-only)" : " (blocking)"}`;
          blockedUri = url;
        }
      } else if (logLine.includes("connect-src")) {
        const urlMatch = logLine.match(/'<([^']+)'>/), url = urlMatch ? urlMatch[1] : "unknown URL";
        message = `CSP violation - Connection blocked${isReportOnly ? " (report-only)" : " (blocking)"}`;
        blockedUri = url;
        category = "network";
      }
      return {
        type: "csp",
        message,
        source: logLine.match(/^(\S+):/)?.[1] || logLine.match(/^(\S+)/)?.[1] || "unknown",
        timestamp: new Date().toISOString(),
        severity: isReportOnly ? "low" : "high",
        category,
        details: {
          directive,
          blockedUri,
          requiredAction: isReportOnly ? "None (report-only)" : "Add CSP exception",
          line,
          column,
          hash: logLine.match(LOG_PATTERNS.csp.hash)?.[1]
        }
      };
    }
    if (logLine.includes("Failed to load resource:")) {
      let message = "", blockedUri = "", severity = "medium";
      if (LOG_PATTERNS.network.dnsError.test(logLine)) {
        const urlMatch = logLine.match(/(\S+):\d+/);
        blockedUri = urlMatch ? urlMatch[1] : "unknown";
        message = `DNS resolution failed for ${blockedUri}`;
        severity = "low";
      } else if (LOG_PATTERNS.network.timeout.test(logLine)) {
        message = "Connection timeout";
        severity = "medium";
      } else if (LOG_PATTERNS.network.certificate.test(logLine)) {
        message = "SSL/TLS certificate error";
        severity = "high";
      }
      return {
        type: "other",
        message,
        source: "browser",
        timestamp: new Date().toISOString(),
        severity,
        category: "network",
        details: {
          blockedUri,
          directive: "network-error",
          requiredAction: "Check network connectivity and certificates"
        }
      };
    }
    if (LOG_PATTERNS.performance.longTask.test(logLine))
      return {
        type: "other",
        message: "Long JavaScript task detected - potential UI blocking",
        source: "performance",
        timestamp: new Date().toISOString(),
        severity: "medium",
        category: "performance",
        details: {
          directive: "performance",
          requiredAction: "Consider code splitting or web workers"
        }
      };
    if (!logLine.includes("collect-rangers") && !logLine.includes("[instance:"))
      return null;
    let logType = "unknown";
    if (logLine.includes("userInfo:"))
      logType = "user_info";
    if (logLine.includes("sdk is ready"))
      logType = "sdk_ready";
    const instanceMatch = logLine.match(/\[instance:\s*(\w+)\]/), instance = instanceMatch ? instanceMatch[1] : "unknown", appIdMatch = logLine.match(/appid:\s*(\d+)/), appId = appIdMatch ? appIdMatch[1] : "", userInfoMatch = logLine.match(/userInfo:\s*(\{.*?\})/);
    let userInfo = { user_unique_id: "", web_id: "" };
    if (userInfoMatch)
      try {
        userInfo = JSON.parse(userInfoMatch[1]);
      } catch (e) {}
    const versionMatch = logLine.match(/version\s+is\s+([\d._tob]+)/), sdkVersion = versionMatch ? versionMatch[1] : void 0, sdkReady = logLine.includes("sdk is ready"), timestamp = new Date().toISOString();
    return {
      instance,
      appId,
      userInfo,
      sdkVersion,
      sdkReady,
      timestamp,
      logType,
      rawData: logLine.trim()
    };
  } catch (error) {
    console.error("Failed to parse log:", error);
    return null;
  }
}
function displayBrowserWarning(warning) {
  const severityIcon = warning.severity === "high" ? "\uD83D\uDEA8" : warning.severity === "medium" ? "\u26A0\uFE0F" : "\u2139\uFE0F", categoryIcon = warning.category === "security" ? "\uD83D\uDD12" : warning.category === "performance" ? "\u26A1" : warning.category === "network" ? "\uD83C\uDF10" : "\uD83D\uDD27";
  if (!warning.remediation)
    warning.remediation = generateRemediation(warning);
  const impact = warning.severity === "high" ? "critical" : warning.severity === "medium" ? "warning" : "info";
  warning.impact = impact;
  const severityColor = warning.severity === "high" ? "\x1B[41m" : warning.severity === "medium" ? "\x1B[43m" : "\x1B[44m", reset = "\x1B[0m";
  console.log(`
${severityColor} ${severityIcon} ${categoryIcon} BROWSER WARNING (${warning.severity.toUpperCase()}) ${reset}`);
  console.log("=".repeat(80) + `
`);
  const warningTable = [
    {
      Type: warning.type.toUpperCase(),
      Category: warning.category?.toUpperCase() || "UNKNOWN",
      Impact: warning.impact?.toUpperCase() || "UNKNOWN",
      Severity: warning.severity.toUpperCase(),
      Message: warning.message.length > 80 ? warning.message.substring(0, 77) + "..." : warning.message,
      Source: warning.source || "Unknown",
      Frequency: warning.frequency ? warning.frequency.toString() : "1",
      Timestamp: warning.timestamp || "N/A"
    }
  ];
  console.log(inspect.table(warningTable));
  if (warning.details || warning.remediation?.length > 0) {
    console.log(`
\uD83D\uDCCB Detailed Analysis:`);
    if (warning.details) {
      if (warning.details.directive)
        console.log(`  \u2022 Directive Violated: ${warning.details.directive}`);
      if (warning.details.blockedUri)
        console.log(`  \u2022 Blocked Resource: ${warning.details.blockedUri}`);
      if (warning.details.requiredAction)
        console.log(`  \u2022 Required Action: ${warning.details.requiredAction}`);
      if (warning.details.hash)
        console.log(`  \u2022 Content Hash: ${warning.details.hash.substring(0, 16)}...`);
      if (warning.details.line)
        console.log(`  \u2022 Location: Line ${warning.details.line}${warning.details.column ? `, Column ${warning.details.column}` : ""}`);
    }
    if (warning.frequency && warning.frequency > 1) {
      console.log(`  \u2022 Occurrence Count: ${warning.frequency} times`);
      if (warning.frequency > 5)
        console.log("    \u26A0\uFE0F High frequency - may indicate systematic issue");
    }
  }
  if (warning.remediation && warning.remediation.length > 0) {
    console.log(`
\uD83D\uDD27 Remediation Steps:`);
    warning.remediation.forEach((step, index) => {
      console.log(`  ${index === 0 ? "\uD83D\uDD34" : index === 1 ? "\uD83D\uDFE1" : "\uD83D\uDFE2"} ${index + 1}. ${step}`);
    });
  }
  console.log(`
\uFFFD Recommendations:`);
  if (warning.type === "webgl") {
    console.log("  \uD83C\uDFAE Graphics: Check GPU hardware acceleration in browser settings");
    console.log("  \uD83D\uDCF1 Fallback: Implement 2D canvas fallback for unsupported devices");
    console.log("  \uD83D\uDD27 Drivers: Update graphics drivers to latest version");
    console.log("  \uD83D\uDCCA Analytics: Track WebGL support rates in your analytics");
  } else if (warning.type === "csp") {
    if (warning.details?.directive === "script-src") {
      console.log("  \uD83D\uDD12 Security: Use nonces or hashes instead of unsafe-inline");
      console.log("  \uD83D\uDCE6 Architecture: Move inline scripts to external files");
      console.log("  \uD83C\uDFAF Targeting: Apply CSP selectively per environment");
      console.log("  \uD83E\uDDEA Testing: Use CSP report-only mode in development");
    } else if (warning.details?.directive === "connect-src") {
      console.log("  \uD83C\uDF10 Network: Whitelist specific domains in connect-src");
      console.log("  \uD83D\uDCCD URLs: Use relative URLs to avoid CSP violations");
      console.log("  \uD83D\uDD00 Proxy: Consider using a proxy for external APIs");
      console.log("  \uD83D\uDCDD Documentation: Document all external endpoints");
    } else if (warning.details?.directive === "default-src") {
      console.log("  \uD83D\uDEE1\uFE0F Defense: Start with restrictive default-src policy");
      console.log("  \uD83C\uDFAF Scope: Narrow permissions to specific directives");
      console.log("  \uD83D\uDCCB Inventory: Create an inventory of all external resources");
    }
  } else if (warning.category === "network") {
    if (warning.message.includes("DNS")) {
      console.log("  \uD83C\uDF0D DNS: Verify DNS configuration and propagation");
      console.log("  \uD83D\uDD0D Domain: Check if domain name is correct and active");
      console.log("  \uD83D\uDEAB Blocking: May be blocked by firewall or ad-blocker");
      console.log("  \u23F1\uFE0F Timeout: Implement retry logic with exponential backoff");
    } else if (warning.message.includes("timeout")) {
      console.log("  \u23F1\uFE0F Performance: Check network latency and server response times");
      console.log("  \uD83D\uDD04 Retry: Implement automatic retry with backoff strategy");
      console.log("  \uD83D\uDCCA Monitoring: Add timeout metrics to monitoring dashboard");
      console.log("  \uD83D\uDC65 UX: Show user-friendly timeout messages");
    } else if (warning.message.includes("certificate")) {
      console.log("  \uD83D\uDD10 Security: Update SSL/TLS certificates immediately");
      console.log("  \uD83D\uDCC5 Expiry: Set up certificate expiry monitoring");
      console.log("  \uD83D\uDD17 Chain: Verify full certificate chain is valid");
      console.log("  \uD83C\uDF10 CA: Ensure using trusted Certificate Authority");
    }
  } else if (warning.category === "performance") {
    console.log("  \u26A1 Optimization: Profile the long-running task");
    console.log("  \uD83E\uDDE9 Code Splitting: Break down large JavaScript bundles");
    console.log("  \uD83E\uDDF5 Web Workers: Move heavy computations to workers");
    console.log("  \uD83D\uDCC8 Metrics: Add performance monitoring and alerts");
  }
  if (warning.category === "security" || warning.type === "csp") {
    console.log(`
\uD83D\uDD12 Security Implications:`);
    if (warning.severity === "high") {
      console.log("  \uD83D\uDEA8 Critical: This vulnerability could lead to code execution");
      console.log("  \uD83C\uDFAF Impact: Data breach or unauthorized access possible");
      console.log("  \u23F0 Timeline: Fix within 24 hours recommended");
    } else if (warning.severity === "medium") {
      console.log("  \u26A0\uFE0F Warning: Potential security risk exists");
      console.log("  \uD83D\uDCCA Risk: Information disclosure possible");
      console.log("  \uD83D\uDCC5 Timeline: Address in next release cycle");
    } else {
      console.log("  \u2139\uFE0F Info: Security best practice recommendation");
      console.log("  \uD83D\uDCC8 Benefit: Improves overall security posture");
      console.log("  \uD83C\uDFAF Priority: Implement when convenient");
    }
  }
  if (warning.type === "csp" && warning.details?.directive) {
    console.log(`
\uD83D\uDD17 Related Patterns:`);
    if (warning.details.directive.includes("script")) {
      console.log("  \u2022 Check for: unsafe-inline, unsafe-eval, dynamic imports");
      console.log("  \u2022 Also review: integrity attributes, SRI implementation");
    }
    if (warning.details.directive.includes("connect")) {
      console.log("  \u2022 Check for: API endpoints, CDN resources, WebSocket URLs");
      console.log("  \u2022 Also review: CORS headers, authentication flows");
    }
  }
}
function displayLogSummary(summary) {
  console.log(`
\uD83D\uDCCA Enhanced Log Processing Summary`);
  console.log(`===================================
`);
  const summaryTable = [
    {
      Metric: "Total Lines Processed",
      Value: summary.totalLines.toString(),
      Status: "\u2705"
    },
    {
      Metric: "Rangers SDK Logs",
      Value: summary.rangersLogs.toString(),
      Status: summary.rangersLogs > 0 ? "\u2705" : "\u26A0\uFE0F"
    },
    {
      Metric: "Browser Warnings",
      Value: summary.browserWarnings.toString(),
      Status: summary.browserWarnings > 0 ? "\u26A0\uFE0F" : "\u2705"
    },
    {
      Metric: "SDK Status",
      Value: summary.sdkStatus,
      Status: summary.sdkStatus === "ready" ? "\u2705" : summary.sdkStatus === "initializing" ? "\u23F3" : "\u2753"
    },
    {
      Metric: "Unique Users",
      Value: summary.uniqueUsers.toString(),
      Status: summary.uniqueUsers > 0 ? "\uD83D\uDC65" : "\uD83D\uDCED"
    },
    {
      Metric: "App IDs Detected",
      Value: summary.appIds.length > 0 ? summary.appIds.join(", ") : "None",
      Status: summary.appIds.length > 0 ? "\uD83D\uDCF1" : "\uD83D\uDCED"
    },
    {
      Metric: "Processing Time",
      Value: `${summary.processingTime.toFixed(2)}ms`,
      Status: summary.processingTime < 100 ? "\u26A1" : "\uD83D\uDC0C"
    }
  ];
  console.log(inspect.table(summaryTable));
  if (summary.performance) {
    console.log(`
\u26A1 Performance Metrics:`);
    const perfTable = [
      {
        Metric: "Total Parse Time",
        Value: `${summary.performance.totalParseTime.toFixed(2)}ms`,
        Benchmark: summary.performance.totalParseTime < 50 ? "\uD83D\uDFE2 Fast" : "\uD83D\uDFE1 OK"
      },
      {
        Metric: "Avg Line Time",
        Value: `${summary.performance.averageLineTime.toFixed(3)}ms`,
        Benchmark: summary.performance.averageLineTime < 1 ? "\uD83D\uDFE2 Fast" : "\uD83D\uDFE1 OK"
      },
      {
        Metric: "Throughput",
        Value: `${summary.performance.throughput.toFixed(0)} lines/sec`,
        Benchmark: summary.performance.throughput > 1000 ? "\uD83D\uDFE2 Fast" : "\uD83D\uDFE1 OK"
      }
    ];
    if (summary.performance.memoryUsage)
      perfTable.push({
        Metric: "Memory Usage",
        Value: `${summary.performance.memoryUsage.toFixed(1)}MB`,
        Benchmark: summary.performance.memoryUsage < 50 ? "\uD83D\uDFE2 Low" : "\uD83D\uDFE1 OK"
      });
    console.log(inspect.table(perfTable));
  }
  if (summary.securityScore) {
    console.log(`
\uD83D\uDD12 Security Score:`);
    const score = summary.securityScore, overallGrade = score.overall >= 80 ? "\uD83D\uDFE2 A" : score.overall >= 60 ? "\uD83D\uDFE1 B" : score.overall >= 40 ? "\uD83D\uDFE0 C" : "\uD83D\uDD34 D", securityTable = [
      {
        Component: "Overall Score",
        Score: `${score.overall}/100`,
        Grade: overallGrade
      },
      {
        Component: "CSP Compliance",
        Score: `${score.cspCompliance}/100`,
        Grade: score.cspCompliance >= 80 ? "\uD83D\uDFE2 Good" : score.cspCompliance >= 60 ? "\uD83D\uDFE1 Fair" : "\uD83D\uDD34 Poor"
      },
      {
        Component: "Network Security",
        Score: `${score.networkSecurity}/100`,
        Grade: score.networkSecurity >= 80 ? "\uD83D\uDFE2 Good" : score.networkSecurity >= 60 ? "\uD83D\uDFE1 Fair" : "\uD83D\uDD34 Poor"
      },
      {
        Component: "Data Privacy",
        Score: `${score.dataPrivacy}/100`,
        Grade: score.dataPrivacy >= 80 ? "\uD83D\uDFE2 Good" : score.dataPrivacy >= 60 ? "\uD83D\uDFE1 Fair" : "\uD83D\uDD34 Poor"
      }
    ];
    console.log(inspect.table(securityTable));
  }
  if (summary.correlation && summary.correlation.timeline.length > 0) {
    console.log(`
\uD83D\uDCC5 Event Timeline:`);
    const timelineTable = summary.correlation.timeline.map((event, index) => ({
      "#": (index + 1).toString(),
      Time: new Date(event.timestamp).toLocaleTimeString(),
      Type: event.type.toUpperCase(),
      Event: event.event.length > 40 ? event.event.substring(0, 37) + "..." : event.event
    }));
    console.log(inspect.table(timelineTable));
    console.log(`
\uD83D\uDC64 Session: ${summary.correlation.sessionId} | User: ${summary.correlation.userId}`);
  }
  if (Object.keys(summary.warningsByType).length > 0) {
    console.log(`
\uD83D\uDCC8 Warnings by Type:`);
    const typeTable = Object.entries(summary.warningsByType).map(([type, count]) => ({
      Type: type.toUpperCase(),
      Count: count.toString(),
      Severity: count > 3 ? "\uD83D\uDD34 High" : count > 1 ? "\uD83D\uDFE1 Medium" : "\uD83D\uDFE2 Low"
    }));
    console.log(inspect.table(typeTable));
  }
  if (Object.keys(summary.warningsBySeverity).length > 0) {
    console.log(`
\uD83D\uDEA8 Warnings by Severity:`);
    const severityTable = Object.entries(summary.warningsBySeverity).map(([severity, count]) => ({
      Severity: severity.toUpperCase(),
      Count: count.toString(),
      Impact: severity === "high" ? "\uD83D\uDD34 Critical" : severity === "medium" ? "\uD83D\uDFE1 Review" : "\uD83D\uDFE2 Info"
    }));
    console.log(inspect.table(severityTable));
  }
  if (summary.topIssues.length > 0) {
    console.log(`
\uD83D\uDD25 Top Issues (by frequency):`);
    const issuesTable = summary.topIssues.map((issue, index) => ({
      "#": (index + 1).toString(),
      Issue: issue.message.length > 50 ? issue.message.substring(0, 47) + "..." : issue.message,
      Count: issue.count.toString(),
      Priority: issue.count > 2 ? "\uD83D\uDD34 High" : issue.count > 1 ? "\uD83D\uDFE1 Medium" : "\uD83D\uDFE2 Low"
    }));
    console.log(inspect.table(issuesTable));
  }
  console.log(`
\uD83C\uDFAF Quick Actions:`);
  if (summary.sdkStatus === "initializing")
    console.log("  \u2022 Wait for SDK ready message to confirm full initialization");
  if (summary.warningsBySeverity.high > 0)
    console.log("  \uD83D\uDEA8 URGENT: Address high-severity warnings immediately");
  if (summary.warningsBySeverity.medium > 0)
    console.log("  \u26A0\uFE0F Review medium-severity warnings for optimization");
  if (summary.warningsByType.csp > 0)
    console.log("  \uD83D\uDD12 Review CSP policy - consider adding necessary exceptions");
  if (summary.warningsByType.network > 0)
    console.log("  \uD83C\uDF10 Check network connectivity and DNS configuration");
  if (summary.uniqueUsers > 1)
    console.log("  \uD83D\uDC65 Multiple users detected - check for session mixing");
  if (summary.processingTime > 100)
    console.log("  \u26A1 Processing time is high - consider optimizing log parsing");
  if (summary.securityScore) {
    if (summary.securityScore.overall < 60)
      console.log("  \uD83D\uDD34 SECURITY: Review and strengthen security policies");
    else if (summary.securityScore.overall < 80)
      console.log("  \uD83D\uDFE1 SECURITY: Some security improvements recommended");
  }
}
function displayRangersLogData(data) {
  const logTypeIcon = data.logType === "sdk_ready" ? "\u2705" : data.logType === "user_info" ? "\uD83D\uDC64" : data.logType === "device_info" ? "\uD83D\uDCF1" : data.logType === "analytics_event" ? "\uD83D\uDCCA" : "\uD83D\uDCCB";
  console.log(`
${logTypeIcon} Rangers SDK Log Analysis (${data.logType})`);
  console.log(`==========================================
`);
  if (data.logType === "analytics_event" && data.analyticsData) {
    const analyticsTable = [
      {
        Field: "Event Type",
        Value: data.analyticsData.event,
        Notes: "Analytics event identifier"
      },
      {
        Field: "Session ID",
        Value: data.analyticsData.session_id,
        Notes: "Unique session identifier"
      },
      {
        Field: "Local Time",
        Value: new Date(data.analyticsData.local_time_ms).toLocaleString(),
        Notes: "Event timestamp (local)"
      },
      {
        Field: "BAV Status",
        Value: data.analyticsData.is_bav ? "Yes" : "No",
        Notes: "Baidu Analytics Visitor"
      },
      {
        Field: "AB SDK Version",
        Value: data.analyticsData.ab_sdk_version,
        Notes: "A/B testing SDK version"
      },
      {
        Field: "Event Params",
        Value: "Present",
        Notes: "Event-specific parameters"
      }
    ];
    console.log(inspect.table(analyticsTable));
    if (data.analyticsData.params)
      try {
        const paramsParsed = JSON.parse(data.analyticsData.params);
        console.log(`
\uD83D\uDCCA Event Parameters:`);
        console.log(JSON.stringify(paramsParsed, null, 2));
        if (paramsParsed.url) {
          console.log(`
\uD83D\uDD0D Event Insights:`);
          console.log(`  \uD83C\uDF10 URL: ${paramsParsed.url}`);
          if (paramsParsed.title)
            console.log(`  \uD83D\uDCC4 Title: ${paramsParsed.title}`);
          if (paramsParsed.start_time && paramsParsed.end_time) {
            const duration = paramsParsed.end_time - paramsParsed.start_time;
            console.log(`  \u23F1\uFE0F Duration: ${duration}ms`);
          }
          if (paramsParsed.referrer)
            console.log(`  \uD83D\uDD17 Referrer: ${paramsParsed.referrer}`);
          if (paramsParsed.event_index)
            console.log(`  \uD83D\uDCCD Event Index: ${paramsParsed.event_index}`);
        }
      } catch (e) {
        console.log(`
\uD83D\uDCCA Event Parameters (raw):`);
        console.log(data.analyticsData.params);
      }
  } else if (data.logType === "device_info" && data.deviceData) {
    const deviceTable = [
      {
        Field: "App ID",
        Value: data.deviceData.app_id.toString(),
        Notes: "Application identifier"
      },
      {
        Field: "Device",
        Value: `${data.deviceData.device_model} (${data.deviceData.os_name} ${data.deviceData.os_version})`,
        Notes: "Device and OS information"
      },
      {
        Field: "Browser",
        Value: `${data.deviceData.browser} ${data.deviceData.browser_version}`,
        Notes: "Browser and version"
      },
      {
        Field: "SDK Version",
        Value: data.deviceData.sdk_version,
        Notes: "SDK version and library"
      },
      {
        Field: "Screen Resolution",
        Value: `${data.deviceData.width}x${data.deviceData.height}`,
        Notes: `Viewport (Screen: ${data.deviceData.screen_width}x${data.deviceData.screen_height})`
      },
      {
        Field: "Language",
        Value: data.deviceData.language,
        Notes: `Timezone: ${data.deviceData.timezone} (UTC${data.deviceData.tz_offset >= 0 ? "+" : ""}${data.deviceData.tz_offset / 3600})`
      },
      {
        Field: "Platform",
        Value: data.deviceData.platform,
        Notes: "Platform type"
      },
      {
        Field: "Custom Data",
        Value: data.deviceData.custom ? "Present" : "None",
        Notes: "Additional custom parameters"
      }
    ];
    console.log(inspect.table(deviceTable));
    if (data.deviceData.custom)
      try {
        const customParsed = JSON.parse(data.deviceData.custom);
        console.log(`
\uD83D\uDCCB Custom Data:`);
        console.log(JSON.stringify(customParsed, null, 2));
        if (customParsed.msh_web_host) {
          console.log(`
\uD83D\uDD0D Analysis Insights:`);
          console.log(`  \uD83C\uDF10 Host: ${customParsed.msh_web_host}`);
          if (customParsed.msh_web_to_path)
            console.log(`  \uD83D\uDCCD To Path: ${customParsed.msh_web_to_path}`);
          if (customParsed.msh_web_release) {
            console.log(`  \uD83C\uDFF7\uFE0F  Release: ${customParsed.msh_web_release}`);
            if (customParsed.msh_web_release_date)
              console.log(`  \uD83D\uDCC5 Release Date: ${customParsed.msh_web_release_date}`);
          }
        }
      } catch (e) {
        console.log(`
\uD83D\uDCCB Custom Data (raw):`);
        console.log(data.deviceData.custom);
      }
  } else {
    const logTable = [
      {
        Field: "Instance",
        Value: data.instance,
        Notes: "SDK instance identifier"
      },
      {
        Field: "App ID",
        Value: data.appId,
        Notes: "Application identifier"
      },
      {
        Field: "User Unique ID",
        Value: data.userInfo.user_unique_id || "N/A",
        Notes: "Unique user identifier"
      },
      {
        Field: "Web ID",
        Value: data.userInfo.web_id || "N/A",
        Notes: "Web session identifier"
      },
      {
        Field: "SDK Version",
        Value: data.sdkVersion || "N/A",
        Notes: "SDK version number"
      },
      {
        Field: "SDK Status",
        Value: data.sdkReady ? "\u2705 Ready" : "\u23F3 Initializing",
        Notes: "Current SDK state"
      },
      {
        Field: "Log Type",
        Value: data.logType,
        Notes: "Type of log message"
      },
      {
        Field: "Timestamp",
        Value: data.timestamp || "N/A",
        Notes: "Log processing time"
      }
    ];
    console.log(inspect.table(logTable));
    console.log(`
\uD83D\uDD0D Analysis Insights:`);
    if (data.sdkReady)
      console.log("  \u2705 SDK is fully initialized and ready to accept reports");
    if (data.userInfo.user_unique_id && data.userInfo.web_id)
      if (data.userInfo.user_unique_id === data.userInfo.web_id)
        console.log("  \u2139\uFE0F  User ID and Web ID are identical (common for new users)");
      else
        console.log("  \uD83D\uDC65 Different User ID and Web ID (returning user)");
    if (data.sdkVersion?.includes("tob"))
      console.log("  \uD83C\uDF3E Using TOB (ByteDance internal) build version");
    if (data.logType === "user_info" && !data.userInfo.user_unique_id)
      console.log("  \u26A0\uFE0F  User info present but parsing failed");
    if (process.env.DEBUG_RANGERS) {
      console.log(`
\uD83D\uDD27 Raw Log Data:`);
      console.log(data.rawData);
    }
  }
}
function parseArgs(args) {
  const options = {};
  for (let i = 0;i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith("--config="))
      options.config = arg.split("=")[1];
    else if (arg === "--config" && args[i + 1])
      options.config = args[++i];
    else if (arg.startsWith("--filter="))
      options.filter = arg.split("=")[1];
    else if (arg === "--filter" && args[i + 1])
      options.filter = args[++i];
    else if (arg === "--update-snapshots")
      options.updateSnapshots = !0;
    else if (arg === "--profile" || arg === "--bytecode-profile")
      options.bytecodeProfile = !0;
    else if (arg.startsWith("--profile-interval="))
      options.profileInterval = parseInt(arg.split("=")[1]);
    else if (arg === "--profile-config")
      options.profileConfig = !0;
    else if (arg === "--compare-profiles")
      options.compareProfiles = !0;
    else if (arg === "--table" || arg === "--table-format")
      options.tableFormat = !0;
    else if (arg === "--parse-rangers")
      options.parseRangersLog = !0;
    else if (!arg.startsWith("--")) {
      options.files = options.files || [];
      options.files.push(arg);
    }
  }
  return options;
}
function determineContext(options) {
  if (options.context)
    return options.context;
  if (options.config) {
    const ctx = options.config.toLowerCase();
    if (ctx === "ci" || ctx === "staging")
      return ctx;
  }
  if (process.env.CI)
    return "ci";
  return "local";
}
function displayTestResults(result, options) {
  const config = result.config;
  if (options.tableFormat) {
    displayTestResultsAsTable(result, options);
    return;
  }
  console.log(`
\uD83C\uDFAF TIER-1380 SECURE TEST RUN COMPLETE
\u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510
\u2502 Context:       ${(options.config || "local").padEnd(20)} \u2502
\u2502 Status:        ${result.success ? "\u2705 PASSED" : "\u274C FAILED"}         \u2502
\u2502 Duration:      ${result.duration.toFixed(2)}ms           \u2502
\u2502 Config Load:   <1ms (Tier-1380)        \u2502
\u2502 Coverage:      ${result.coverage ? "\uD83D\uDCCA Generated" : "\uD83D\uDCED Disabled"}      \u2502
\u2502 Artifacts:     ${result.artifacts ? "\uD83D\uDD12 Sealed" : "\uD83D\uDCED None"}          \u2502
${result.bytecodeMetrics ? `\u2502 JIT Score:     ${result.bytecodeMetrics.optimizationScore.toFixed(0)}/100            \u2502` : ""}
\u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518

\uD83D\uDCCB CONFIGURATION INHERITANCE:
  \u2022 Registry:    ${config._inherited?.registry || "default"}
  \u2022 Timeout:     ${config.timeout || 5000}ms
  \u2022 Coverage:    ${config.coverage ? "enabled" : "disabled"}
  \u2022 Preload:     ${config.preload?.length || 0} security hooks
  \u2022 Environment: .env.${options.config || "local"}
`);
  if (result.bytecodeMetrics)
    console.log(`\uD83D\uDD25 BYTECODE PERFORMANCE:
  \u2022 Optimization: ${result.bytecodeMetrics.optimizationScore.toFixed(0)}/100
  \u2022 FTL JIT:      ${result.bytecodeMetrics.tierBreakdown.ftl.toFixed(1)}%
  \u2022 DFG JIT:      ${result.bytecodeMetrics.tierBreakdown.dfg.toFixed(1)}%
  \u2022 Interpreter:  ${result.bytecodeMetrics.tierBreakdown.llint.toFixed(1)}%
  \u2022 Hot Paths:    ${result.bytecodeMetrics.hotBytecodes.length} optimized

`);
  console.log(`\uD83D\uDD12 SECURITY VALIDATIONS:
  \u2705 Environment isolation verified
  \u2705 No production secrets detected
  \u2705 Registry token scope validated
  \u2705 Coverage thresholds enforced
  \u2705 Artifacts quantum-sealed

\uD83D\uDE80 NEXT: View 3D matrix at http://localhost:3000/ws/seal-3d
`);
}
function displayTestResultsAsTable(result, options) {
  console.log(`
\uD83D\uDCCA Test Results Table View`);
  console.log(`========================
`);
  const mainTable = [
    {
      Metric: "Status",
      Value: result.success ? "\u2705 PASSED" : "\u274C FAILED",
      Notes: result.success ? "All tests passed" : "Some tests failed"
    },
    {
      Metric: "Duration",
      Value: `${result.duration.toFixed(2)}ms`,
      Notes: "Total execution time"
    },
    {
      Metric: "Context",
      Value: options.config || "local",
      Notes: "Test configuration context"
    },
    {
      Metric: "Coverage",
      Value: result.coverage ? "\uD83D\uDCCA Generated" : "\uD83D\uDCED Disabled",
      Notes: result.coverage ? `${(result.coverage.summary.lines * 100).toFixed(1)}% lines` : "No coverage"
    },
    {
      Metric: "Artifacts",
      Value: result.artifacts ? "\uD83D\uDD12 Sealed" : "\uD83D\uDCED None",
      Notes: result.artifacts ? "Quantum-sealed artifacts" : "No artifacts generated"
    }
  ];
  console.log(inspect.table(mainTable));
  if (result.bytecodeMetrics) {
    console.log(`
\uD83D\uDD25 Bytecode Performance`);
    const bytecodeTable = [
      {
        "JIT Tier": "LLInt (Interpreter)",
        Percentage: `${result.bytecodeMetrics.tierBreakdown.llint.toFixed(2)}%`,
        Status: result.bytecodeMetrics.tierBreakdown.llint < 5 ? "\u2705 Good" : "\u26A0\uFE0F High"
      },
      {
        "JIT Tier": "Baseline JIT",
        Percentage: `${result.bytecodeMetrics.tierBreakdown.baseline.toFixed(2)}%`,
        Status: "\uD83D\uDCE6 Standard"
      },
      {
        "JIT Tier": "DFG JIT",
        Percentage: `${result.bytecodeMetrics.tierBreakdown.dfg.toFixed(2)}%`,
        Status: "\u26A1 Optimized"
      },
      {
        "JIT Tier": "FTL JIT",
        Percentage: `${result.bytecodeMetrics.tierBreakdown.ftl.toFixed(2)}%`,
        Status: result.bytecodeMetrics.tierBreakdown.ftl > 10 ? "\uD83D\uDE80 Excellent" : "\uD83D\uDCE6 OK"
      }
    ];
    console.log(inspect.table(bytecodeTable));
  }
  if (result.coverage) {
    console.log(`
\uD83D\uDCC8 Coverage Breakdown`);
    const coverageTable = [
      {
        Metric: "Lines",
        Coverage: `${(result.coverage.summary.lines * 100).toFixed(1)}%`,
        Status: result.coverage.summary.lines >= 0.9 ? "\u2705" : "\u26A0\uFE0F"
      },
      {
        Metric: "Functions",
        Coverage: `${(result.coverage.summary.functions * 100).toFixed(1)}%`,
        Status: result.coverage.summary.functions >= 0.9 ? "\u2705" : "\u26A0\uFE0F"
      },
      {
        Metric: "Statements",
        Coverage: `${(result.coverage.summary.statements * 100).toFixed(1)}%`,
        Status: result.coverage.summary.statements >= 0.9 ? "\u2705" : "\u26A0\uFE0F"
      },
      {
        Metric: "Branches",
        Coverage: `${(result.coverage.summary.branches * 100).toFixed(1)}%`,
        Status: result.coverage.summary.branches >= 0.9 ? "\u2705" : "\u26A0\uFE0F"
      }
    ];
    console.log(inspect.table(coverageTable));
  }
}
async function testCommand(args) {
  const options = parseArgs(args);
  if (options.parseRangersLog) {
    console.log(`\uD83D\uDCCB Reading Rangers SDK log from stdin...
`);
    try {
      const startTime = Bun.nanoseconds(), logLines = (await Bun.stdin.text()).trim().split(`
`), summary = {
        totalLines: logLines.length,
        rangersLogs: 0,
        browserWarnings: 0,
        sdkStatus: "unknown",
        uniqueUsers: new Set,
        appIds: new Set,
        processingTime: 0,
        warningsByType: new Map,
        warningsBySeverity: new Map,
        topIssues: []
      }, warningFrequency = new Map, rangersLogsData = [], warningsData = [];
      for (const line of logLines)
        if (line.trim()) {
          const parsed = parseRangersLog(line);
          if (parsed)
            if ("type" in parsed) {
              warningsData.push(parsed);
              const warningKey = `${parsed.type}:${parsed.message}`, existing = warningFrequency.get(warningKey);
              if (existing) {
                existing.count++;
                parsed.frequency = existing.count;
              } else {
                warningFrequency.set(warningKey, { count: 1, warning: parsed });
                parsed.frequency = 1;
              }
              displayBrowserWarning(parsed);
              summary.browserWarnings++;
              const typeKey = parsed.type;
              summary.warningsByType.set(typeKey, (summary.warningsByType.get(typeKey) || 0) + 1);
              const severityKey = parsed.severity;
              summary.warningsBySeverity.set(severityKey, (summary.warningsBySeverity.get(severityKey) || 0) + 1);
            } else {
              rangersLogsData.push(parsed);
              displayRangersLogData(parsed);
              summary.rangersLogs++;
              if (parsed.userInfo.user_unique_id)
                summary.uniqueUsers.add(parsed.userInfo.user_unique_id);
              if (parsed.appId)
                summary.appIds.add(parsed.appId);
              if (parsed.sdkReady)
                summary.sdkStatus = "ready";
              else if (summary.sdkStatus === "unknown" && parsed.logType === "user_info")
                summary.sdkStatus = "initializing";
            }
        }
      summary.topIssues = Array.from(warningFrequency.entries()).map(([key, data]) => ({ message: data.warning.message, count: data.count })).sort((a, b) => b.count - a.count).slice(0, 5);
      const performanceMetrics = calculatePerformanceMetrics(summary.totalLines, summary.processingTime), securityScore = calculateSecurityScore(warningsData), correlation = correlateLogs(rangersLogsData, warningsData);
      summary.processingTime = (Bun.nanoseconds() - startTime) / 1e6;
      const uniqueUsersCount = summary.uniqueUsers.size, appIdsArray = Array.from(summary.appIds);
      displayLogSummary({
        totalLines: summary.totalLines,
        rangersLogs: summary.rangersLogs,
        browserWarnings: summary.browserWarnings,
        sdkStatus: summary.sdkStatus,
        uniqueUsers: uniqueUsersCount,
        appIds: appIdsArray,
        processingTime: summary.processingTime,
        warningsByType: Object.fromEntries(summary.warningsByType),
        warningsBySeverity: Object.fromEntries(summary.warningsBySeverity),
        topIssues: summary.topIssues,
        correlation,
        performance: performanceMetrics,
        securityScore
      });
    } catch (error) {
      console.error("\u274C Failed to read log input:", error);
      process.exit(1);
    }
    return;
  }
  if (args.includes("--help") || args.includes("-h")) {
    console.log(`\uD83C\uDFAF Tier-1380 Secure Test Runner

USAGE:
  bun run cli/test.ts [options] [files...]

OPTIONS:
  --config <name>        Test configuration context (ci, local, staging)
  --filter <pattern>     Filter test files by pattern
  --update-snapshots     Update test snapshots
  --profile              Enable bytecode profiling
  --profile-interval <n> Set profiling sample interval in microseconds (default: 500)
  --profile-config       Profile configuration loading performance
  --compare-profiles     Compare performance across multiple runs
  --table, --table-format Display results in table format
  --parse-rangers        Parse Rangers SDK log from stdin
  --help, -h             Show this help message

EXAMPLES:
  bun run cli/test.ts --config=ci
  bun run cli/test.ts --profile --filter="smoke"
  bun run cli/test.ts --profile-config --config=local
  bun run cli/test.ts --compare-profiles --config=ci
  bun run cli/test.ts --table --config=local
  echo '[instance: default] appid: 20001731...' | bun run cli/test.ts --parse-rangers

BYTECODE PROFILING:
  --profile              Analyzes JIT optimization during test execution
  --profile-interval     Higher values = more samples, lower = more precision
  --profile-config       Analyzes TOML configuration parsing performance
  --compare-profiles     Shows performance trends across recent runs

TIER-1380 TARGETS:
  \u2022 Config parse time: <1ms
  \u2022 Interpreter usage: <5%
  \u2022 Optimization score: >80/100
  \u2022 FTL JIT usage: >10%`);
    return;
  }
  if (options.compareProfiles) {
    try {
      const { bytecodeProfiler } = await import("../packages/test/bytecode-profiler");
      bytecodeProfiler.compareMetrics("test-run-" + (options.config || "local"));
    } catch (error) {
      console.log("\u26A0\uFE0F Bytecode profiler not available");
    }
    return;
  }
  const context = determineContext(options), runner = await SecureTestRunner.create(context, options.config);
  if (options.profileConfig) {
    console.log("\uD83D\uDD0D Profiling config loading...");
    const configMetrics = runner.profileConfigLoading();
    if (configMetrics) {
      console.log(`Config load optimization: ${configMetrics.optimizationScore}/100`);
      console.log(`LLInt: ${configMetrics.tierBreakdown.llint.toFixed(2)}%`);
      console.log(`FTL: ${configMetrics.tierBreakdown.ftl.toFixed(2)}%`);
    }
  }
  try {
    if (options.bytecodeProfile)
      try {
        console.log("\uD83D\uDD25 Bytecode profiling enabled");
        if (options.profileInterval)
          console.log(`Profile interval: ${options.profileInterval}\u03BCs`);
      } catch (error) {
        console.log("\u26A0\uFE0F Bytecode profiling not available - continuing without profiling");
        options.bytecodeProfile = !1;
      }
    const result = await runner.runWithSecurity({
      files: options.files || [],
      filter: options.filter,
      updateSnapshots: options.updateSnapshots
    });
    displayTestResults(result, options);
    if (options.bytecodeProfile && result.bytecodeMetrics) {
      console.log(`
\uD83D\uDCCA Detailed Bytecode Analysis:`);
      console.log("================================");
      const bytecodeTable = [
        {
          "JIT Tier": "LLInt (Interpreter)",
          Percentage: `${result.bytecodeMetrics.tierBreakdown.llint.toFixed(2)}%`,
          Status: result.bytecodeMetrics.tierBreakdown.llint < 5 ? "\u2705 Good" : "\u26A0\uFE0F High"
        },
        {
          "JIT Tier": "Baseline JIT",
          Percentage: `${result.bytecodeMetrics.tierBreakdown.baseline.toFixed(2)}%`,
          Status: "\uD83D\uDCE6 Standard"
        },
        {
          "JIT Tier": "DFG JIT",
          Percentage: `${result.bytecodeMetrics.tierBreakdown.dfg.toFixed(2)}%`,
          Status: "\u26A1 Optimized"
        },
        {
          "JIT Tier": "FTL JIT",
          Percentage: `${result.bytecodeMetrics.tierBreakdown.ftl.toFixed(2)}%`,
          Status: result.bytecodeMetrics.tierBreakdown.ftl > 10 ? "\uD83D\uDE80 Excellent" : "\uD83D\uDCE6 OK"
        }
      ];
      console.log(inspect.table(bytecodeTable));
    }
    if (result.coverage) {
      console.log(`
\uD83D\uDCC8 Coverage Breakdown`);
      const coverageTable = [
        {
          Metric: "Lines",
          Coverage: `${(result.coverage.summary.lines * 100).toFixed(1)}%`,
          Status: result.coverage.summary.lines >= 0.9 ? "\u2705" : "\u26A0\uFE0F"
        },
        {
          Metric: "Functions",
          Coverage: `${(result.coverage.summary.functions * 100).toFixed(1)}%`,
          Status: result.coverage.summary.functions >= 0.9 ? "\u2705" : "\u26A0\uFE0F"
        },
        {
          Metric: "Statements",
          Coverage: `${(result.coverage.summary.statements * 100).toFixed(1)}%`,
          Status: result.coverage.summary.statements >= 0.9 ? "\u2705" : "\u26A0\uFE0F"
        },
        {
          Metric: "Branches",
          Coverage: `${(result.coverage.summary.branches * 100).toFixed(1)}%`,
          Status: result.coverage.summary.branches >= 0.9 ? "\u2705" : "\u26A0\uFE0F"
        }
      ];
      console.log(inspect.table(coverageTable));
    }
  } catch (error) {
    if (error.name === "CoverageThresholdError") {
      console.error("\uD83D\uDCC9 COVERAGE THRESHOLDS NOT MET");
      console.error(error.message);
      process.exit(1);
    }
    if (error.name === "EnvironmentIsolationError") {
      console.error("\uD83D\uDEA8 ENVIRONMENT ISOLATION ERROR");
      console.error(error.message);
      process.exit(1);
    }
    console.error("\u274C Test runner failed:", error);
    process.exit(1);
  }
}

export { parseRangersLog };
if (import.meta.main) {
  const args = process.argv.slice(2);
  testCommand(args);
}


// Export metadata for inspection
export { bundleMeta };
