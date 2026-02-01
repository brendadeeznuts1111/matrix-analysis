#!/usr/bin/env bun
// factory-wager/cli/fw-analyze.ts
import { MarkdownEngine } from '../render/markdown-engine';
import { ANSIRenderer } from '../render/ansi-renderer';

// Cookie Parser for analyzing cookies in frontmatter
class CookieParser {
  static parse(header: string): Map<string, string> {
    const pairs = decodeURIComponent(header).split(";").map(p => p.trim().split("="));
    const map = new Map();
    for (const pair of pairs) {
      if (pair.length >= 2) {
        const key = pair[0].trim();
        const val = decodeURIComponent(pair.slice(1).join("=").trim().replace(/^"|"$/g, ""));
        map.set(key, val);
      }
    }
    return map;
  }
}

interface AnalyzeResult {
  file: string;
  frontmatter: Record<string, any>;
  wordCount: number;
  readingTime: number;
  htmlSize: number;
  cookies?: Record<string, string>;
  cookieCount?: number;
}

async function analyzeConfig(filePath: string, jsonOnly: boolean = false): Promise<void> {
  console.log(`🔍 Analyzing: ${filePath}`);
  
  const engine = new MarkdownEngine();
  const ansi = new ANSIRenderer();
  
  try {
    const doc = await engine.renderDocument(filePath, { 
      frontmatter: true, 
      headingIds: true 
    });
    
    // Extract cookies from frontmatter if present
    let cookies: Record<string, string> = {};
    let cookieCount = 0;
    
    if (doc.frontmatter && doc.frontmatter.cookies) {
      const cookieString = typeof doc.frontmatter.cookies === 'string' 
        ? doc.frontmatter.cookies 
        : JSON.stringify(doc.frontmatter.cookies);
      
      const parsedCookies = CookieParser.parse(cookieString);
      cookies = Object.fromEntries(parsedCookies);
      cookieCount = parsedCookies.size;
    }
    
    const result: AnalyzeResult = {
      file: filePath,
      frontmatter: doc.frontmatter,
      wordCount: doc.meta.wordCount,
      readingTime: doc.meta.readingTime,
      htmlSize: doc.html.length,
      cookies,
      cookieCount
    };
    
    if (jsonOnly) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      // Chromatic tabular output
      console.log('\n' + '='.repeat(60));
      console.log('📊 ANALYSIS REPORT');
      console.log('='.repeat(60));
      
      console.log('\n📝 Frontmatter:');
      console.log(ansi.renderFrontmatter(doc.frontmatter));
      
      console.log('\n🍪 Cookies:');
      if (result.cookieCount && result.cookieCount > 0 && result.cookies) {
        console.log(ansi.renderFrontmatter(result.cookies));
        console.log(`  Total Cookies: ${result.cookieCount}`);
      } else {
        console.log('  No cookies found in frontmatter');
      }
      
      console.log('\n📈 Metadata:');
      console.log(`  Words: ${result.wordCount}`);
      console.log(`  Reading Time: ~${result.readingTime} min`);
      console.log(`  HTML Size: ${result.htmlSize} bytes`);
      
      console.log('\n✅ Analysis complete');
    }
    
  } catch (error) {
    console.error(`❌ Error analyzing ${filePath}:`, error);
    process.exit(1);
  }
}

// CLI entry
const args = process.argv.slice(2);
const filePath = args[0];
const jsonOnly = args.includes('--json-only');

if (!filePath || filePath.startsWith('--')) {
  console.log('Usage: fw-analyze <config-file> [--json-only]');
  process.exit(1);
}

analyzeConfig(filePath, jsonOnly);
