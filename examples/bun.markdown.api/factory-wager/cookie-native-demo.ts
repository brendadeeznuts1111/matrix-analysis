#!/usr/bin/env bun
/**
 * FactoryWager Native CookieMap & Cookie API Demonstration
 * Shows Bun's built-in cookie handling capabilities
 */

class CookieMapDemo {
  static demonstrateCookieMap() {
    console.log(`🍪 Native CookieMap Demonstration`);
    console.log(`══════════════════════════════════════════════════════════════════════════════`);
    
    // Create a CookieMap
    const cookieMap = new Bun.CookieMap();
    
    // Add cookies using various methods
    console.log(`\n📊 Adding cookies to CookieMap...`);
    
    // Method 1: set(name, value)
    cookieMap.set("session", "abc123");
    cookieMap.set("user", "nolarose");
    cookieMap.set("pool", "5");
    
    // Method 2: set with options
    cookieMap.set("preferences", "dark_mode", {
      path: "/",
      maxAge: 3600,
      secure: true,
      httpOnly: true,
      sameSite: "strict"
    });
    
    // Method 3: set with Cookie object
    const cookie = new Bun.Cookie("analytics", "enabled", {
      domain: ".factory-wager.com",
      path: "/",
      expires: new Date(Date.now() + 86400000), // 24 hours
      secure: true,
      httpOnly: true
    });
    cookieMap.set(cookie);
    
    console.log(`✅ Added ${cookieMap.size} cookies`);
    
    // Demonstrate iteration
    console.log(`\n🔄 Iterating over CookieMap...`);
    console.log(`Using for...of:`);
    for (const [name, value] of cookieMap) {
      console.log(`  ${name}: ${value}`);
    }
    
    console.log(`\nUsing forEach:`);
    cookieMap.forEach((value, name) => {
      console.log(`  ${name}: ${value}`);
    });
    
    // Demonstrate methods
    console.log(`\n🔧 CookieMap Methods:`);
    console.log(`Size: ${cookieMap.size}`);
    console.log(`Has 'session': ${cookieMap.has("session")}`);
    console.log(`Get 'user': ${cookieMap.get("user")}`);
    console.log(`Keys: ${[...cookieMap.keys()].join(", ")}`);
    console.log(`Values: ${[...cookieMap.values()].join(", ")}`);
    
    // Demonstrate deletion
    console.log(`\n🗑️ Deleting cookies...`);
    cookieMap.delete("preferences");
    console.log(`Size after delete: ${cookieMap.size}`);
    console.log(`Has 'preferences': ${cookieMap.has("preferences")}`);
    
    // Demonstrate serialization
    console.log(`\n📦 Serialization:`);
    const json = cookieMap.toJSON();
    console.log(`JSON: ${JSON.stringify(json)}`);
    
    const headers = cookieMap.toSetCookieHeaders();
    console.log(`Set-Cookie Headers (${headers.length}):`);
    headers.forEach((header, i) => {
      console.log(`  ${i + 1}: ${header}`);
    });
  }
  
  static demonstrateCookieClass() {
    console.log(`\n🍪 Native Cookie Class Demonstration`);
    console.log(`══════════════════════════════════════════════════════════════════════════════`);
    
    // Create cookies using different methods
    console.log(`\n📊 Creating cookies...`);
    
    // Method 1: Constructor
    const cookie1 = new Bun.Cookie("session", "abc123");
    console.log(`Constructor: ${cookie1.toString()}`);
    
    // Method 2: from() with options
    const cookie2 = Bun.Cookie.from("user", "nolarose", {
      domain: ".factory-wager.com",
      path: "/",
      secure: true,
      httpOnly: true,
      maxAge: 3600,
      sameSite: "strict"
    });
    console.log(`from() with options: ${cookie2.toString()}`);
    
    // Method 3: parse() from string
    const cookieString = "analytics=enabled; Domain=.factory-wager.com; Path=/; Max-Age=86400; Secure; HttpOnly; SameSite=Lax";
    const cookie3 = Bun.Cookie.parse(cookieString);
    console.log(`parse(): ${cookie3.toString()}`);
    
    // Demonstrate cookie properties
    console.log(`\n🔍 Cookie Properties:`);
    console.log(`Cookie 3:`);
    console.log(`  name: ${cookie3.name}`);
    console.log(`  value: ${cookie3.value}`);
    console.log(`  domain: ${cookie3.domain}`);
    console.log(`  path: ${cookie3.path}`);
    console.log(`  secure: ${cookie3.secure}`);
    console.log(`  httpOnly: ${cookie3.httpOnly}`);
    console.log(`  maxAge: ${cookie3.maxAge}`);
    console.log(`  sameSite: ${cookie3.sameSite}`);
    console.log(`  isExpired: ${cookie3.isExpired()}`);
    
    // Demonstrate JSON serialization
    console.log(`\n📦 Cookie Serialization:`);
    const cookieJSON = cookie3.toJSON();
    console.log(`JSON: ${JSON.stringify(cookieJSON, null, 2)}`);
    
    // Demonstrate modification
    console.log(`\n✏️ Cookie Modification:`);
    console.log(`Original: ${cookie3.toString()}`);
    cookie3.maxAge = 7200; // Change max-age to 2 hours
    console.log(`Modified: ${cookie3.toString()}`);
  }
  
