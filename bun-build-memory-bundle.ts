#!/usr/bin/env bun
/**
 * Bun Build - Entirely from Memory
 * Demonstrates bundling code without any files on disk
 */

// Make this file a module
export {};

console.log("📦 Bun Build - Entirely from Memory");
console.log("===================================\n");

// Example 1: Basic in-memory bundle
console.log("1️⃣ Basic In-Memory Bundle");
console.log("--------------------------");

const basicResult = await Bun.build({
  entrypoints: ["/app/index.ts"],
  files: {
    "/app/index.ts": `
import { greet } from "./greet.ts";
import { farewell } from "./farewell.ts";

console.log("=== Basic In-Memory Bundle ===");
console.log(greet("World"));
console.log(farewell("World"));
    `,
    "/app/greet.ts": `
export function greet(name: string): string {
  return "Hello, " + name + "!";
}
    `,
    "/app/farewell.ts": `
export function farewell(name: string): string {
  return "Goodbye, " + name + "!";
}
    `,
  },
});

if (basicResult.success) {
  const output = await basicResult.outputs[0].text();
  console.log("✅ Basic bundle created successfully");
  console.log("\n--- Generated Code ---");
  console.log(output);
  console.log("--- End of Code ---\n");
}

// Example 2: Complex application with multiple modules
console.log("2️⃣ Complex Application Bundle");
console.log("-------------------------------");

const complexResult = await Bun.build({
  entrypoints: ["/app/main.ts"],
  files: {
    "/app/main.ts": `
import { UserService } from "./services/UserService";
import { Logger } from "./utils/Logger";
import { Config } from "./config/Config";

const logger = new Logger();
const config = new Config();
const userService = new UserService(config, logger);

async function main() {
  logger.info("Application starting...");
  
  const users = await userService.getUsers();
  logger.info(\`Found \${users.length} users\`);
  
  const newUser = await userService.createUser({
    name: "John Doe",
    email: "john@example.com"
  });
  
  logger.info(\`Created user: \${newUser.name}\`);
  logger.info("Application finished!");
}

main().catch(console.error);
    `,
    "/app/services/UserService.ts": `
import { Logger } from "../utils/Logger";
import { Config } from "../config/Config";
import { Database } from "../database/Database";

export interface User {
  id: number;
  name: string;
  email: string;
  createdAt: Date;
}

export interface CreateUserRequest {
  name: string;
  email: string;
}

export class UserService {
  private users: User[] = [];
  private nextId = 1;

  constructor(
    private config: Config,
    private logger: Logger,
    private db?: Database
  ) {
    this.logger.info("UserService initialized");
  }

  async getUsers(): Promise<User[]> {
    this.logger.debug("Fetching all users");
    return [...this.users];
  }

  async createUser(request: CreateUserRequest): Promise<User> {
    this.logger.debug(\`Creating user: \${request.name}\`);
    
    const user: User = {
      id: this.nextId++,
      name: request.name,
      email: request.email,
      createdAt: new Date()
    };
    
    this.users.push(user);
    
    if (this.db) {
      await this.db.save('users', user);
    }
    
    this.logger.info(\`User created with ID: \${user.id}\`);
    return user;
  }
}
    `,
    "/app/utils/Logger.ts": `
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

export class Logger {
  private level: LogLevel = LogLevel.INFO;

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  private log(level: LogLevel, message: string): void {
    if (level >= this.level) {
      const timestamp = new Date().toISOString();
      const levelName = LogLevel[level];
      console.log(\`[\${timestamp}] [\${levelName}] \${message}\`);
    }
  }

  debug(message: string): void {
    this.log(LogLevel.DEBUG, message);
  }

  info(message: string): void {
    this.log(LogLevel.INFO, message);
  }

  warn(message: string): void {
    this.log(LogLevel.WARN, message);
  }

  error(message: string): void {
    this.log(LogLevel.ERROR, message);
  }
}
    `,
    "/app/config/Config.ts": `
export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
}

export interface AppConfig {
  name: string;
  version: string;
  database: DatabaseConfig;
}

export class Config {
  private config: AppConfig;

  constructor() {
    this.config = {
      name: "In-Memory App",
      version: "1.0.0",
      database: {
        host: "localhost",
        port: 5432,
        database: "myapp"
      }
    };
  }

  get<T extends keyof AppConfig>(key: T): AppConfig[T] {
    return this.config[key];
  }

  getAll(): AppConfig {
    return { ...this.config };
  }
}
    `,
    "/app/database/Database.ts": `
export interface Document {
  _id?: string;
  [key: string]: any;
}

export class Database {
  private collections: Map<string, Document[]> = new Map();

  async save(collection: string, doc: Document): Promise<Document> {
    const saved = { ...doc, _id: Math.random().toString(36).substr(2, 9) };
    const docs = this.collections.get(collection) || [];
    docs.push(saved);
    this.collections.set(collection, docs);
    return saved;
  }

  async find(collection: string, query?: Partial<Document>): Promise<Document[]> {
    const docs = this.collections.get(collection) || [];
    if (!query) return docs;
    
    return docs.filter(doc => {
      return Object.entries(query).every(([key, value]) => doc[key] === value);
    });
  }
}
    `,
  },
});

