#!/usr/bin/env bun
/**
 * Bun Build - sourcemap and minify Options Demonstration
 * Shows how to generate sourcemaps and minify bundles
 */

// Make this file a module
export {};

console.log("📦 Bun Build - sourcemap & minify Demo");
console.log("====================================\n");

// Example 1: sourcemap options
console.log("1️⃣ Sourcemap Options");
console.log("---------------------");

const sourcemapTypes = [
  {
    type: "none" as const,
    description: "No sourcemap (default)",
    expected: "No .map file"
  },
  {
    type: "linked" as const,
    description: "Separate .map file with sourceMappingURL comment",
    expected: "bundle.js + bundle.js.map"
  },
  {
    type: "external" as const,
    description: "Separate .map file without comment",
    expected: "bundle.js + bundle.js.map (no link)"
  },
  {
    type: "inline" as const,
    description: "Sourcemap inlined as base64",
    expected: "bundle.js with inline sourcemap"
  }
];

for (const { type, description, expected } of sourcemapTypes) {
  const result = await Bun.build({
    entrypoints: ["./src/app.tsx"],
    outdir: `./dist/sourcemap-${type}`,
    sourcemap: type,
    files: {
      "./src/app.tsx": `
// Complex component for sourcemap testing
import { utils } from "./utils.ts";
import { config } from "./config.json";

interface User {
  id: number;
  name: string;
  email: string;
}

class AppComponent {
  private users: User[] = [];
  
  constructor() {
    this.loadUsers();
  }
  
  private async loadUsers() {
    try {
      const response = await fetch(config.apiUrl + "/users");
      this.users = await response.json();
      console.log("Loaded", this.users.length, "users");
    } catch (error) {
      console.error("Failed to load users:", error);
      utils.handleError(error);
    }
  }
  
  public render() {
    const userList = this.users
      .map(user => \`<div>\${user.name} (\${user.email})</div>\`)
      .join("");
    
    return \`
      <div class="app">
        <h1>User List</h1>
        \${userList}
      </div>
    \`;
  }
}

// Initialize app
const app = new AppComponent();
document.getElementById("root")!.innerHTML = app.render();
      `,
      "./src/utils.ts": `
export function handleError(error: any) {
  console.error("Error handled by utils:", error.message);
  
  // Send to error tracking
  if (window.Sentry) {
    window.Sentry.captureException(error);
  }
}

export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}
      `,
      "./src/config.json": JSON.stringify({
        apiUrl: "https://api.example.com",
        version: "1.0.0",
        features: {
          auth: true,
          analytics: false
        }
      })
    },
  });

  if (result.success) {
    console.log(`\n${type} sourcemap:`);
    console.log(`  Description: ${description}`);
    console.log(`  Expected: ${expected}`);
    console.log(`  Files created: ${result.outputs.length}`);
    
    result.outputs.forEach(output => {
      const isMap = output.path.endsWith('.map');
      console.log(`    - ${output.path} (${output.size} bytes)${isMap ? ' [sourcemap]' : ''}`);
      
      if (!isMap && output.size > 0) {
        const content = output.text();
        if (type === "linked" && content.toString().includes("sourceMappingURL")) {
          console.log(`      ✓ Contains sourceMappingURL comment`);
        } else if (type === "external" && !content.toString().includes("sourceMappingURL")) {
          console.log(`      ✓ No sourceMappingURL comment`);
        } else if (type === "inline" && content.toString().includes("data:application/json;base64")) {
          console.log(`      ✓ Contains inline sourcemap`);
        }
      }
    });
  }
}

// Example 2: Minification
console.log("\n2️⃣ Minification Options");
console.log("------------------------");

const minifyExamples = [
  {
    minify: false,
    description: "No minification (readable code)"
  },
  {
    minify: true,
    description: "Minification enabled (compact code)"
  }
];