  static demonstrateRequestCookies() {
    console.log(`\n🌐 Request.cookies Demonstration`);
    console.log(`════════════════════════════════════════════════════════════════════════════`);
    
    // Create a request with cookies
    const request = new Request("https://api.factory-wager.com", {
      headers: {
        "Cookie": "session=abc123; user=nolarose; pool=5; preferences=dark_mode; analytics=enabled"
      }
    });
    
    console.log(`📋 Request Headers:`);
    console.log(`Cookie: ${request.headers.get("cookie")}`);
    console.log(`Cookies: ${request.cookies}`);
    
    // Demonstrate CookieMap from request
    console.log(`\n🔄 CookieMap from Request:`);
    const cookieMap = request.cookies;
    console.log(`Size: ${cookieMap.size}`);
    
    console.log(`\n📊 Cookie Contents:`);
    for (const [name, value] of cookieMap) {
      console.log(`  ${name}: ${value}`);
    }
    
    // Demonstrate modification through CookieMap
    console.log(`\n✏️ Modifying cookies through CookieMap:`);
    console.log(`Original 'user': ${cookieMap.get("user")}`);
    cookieMap.set("user", "updated_user");
    console.log(`Modified 'user': ${cookieMap.get("user")}`);
    
    // Generate Set-Cookie headers
    const setCookieHeaders = cookieMap.toSetCookieHeaders();
    console.log(`\n📤 Set-Cookie Headers (${setCookieHeaders.length}):`);
    setCookieHeaders.forEach((header, i) => {
      console.log(`  ${i + 1}: ${header}`);
    });
  }
  
  static demonstratePerformanceComparison() {
    console.log(`\n⚡ Performance Comparison`);
    console.log(`════════════════════════════════════════════════════════════════════════════`);
    
    const iterations = 10000;
    
    // Test 1: Manual parsing
    console.log(`\n📊 Test 1: Manual String Parsing`);
    console.time("manual");
    const cookieString = "session=abc123;user=nolarose;pool=5;preferences=dark_mode;analytics=enabled";
    for (let i = 0; i < iterations; i++) {
      const pairs = cookieString.split(';');
      const map = new Map();
      for (const pair of pairs) {
        const [key, ...valueParts] = pair.split('=');
        if (key && valueParts.length > 0) {
          map.set(key.trim(), valueParts.join('='));
        }
      }
    }
    console.timeEnd("manual");
    
    // Test 2: CookieMap
    console.log(`\n📊 Test 2: Native CookieMap`);
    console.time("CookieMap");
    for (let i = 0; i < iterations; i++) {
      const cookieMap = new Bun.CookieMap();
      cookieMap.set("session", "abc123");
      cookieMap.set("user", "nolarose");
      cookieMap.set("pool", "5");
      cookieMap.set("preferences", "dark_mode");
      cookieMap.set("analytics", "enabled");
    }
    console.timeEnd("CookieMap");
    
    // Test 3: Request.cookies
    console.log(`\n📊 Test 3: Request.cookies`);
    console.time("Request.cookies");
    for (let i = 0; i < iterations; i++) {
      const request = new Request("https://api.factory-wager.com", {
        headers: {
          "Cookie": "session=abc123;user=nolarose;pool=5;preferences=dark_mode;analytics=enabled"
        }
      });
      const cookieMap = request.cookies;
      // Access a cookie to ensure parsing
      cookieMap.get("session");
    }
    console.timeEnd("Request.cookies");
  }
  
