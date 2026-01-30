#!/usr/bin/env bun
// WindowProxy Integration Demo
// Shows how WindowProxy objects are tracked in the Tier-1380 dashboard

import { windowProxyHandler } from '../packages/test/window-proxy-handler';

// Export to make this file a module
export {};

console.log('🪟 WindowProxy Integration Demo');
console.log('===============================\n');

// Demo 1: Simulate cross-document messaging
console.log('1️⃣ Simulating cross-document messaging...');
console.log('   (In a real browser, this would be actual Window objects)\n');

// Simulate a WindowProxy from a popup
const mockWindowProxy = {
  postMessage: (message: any, origin: string) => {
    console.log(`   📤 Message sent to ${origin}:`, message);
  }
} as WindowProxy;

// Register the WindowProxy
try {
  const proxyId = windowProxyHandler.registerWindowProxy(
    mockWindowProxy,
    'http://localhost:3002',
    { type: 'popup', opened: Date.now() }
  );

  console.log(`   ✅ WindowProxy registered with ID: ${proxyId}\n`);
} catch (error) {
  console.error('   ❌ Registration failed:', error);
}

// Demo 2: Handle incoming message
console.log('2️⃣ Simulating incoming message from WindowProxy...\n');

const mockMessageEvent = {
  source: mockWindowProxy,
  origin: 'http://localhost:3002',
  data: {
    type: 'test-result',
    status: 'passed',
    metrics: { duration: 123, coverage: 0.87 }
  }
} as MessageEvent;

const proxyInfo = windowProxyHandler.handleWindowProxyMessage(mockMessageEvent);

if (proxyInfo) {
  console.log(`   ✅ Message handled from WindowProxy ${proxyInfo.id}`);
  console.log(`   📊 Data:`, mockMessageEvent.data);
}

// Demo 3: Broadcast to all WindowProxies
console.log('\n3️⃣ Broadcasting message to all WindowProxies...\n');

const broadcastCount = windowProxyHandler.broadcast({
  type: 'system-update',
  message: 'Test configuration updated',
  timestamp: Date.now()
});

console.log(`   📡 Broadcast sent to ${broadcastCount} WindowProxies`);

// Demo 4: Show statistics
console.log('\n4️⃣ WindowProxy Statistics:\n');

const stats = windowProxyHandler.getStats();
console.log(`   Total WindowProxies: ${stats.total}`);
console.log(`   Active: ${stats.active}`);
console.log(`   Inactive: ${stats.inactive}`);
console.log(`   Origins: ${stats.origins.join(', ')}`);

// Demo 5: Dashboard integration
console.log('\n5️⃣ Dashboard Integration:');
console.log('   The WindowProxy data is displayed in the dashboard at:');
console.log('   http://localhost:3002');
console.log('\n   Dashboard shows:');
console.log('   • 🪟 WindowProxy Connections section');
console.log('   • Each proxy with ID, origin, and status');
console.log('   • Real-time updates when proxies connect/disconnect');
console.log('   • Last activity timestamp');

// Demo 6: Cleanup
console.log('\n6️⃣ Cleaning up...\n');

// Simulate cleanup after 2 seconds
setTimeout(() => {
  console.log('   🧹 Auto-cleaning inactive proxies...');
  // Call the public method instead of private
  const handler = windowProxyHandler as any;
  if (handler.cleanupInactiveProxies) {
    handler.cleanupInactiveProxies();
  }

  const finalStats = windowProxyHandler.getStats();
  console.log(`   Final count: ${finalStats.total} WindowProxies`);

  console.log('\n✅ Demo complete!');
  console.log('\nTo see the live dashboard:');
  console.log('1. Start the dashboard: bun run dashboard/regional-monitor.ts');
  console.log('2. Open http://localhost:3002 in your browser');
  console.log('3. The WindowProxy section will show active connections');
}, 2000);