for (const { minify, description } of minifyExamples) {
  const result = await Bun.build({
    entrypoints: ["./src/minify-test.ts"],
    outdir: `./dist/minify-${minify ? 'enabled' : 'disabled'}`,
    minify,
    files: {
      "./src/minify-test.ts": `
// This code will be minified when minify: true
import { calculateTotal } from "./math.ts";
import { User } from "./types.ts";

class ShoppingCart {
  private items: Array<{ name: string; price: number; quantity: number }> = [];
  
  public addItem(name: string, price: number, quantity: number): void {
    this.items.push({ name, price, quantity });
    console.log("Added item:", name, "Quantity:", quantity);
  }
  
  public getTotal(): number {
    return calculateTotal(this.items);
  }
  
  public getReceipt(): string {
    const total = this.getTotal();
    const itemsList = this.items
      .map(item => \`\${item.name} x\${item.quantity}: $\${item.price}\`)
      .join('\\n');
    
    return \`
Receipt:
--------
\${itemsList}
--------
Total: $\${total.toFixed(2)}
    \`;
  }
}

// Create and use cart
const cart = new ShoppingCart();
cart.addItem("Laptop", 999.99, 1);
cart.addItem("Mouse", 29.99, 2);

console.log(cart.getReceipt());
      `,
      "./src/math.ts": `
export function calculateTotal(items: Array<{ price: number; quantity: number }>): number {
  return items.reduce((total, item) => total + (item.price * item.quantity), 0);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}
      `,
      "./src/types.ts": `
export interface User {
  id: number;
  name: string;
  email: string;
  isActive: boolean;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  inStock: boolean;
}
      `
    },
  });

  if (result.success) {
    const output = result.outputs[0];
    const content = await output.text();
    
    console.log(`\nMinify ${minify ? 'enabled' : 'disabled'}:`);
    console.log(`  Description: ${description}`);
    console.log(`  Bundle size: ${content.length} characters`);
    console.log(`  Lines: ${content.split('\\n').length}`);
    
    // Show first few lines
    const preview = content.split('\\n').slice(0, 3).join('\\n');
    console.log(`  Preview:`);
    console.log(`    ${preview.replace(/\\n/g, '\\n    ')}`);
    
    if (minify) {
      const savings = content.length > 0 ? "Minified" : "No content";
      console.log(`  Status: ${savings}`);
    }
  }
}

// Example 3: Combined sourcemap and minify
console.log("\n3️⃣ Combined sourcemap + minify");
console.log("------------------------------");

const combinations = [
  {
    minify: true,
    sourcemap: "linked" as const,
    name: "Minified + Linked Sourcemap"
  },
  {
    minify: true,
    sourcemap: "inline" as const,
    name: "Minified + Inline Sourcemap"
  },
  {
    minify: false,
    sourcemap: "linked" as const,
    name: "Unminified + Linked Sourcemap"
  }
];

for (const { minify, sourcemap, name } of combinations) {
  const result = await Bun.build({
    entrypoints: ["./src/combined.tsx"],
    outdir: `./dist/combined-${name.toLowerCase().replace(/\s+/g, '-')}`,
    minify,
    sourcemap,
    files: {
      "./src/combined.tsx": `
import React from "react";
import { render } from "react-dom";

function App() {
  const [count, setCount] = React.useState(0);
  
  const handleClick = () => {
    setCount(prevCount => prevCount + 1);
    console.log("Count updated to:", count + 1);
  };
  
  return React.createElement('div', null,
    React.createElement('h1', null, 'Counter App'),
    React.createElement('p', null, \`Count: \${count}\`),
    React.createElement('button', { onClick: handleClick }, 'Increment')
  );
}

// Error boundary for debugging
class ErrorBoundary extends React.Component {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError(error: any) {
    return { hasError: true };
  }
  
  componentDidCatch(error: any, errorInfo: any) {
    console.error("Error caught by boundary:", error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return React.createElement('div', null, 'Something went wrong.');
    }
    
    return this.props.children;
  }
}

// Render app
const root = document.getElementById('root');
if (root) {
  render(
    React.createElement(ErrorBoundary, null,
      React.createElement(App)
    ),
    root
  );
}
      `,
    },
  });

  if (result.success) {
    console.log(`\n${name}:`);
    console.log(`  Files: ${result.outputs.length}`);
    
    let totalSize = 0;
    result.outputs.forEach(output => {
      totalSize += output.size;
      const type = output.path.endsWith('.map') ? '[sourcemap]' : '[bundle]';
      console.log(`    - ${output.path} (${output.size} bytes) ${type}`);
    });
    
    console.log(`  Total size: ${totalSize} bytes`);
  }
}

