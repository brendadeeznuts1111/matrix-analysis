#!/usr/bin/env bun
/**
 * FactoryWager URL Parameter Parser
 * Advanced parsing of URL-encoded parameters with Map conversion
 */

class URLParameterParser {
  /**
   * Parse URL-encoded parameters into Map
   * Handles URL decoding, empty values, and quoted strings
   */
  static parseToMap(queryString: string): Map<string, string> {
    // Decode the query string first
    const decoded = decodeURIComponent(queryString);
    
    // Split by semicolon and filter out empty entries
    const pairs = decoded
      .split(';')
      .map(p => p.trim())
      .filter(p => p.length > 0);
    
    // Convert to Map, handling quoted values
    const map = new Map<string, string>();
    
    for (const pair of pairs) {
      const [key, ...valueParts] = pair.split('=');
      const value = valueParts.join('='); // Handle values that contain '='
      map.set(key, this.stripQuotes(value));
    }
    
    return map;
  }
  
  /**
   * Parse URL-encoded parameters into array of key-value pairs
   */
  static parseToArray(queryString: string): [string, string][] {
    const decoded = decodeURIComponent(queryString);
    const pairs = decoded
      .split(';')
      .map(p => p.trim())
      .filter(p => p.length > 0);
    
    return pairs.map(pair => {
      const [key, ...valueParts] = pair.split('=');
      const value = valueParts.join('=');
      return [key, this.stripQuotes(value)];
    });
  }
  
  /**
   * Strip surrounding quotes from values
   */
  private static stripQuotes(value: string): string {
    if (value.startsWith('"') && value.endsWith('"')) {
      return value.slice(1, -1);
    }
    if (value.startsWith("'") && value.endsWith("'")) {
      return value.slice(1, -1);
    }
    return value;
  }
  
  /**
   * Parse with custom separator
   */
  static parseWithSeparator(queryString: string, separator: string = ';'): Map<string, string> {
    const decoded = decodeURIComponent(queryString);
    const pairs = decoded
      .split(separator)
      .map(p => p.trim())
      .filter(p => p.length > 0);
    
    const map = new Map<string, string>();
    
    for (const pair of pairs) {
      const [key, ...valueParts] = pair.split('=');
      const value = valueParts.join('=');
      map.set(key, this.stripQuotes(value));
    }
    
    return map;
  }
  
  /**
   * Parse with regex for complex patterns
   */
  static parseWithRegex(queryString: string): Map<string, string> {
    const decoded = decodeURIComponent(queryString);
    const map = new Map<string, string>();
    
    // Match key=value pairs, handling quoted values
    const regex = /([^=;]+)=([^;]*)/g;
    let match;
    
    while ((match = regex.exec(decoded)) !== null) {
      const key = match[1].trim();
      const value = this.stripQuotes(match[2].trim());
      map.set(key, value);
    }
    
    return map;
  }
}

// Test examples
function runTests() {
  console.log(`🔧 URL Parameter Parser Tests`);
  console.log(`══════════════════════════════════════════════════════════════════════════════`);
  
  // Test 1: Basic key=value with URL encoding
  console.log(`\n📊 Test 1: Basic parsing with URL encoding`);
  const test1 = "a=1;b%3D2";
  const result1 = URLParameterParser.parseToArray(test1);
  console.log(`Input: ${test1}`);
  console.log(`Result: ${JSON.stringify(result1)}`);
  console.log(`Expected: [["a","1"],["b","=2"]]`);
  
  // Test 2: Empty values and filtering
  console.log(`\n📊 Test 2: Empty values and filtering`);
  const test2 = "a=;b=1;;";
  const result2 = URLParameterParser.parseToMap(test2);
  console.log(`Input: ${test2}`);
  console.log(`Result: ${JSON.stringify([...result2])}`);
  console.log(`Expected: Map(2) {"a" => "", "b" => "1"}`);
  
  // Test 3: Quoted values
  console.log(`\n📊 Test 3: Quoted values`);
  const test3 = 'user="nolarose"';
  const result3 = URLParameterParser.parseToMap(test3);
  console.log(`Input: ${test3}`);
  console.log(`Result: ${result3.get("user")}`);
  console.log(`Expected: nolarose`);
  
  // Test 4: Complex values with equals
  console.log(`\n📊 Test 4: Complex values with equals`);
  const test4 = 'url=https://example.com?param=value&other=test';
  const result4 = URLParameterParser.parseToMap(test4);
  console.log(`Input: ${test4}`);
  console.log(`Result: ${result4.get("url")}`);
  console.log(`Expected: https://example.com?param=value&other=test`);
  
  // Test 5: Multiple parameters
  console.log(`\n📊 Test 5: Multiple parameters`);
  const test5 = "name=John;age=30;city=New York";
  const result5 = URLParameterParser.parseToMap(test5);
  console.log(`Input: ${test5}`);
  console.log(`Result: ${JSON.stringify([...result5])}`);
  console.log(`Expected: [["name","John"],["age","30"],["city","New York"]]`);
  
  // Test 6: URL encoded quotes
  console.log(`\n📊 Test 6: URL encoded quotes`);
  const test6 = 'message=%22Hello%20World%22';
  const result6 = URLParameterParser.parseToMap(test6);
  console.log(`Input: ${test6}`);
  console.log(`Result: ${result6.get("message")}`);
  console.log(`Expected: "Hello World"`);
}

if (import.meta.main) {
  runTests();
}

export { URLParameterParser };