if (complexResult.success) {
  const output = await complexResult.outputs[0].text();
  console.log("✅ Complex application bundled successfully");
  console.log(`Bundle size: ${output.length} characters`);
  console.log("\n--- Bundle Preview (first 500 chars) ---");
  console.log(output.substring(0, 500) + "...");
  console.log("--- End of Preview ---\n");
}

// Example 3: React application bundled from memory
console.log("3️⃣ React Application Bundle");
console.log("---------------------------");

const reactResult = await Bun.build({
  entrypoints: ["/app/index.tsx"],
  files: {
    "/app/index.tsx": `
import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./styles.css";

const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
    `,
    "/app/App.tsx": `
import React, { useState } from "react";
import { Counter } from "./components/Counter";
import { UserList } from "./components/UserList";

export function App() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  return (
    <div className={\`app \${theme}\`}>
      <header>
        <h1>In-Memory React App</h1>
        <button onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
          Toggle Theme
        </button>
      </header>
      <main>
        <Counter />
        <UserList />
      </main>
    </div>
  );
}
    `,
    "/app/components/Counter.tsx": `
import React, { useState } from "react";

export function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div className="counter">
      <h2>Counter: {count}</h2>
      <button onClick={() => setCount(c => c + 1)}>Increment</button>
      <button onClick={() => setCount(c => c - 1)}>Decrement</button>
      <button onClick={() => setCount(0)}>Reset</button>
    </div>
  );
}
    `,
    "/app/components/UserList.tsx": `
import React, { useState } from "react";

interface User {
  id: number;
  name: string;
  email: string;
}

export function UserList() {
  const [users, setUsers] = useState<User[]>([
    { id: 1, name: "John Doe", email: "john@example.com" },
    { id: 2, name: "Jane Smith", email: "jane@example.com" },
  ]);

  const addUser = () => {
    const newUser: User = {
      id: users.length + 1,
      name: \`User \${users.length + 1}\`,
      email: \`user\${users.length + 1}@example.com\`,
    };
    setUsers([...users, newUser]);
  };

  return (
    <div className="user-list">
      <h2>Users</h2>
      <button onClick={addUser}>Add User</button>
      <ul>
        {users.map(user => (
          <li key={user.id}>
            {user.name} ({user.email})
          </li>
        ))}
      </ul>
    </div>
  );
}
    `,
    "/app/styles.css": `
.app {
  font-family: Arial, sans-serif;
  padding: 20px;
}

.app.dark {
  background: #333;
  color: white;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.counter, .user-list {
  margin: 20px 0;
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 5px;
}

button {
  margin: 5px;
  padding: 5px 10px;
  cursor: pointer;
}

.dark button {
  background: #555;
  color: white;
  border: 1px solid #777;
}
    `,
  },
  target: "browser",
});

if (reactResult.success) {
  console.log("✅ React application bundled successfully");
  console.log(`Files created: ${reactResult.outputs.length}`);
  reactResult.outputs.forEach(output => {
    console.log(`  - ${output.path} (${output.size} bytes)`);
  });
}

// Example 4: Node.js CLI tool from memory
console.log("\n4️⃣ Node.js CLI Tool Bundle");
console.log("--------------------------");