// Example 4: Production-ready configuration
console.log("\n4️⃣ Production-Ready Configuration");
console.log("----------------------------------");

const productionResult = await Bun.build({
  entrypoints: ["./src/production.ts"],
  outdir: "./dist/production",
  target: "browser",
  minify: true,
  sourcemap: "external", // External for production (separate, no comment)
  files: {
    "./src/production.ts": `
// Production application with error tracking
import { config } from "./config.ts";
import { analytics } from "./analytics.ts";
import { AuthService } from "./auth.ts";

class ProductionApp {
  private auth: AuthService;
  private isProduction: boolean;
  
  constructor() {
    this.isProduction = config.environment === "production";
    this.auth = new AuthService(config.apiKey);
    
    // Initialize analytics
    if (this.isProduction) {
      analytics.init(config.analyticsId);
      analytics.track("app_started");
    }
  }
  
  public async initialize(): Promise<void> {
    try {
      // Authenticate user
      const user = await this.auth.getCurrentUser();
      console.log("User authenticated:", user.id);
      
      // Load application data
      await this.loadData();
      
      // Track successful initialization
      if (this.isProduction) {
        analytics.track("app_initialized", { userId: user.id });
      }
    } catch (error) {
      console.error("Failed to initialize app:", error);
      
      // Report error in production
      if (this.isProduction && window.Sentry) {
        window.Sentry.captureException(error);
      }
      
      // Show user-friendly error
      this.showError("Failed to load application. Please try again.");
    }
  }
  
  private async loadData(): Promise<void> {
    // Simulate data loading
    const response = await fetch(config.dataUrl);
    if (!response.ok) {
      throw new Error(\`Failed to load data: \${response.status}\`);
    }
    
    const data = await response.json();
    console.log("Data loaded successfully:", data.items.length, "items");
  }
  
  private showError(message: string): void {
    const errorElement = document.getElementById("error-message");
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = "block";
    }
  }
}

// Add global error handling
window.addEventListener('error', (event) => {
  console.error("Global error:", event.error);
  if (window.Sentry) {
    window.Sentry.captureException(event.error);
  }
});

window.addEventListener('unhandledrejection', (event) => {
  console.error("Unhandled promise rejection:", event.reason);
  if (window.Sentry) {
    window.Sentry.captureException(event.reason);
  }
});

// Initialize production app
const app = new ProductionApp();
app.initialize().catch(console.error);
    `,
    "./src/config.ts": `
export const config = {
  environment: "production",
  apiKey: "prod-api-key-12345",
  dataUrl: "https://api.example.com/data",
  analyticsId: "GA-123456789-1"
};
    `,
    "./src/analytics.ts": `
export interface Analytics {
  init(id: string): void;
  track(event: string, properties?: Record<string, any>): void;
}

export const analytics: Analytics = {
  init(id: string) {
    // Initialize analytics service
    console.log("Analytics initialized with ID:", id);
  },
  
  track(event: string, properties?: Record<string, any>) {
    // Send analytics event
    console.log("Analytics track:", event, properties);
  }
};
    `,
    "./src/auth.ts": `
export interface User {
  id: string;
  email: string;
  name: string;
}

export class AuthService {
  constructor(private apiKey: string) {}
  
  async getCurrentUser(): Promise<User> {
    // Simulate authentication
    return {
      id: "user-123",
      email: "user@example.com",
      name: "John Doe"
    };
  }
}
    `
  },
});