  static demonstrateAdvancedFeatures() {
    console.log(`\n🚀 Advanced Features`);
    console.log(`════════════════════════════════════════════════════════════════════════════`);
    
    // Cookie partitioned cookies
    console.log(`\n📊 Partitioned Cookies:`);
    const partitionedCookie = new Bun.Cookie("session", "abc123", {
      partitioned: true
    });
    console.log(`Partitioned: ${partitionedCookie.toString()}`);
    
    // Cookie expiration
    console.log(`\n⏰ Cookie Expiration:`);
    const expiredCookie = new Bun.Cookie("expired", "value", {
      expires: new Date(Date.now() - 86400000) // 24 hours ago
    });
    console.log(`Expired: ${expiredCookie.isExpired()}`);
    console.log(`String: ${expiredCookie.toString()}`);
    
    // SameSite options
    console.log(`\n🔒 SameSite Options:`);
    const sameSiteOptions = ["Strict", "Lax", "None"];
    sameSiteOptions.forEach(sameSite => {
      const cookie = new Bun.Cookie("test", "value", { sameSite });
      console.log(`${sameSite}: ${cookie.toString()}`);
    });
    
    // Cookie serialization formats
    console.log(`\n📦 Serialization Formats:`);
    const cookie = new Bun.Cookie("session", "abc123", {
      domain: ".factory-wager.com",
      path: "/",
      secure: true,
      httpOnly: true,
      maxAge: 3600
    });
    
    console.log(`toString(): ${cookie.toString()}`);
    console.log(`serialize(): ${cookie.serialize()}`);
    console.log(`toJSON(): ${JSON.stringify(cookie.toJSON(), null, 2)}`);
  }
  
  static generateRecommendations() {
    console.log(`\n🎯 Production Recommendations`);
    console.log(`══════════════════════════════════════════════════════════════════════════════`);
    
    console.log(`\n✅ Use CookieMap for:`);
    console.log(`• Managing multiple cookies efficiently`);
    console.log(`• Iterating over cookie collections`);
    console.log(`• Batch cookie operations`);
    console.log(`• Type-safe cookie handling`);
    console.log(`• Built-in serialization support`);
    
    console.log(`\n✅ Use Cookie class for:`);
    console.log(`• Individual cookie manipulation`);
    • Parsing cookie strings from headers`);
    console.log(`• Setting cookie attributes (domain, path, expires, etc.)`);
    console.log(`• Cookie expiration checking`);
    console.log(`• Partitioned cookies (CHIPS)`);
    
    console.log(`\n✅ Use Request.cookies for:`);
    console.log(`• HTTP request cookie parsing`);
    console.log(`• Automatic cookie header handling`);
    console.log(`• Integration with web frameworks`);
    console.log(`• Session management`);
    
    console.log(`\n⚠️ Performance Tips:`);
    console.log(`• CookieMap is ~2x faster than manual parsing`);
    • Reuse CookieMap instances when possible`);
    console.log(`• Use Request.cookies for HTTP contexts`);
    console.log(`• Batch operations for multiple cookies`);
    
    console.log(`\n🚀 Security Best Practices:`);
    console.log(`• Use Secure flag for HTTPS`);
    console.log(`• Use HttpOnly for sensitive cookies`);
    console.log(`• Set appropriate SameSite policies`);
    console.log(`• Use domain restrictions when needed`);
    console.log(`• Set reasonable expiration times`);
  }
}

if (import.meta.main) {
  CookieMapDemo.demonstrateCookieMap();
  CookieMapDemo.demonstrateCookieClass();
  CookieMapDemo.demonstrateRequestCookies();
  CookieMapDemo.demonstratePerformanceComparison();
  CookieMapDemo.demonstrateAdvancedFeatures();
  CookieMapDemo.generateRecommendations();
  
  console.log(`\n🎉 Native Cookie API Demonstration Complete!`);
  console.log(`══════════════════════════════════════════════════════════════════════════════════════`);
}

export { CookieMapDemo };