const cliResult = await Bun.build({
  entrypoints: ["/cli/index.ts"],
  files: {
    "/cli/index.ts": `
#!/usr/bin/env node
import { Command } from "commander";
import { greetCommand } from "./commands/greet";
import { calcCommand } from "./commands/calc";

const program = new Command();

program
  .name("memory-cli")
  .description("CLI tool built entirely from memory")
  .version("1.0.0");

program.addCommand(greetCommand);
program.addCommand(calcCommand);

program.parse();
    `,
    "/cli/commands/greet.ts": `
import { Command } from "commander";

export const greetCommand = new Command("greet")
  .description("Greet someone")
  .argument("<name>", "Name to greet")
  .option("-u, --uppercase", "Output in uppercase")
  .action((name, options) => {
    let greeting = \`Hello, \${name}!\`;
    if (options.uppercase) {
      greeting = greeting.toUpperCase();
    }
    console.log(greeting);
  });
    `,
    "/cli/commands/calc.ts": `
import { Command } from "commander";

export const calcCommand = new Command("calc")
  .description("Simple calculator")
  .argument("<x>", "First number")
  .argument("<op>", "Operator (+, -, *, /)")
  .argument("<y>", "Second number")
  .action((x, op, y) => {
    const numX = parseFloat(x);
    const numY = parseFloat(y);
    let result: number;

    switch (op) {
      case "+":
        result = numX + numY;
        break;
      case "-":
        result = numX - numY;
        break;
      case "*":
        result = numX * numY;
        break;
      case "/":
        result = numX / numY;
        break;
      default:
        console.error(\`Unknown operator: \${op}\`);
        process.exit(1);
    }

    console.log(\`\${numX} \${op} \${numY} = \${result}\`);
  });
    `,
  },
  target: "node",
});

if (cliResult.success) {
  console.log("✅ Node.js CLI tool bundled successfully");
  const output = await cliResult.outputs[0].text();
  console.log(`Bundle size: ${output.length} characters`);
}

// Example 5: Library with multiple entry points
console.log("\n5️⃣ Multi-Entry Library Bundle");
console.log("------------------------------");

const libraryResult = await Bun.build({
  entrypoints: [
    "/lib/index.ts",
    "/lib/utils.ts",
    "/lib/types.ts"
  ],
  files: {
    "/lib/index.ts": `
export * from "./types";
export * from "./utils";
export * from "./core";
export * from "./helpers";

// Re-export commonly used items
export { Calculator } from "./core";
export { formatNumber, formatDate } from "./utils";
    `,
    "/lib/types.ts": `
export interface CalculationResult {
  result: number;
  operation: string;
  timestamp: Date;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user";
}

export type Theme = "light" | "dark" | "auto";
    `,
    "/lib/utils.ts": `
import { User } from "./types";

export function formatNumber(num: number, decimals: number = 2): string {
  return num.toFixed(decimals);
}

export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function validateEmail(email: string): boolean {
  return /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email);
}

export function createUserDisplayName(user: User): string {
  return user.role === "admin" ? \`\${user.name} 👑\` : user.name;
}
    `,
    "/lib/core.ts": `
import { CalculationResult } from "./types";

export class Calculator {
  private history: CalculationResult[] = [];

  add(x: number, y: number): number {
    const result = x + y;
    this.addToHistory("addition", result);
    return result;
  }

  subtract(x: number, y: number): number {
    const result = x - y;
    this.addToHistory("subtraction", result);
    return result;
  }

  multiply(x: number, y: number): number {
    const result = x * y;
    this.addToHistory("multiplication", result);
    return result;
  }

  divide(x: number, y: number): number {
    if (y === 0) throw new Error("Division by zero");
    const result = x / y;
    this.addToHistory("division", result);
    return result;
  }

  getHistory(): CalculationResult[] {
    return [...this.history];
  }

  clearHistory(): void {
    this.history = [];
  }

  private addToHistory(operation: string, result: number): void {
    this.history.push({
      result,
      operation,
      timestamp: new Date()
    });
  }
}
    `,
    "/lib/helpers.ts": `
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

export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
    `,
  },
});

if (libraryResult.success) {
  console.log("✅ Multi-entry library bundled successfully");
  console.log(`Entry points: ${libraryResult.outputs.length}`);
  libraryResult.outputs.forEach(output => {
    console.log(`  - ${output.path} (${output.size} bytes)`);
  });
}

// Summary
console.log("\n📋 In-Memory Bundling Summary");
console.log("==============================");
console.log("✅ Basic application");
console.log("✅ Complex service architecture");
console.log("✅ React application");
console.log("✅ Node.js CLI tool");
console.log("✅ Multi-entry library");

console.log("\n💡 Benefits of In-Memory Bundling:");
console.log("----------------------------------");
console.log("• No filesystem dependencies");
console.log("• Perfect for serverless environments");
console.log("• Dynamic code generation");
console.log("• Template-based bundling");
console.log("• Test fixtures without files");
console.log("• Plugin systems");

console.log("\n🚀 All in-memory bundles created successfully! 🎉");