if (productionResult.success) {
  console.log("✅ Production build complete!");
  console.log(`Files created: ${productionResult.outputs.length}`);
  
  let bundleSize = 0;
  let mapSize = 0;
  
  productionResult.outputs.forEach(output => {
    if (output.path.endsWith('.map')) {
      mapSize += output.size;
    } else {
      bundleSize += output.size;
    }
    console.log(`  - ${output.path} (${output.size} bytes)`);
  });
  
  console.log(`\nBundle size: ${bundleSize} bytes`);
  console.log(`Sourcemap size: ${mapSize} bytes`);
  console.log(`Total: ${bundleSize + mapSize} bytes`);
}

// Example 5: Development vs Production comparison
console.log("\n5️⃣ Development vs Production");
console.log("------------------------------");

// Development build
const devResult = await Bun.build({
  entrypoints: ["./src/dev-vs-prod.ts"],
  outdir: "./dist/development",
  minify: false,
  sourcemap: "linked",
  files: {
    "./src/dev-vs-prod.ts": `
// Development version with logging
console.log("Starting application in development mode...");

function calculateTax(amount: number, rate: number): number {
  console.log("Calculating tax on:", amount, "with rate:", rate);
  const tax = amount * (rate / 100);
  console.log("Tax calculated:", tax);
  return tax;
}

const price = 100;
const taxRate = 8.25;
const total = price + calculateTax(price, taxRate);

console.log("Final total:", total);
    `,
  },
});

// Production build
const prodResult = await Bun.build({
  entrypoints: ["./src/dev-vs-prod.ts"],
  outdir: "./dist/production-comparison",
  minify: true,
  sourcemap: "none",
  files: {
    "./src/dev-vs-prod.ts": `
// Production version - optimized
console.log("Starting application in development mode...");

function calculateTax(amount: number, rate: number): number {
  console.log("Calculating tax on:", amount, "with rate:", rate);
  const tax = amount * (rate / 100);
  console.log("Tax calculated:", tax);
  return tax;
}

const price = 100;
const taxRate = 8.25;
const total = price + calculateTax(price, taxRate);

console.log("Final total:", total);
    `,
  },
});

if (devResult.success && prodResult.success) {
  const devOutput = await devResult.outputs[0].text();
  const prodOutput = await prodResult.outputs[0].text();
  
  console.log("Development build:");
  console.log(`  Size: ${devOutput.length} characters`);
  console.log(`  Lines: ${devOutput.split('\n').length}`);
  console.log(`  Has sourcemap: Yes`);
  
  console.log("\nProduction build:");
  console.log(`  Size: ${prodOutput.length} characters`);
  console.log(`  Lines: ${prodOutput.split('\n').length}`);
  console.log(`  Has sourcemap: No`);
  
  const savings = ((devOutput.length - prodOutput.length) / devOutput.length * 100).toFixed(1);
  console.log(`\nSize reduction: ${savings}%`);
}

// Summary
console.log("\n📋 sourcemap & minify Summary");
console.log("==============================");
console.log("✅ sourcemap: 'none' - No sourcemap (default)");
console.log("✅ sourcemap: 'linked' - Separate .map file with comment");
console.log("✅ sourcemap: 'external' - Separate .map file, no comment");
console.log("✅ sourcemap: 'inline' - Base64 inlined sourcemap");
console.log("✅ minify: false - Readable code (default)");
console.log("✅ minify: true - Compact, optimized code");

console.log("\n💡 Use Cases:");
console.log("-------------");
console.log("• Development: linked sourcemap, no minify");
console.log("• Staging: linked sourcemap, minify enabled");
console.log("• Production: external sourcemap, minify enabled");
console.log("• Debug builds: inline sourcemap for easy sharing");

console.log("\n🔧 Best Practices:");
console.log("------------------");
console.log("• Use linked sourcemaps for development");
console.log("• Use external sourcemaps for production");
console.log("• Always minify for production builds");
console.log("• Combine with dead code elimination");
console.log("• Keep sourcemaps secure in production");

console.log("\n✨ sourcemap & minify demonstration complete! 🚀");
