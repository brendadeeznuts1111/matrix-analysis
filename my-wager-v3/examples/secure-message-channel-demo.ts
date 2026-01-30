#!/usr/bin/env bun
// SecureMessageChannel Demo
// Shows Tier-1380 zero-trust inter-context communication

import { secureMessageChannel, SecureWorkerPool, CSRFProtector } from '../packages/test/secure-message-channel';

// Export to make this file a module
export {};

console.log('🔒 SecureMessageChannel Demo');
console.log('============================\n');

// Demo 1: Basic secure message handling
console.log('1️⃣ Basic Secure Message Handling');
console.log('-----------------------------------\n');

// Create a mock WebSocket as source
const mockWebSocket = {
  readyState: 1, // OPEN
  send: (data: string) => console.log('   📤 Sent:', data)
} as any;

// Create secure message with CSRF token
const secureMessage = secureMessageChannel.createSecureMessage(
  'test-result',
  { status: 'passed', metrics: { score: 95 } },
  'demo-context'
);

console.log('   Created secure message:', secureMessage);
console.log('   CSRF Token:', secureMessage._csrf);

// Create MessageEvent
const messageEvent = {
  source: mockWebSocket,
  origin: 'ws://localhost:3002',
  data: secureMessage,
  type: 'message' as const,
  bubbles: false,
  cancelable: false,
  composed: false,
  lastEventId: '',
  ports: [],
  // Add required MessageEvent properties
  initMessageEvent: () => {},
  cancelBubble: false,
  currentTarget: null,
  defaultPrevented: false,
  eventPhase: 0,
  isTrusted: true,
  returnValue: true,
  srcElement: null,
  target: null,
  timeStamp: Date.now(),
  NONE: 0,
  CAPTURING_PHASE: 1,
  AT_TARGET: 2,
  BUBBLING_PHASE: 3,
  stopPropagation: () => {},
  preventDefault: () => {},
  initEvent: () => {},
  stopImmediatePropagation: () => {}
} as unknown as MessageEvent;

// Handle the message
const handled = secureMessageChannel.handleMessage(messageEvent);
console.log('   Message handled:', handled ? '✅' : '❌');

// Demo 2: Message with invalid source
console.log('\n2️⃣ Invalid Source Detection');
console.log('----------------------------\n');

const invalidEvent = {
  source: null, // Invalid source
  origin: 'malicious.com',
  data: secureMessage,
  type: 'message' as const,
  bubbles: false,
  cancelable: false,
  composed: false,
  lastEventId: '',
  ports: [],
  // Add required MessageEvent properties
  initMessageEvent: () => {},
  cancelBubble: false,
  currentTarget: null,
  defaultPrevented: false,
  eventPhase: 0,
  isTrusted: true,
  returnValue: true,
  srcElement: null,
  target: null,
  timeStamp: Date.now(),
  NONE: 0,
  CAPTURING_PHASE: 1,
  AT_TARGET: 2,
  BUBBLING_PHASE: 3,
  stopPropagation: () => {},
  preventDefault: () => {},
  initEvent: () => {},
  stopImmediatePropagation: () => {}
} as unknown as MessageEvent;

const invalidHandled = secureMessageChannel.handleMessage(invalidEvent);
console.log('   Invalid source handled:', invalidHandled ? '❌' : '✅');

// Demo 3: Worker Pool Security
console.log('\n3️⃣ Worker Pool Security');
console.log('-----------------------\n');

// Create mock MessagePort
const mockPort = {
  postMessage: (data: any) => console.log('   📤 Port sent:', data),
  onmessage: null,
  start: () => {},
  close: () => {}
} as MessagePort;

// Register the port
SecureWorkerPool.registerPort(mockPort);
console.log('   Registered MessagePort in SecureWorkerPool');

// Create message from registered port
const portEvent = {
  source: mockPort,
  origin: 'http://localhost:3002',
  data: secureMessageChannel.createSecureMessage(
    'worker-result',
    { processed: true, count: 42 }
  ),
  type: 'message' as const,
  bubbles: false,
  cancelable: false,
  composed: false,
  lastEventId: '',
  ports: [],
  // Add required MessageEvent properties
  initMessageEvent: () => {},
  cancelBubble: false,
  currentTarget: null,
  defaultPrevented: false,
  eventPhase: 0,
  isTrusted: true,
  returnValue: true,
  srcElement: null,
  target: null,
  timeStamp: Date.now(),
  NONE: 0,
  CAPTURING_PHASE: 1,
  AT_TARGET: 2,
  BUBBLING_PHASE: 3,
  stopPropagation: () => {},
  preventDefault: () => {},
  initEvent: () => {},
  stopImmediatePropagation: () => {}
} as unknown as MessageEvent;

const portHandled = secureMessageChannel.handleMessage(portEvent);
console.log('   Port message handled:', portHandled ? '✅' : '❌');

// Demo 4: Custom Message Handler
console.log('\n4️⃣ Custom Message Handler');
console.log('---------------------------\n');

secureMessageChannel.on('custom-event', (event: MessageEvent) => {
  console.log('   🎯 Custom handler triggered!');
  console.log('   Data:', event.data.data);
});

const customMessage = secureMessageChannel.createSecureMessage(
  'custom-event',
  { message: 'Hello from custom handler!' }
);

const customEvent = {
  source: mockWebSocket,
  origin: 'ws://localhost:3002',
  data: customMessage,
  type: 'message' as const,
  bubbles: false,
  cancelable: false,
  composed: false,
  lastEventId: '',
  ports: [],
  // Add required MessageEvent properties
  initMessageEvent: () => {},
  cancelBubble: false,
  currentTarget: null,
  defaultPrevented: false,
  eventPhase: 0,
  isTrusted: true,
  returnValue: true,
  srcElement: null,
  target: null,
  timeStamp: Date.now(),
  NONE: 0,
  CAPTURING_PHASE: 1,
  AT_TARGET: 2,
  BUBBLING_PHASE: 3,
  stopPropagation: () => {},
  preventDefault: () => {},
  initEvent: () => {},
  stopImmediatePropagation: () => {}
} as unknown as MessageEvent;

secureMessageChannel.handleMessage(customEvent);

// Demo 5: Security Statistics
console.log('\n5️⃣ Security Statistics');
console.log('-----------------------\n');

const stats = secureMessageChannel.getSecurityStats();
console.log('   Incidents:', stats.incidents.length);
console.log('   Locked Sources:', stats.lockedSourcesCount);
console.log('   Allowed Origins:', stats.allowedOrigins.join(', '));

if (stats.incidents.length > 0) {
  console.log('\n   Security Incidents:');
  stats.incidents.forEach(incident => {
    console.log(`   - ${incident.type}: ${incident.severity} at ${new Date(incident.timestamp).toISOString()}`);
  });
}

// Demo 6: CSRF Token Validation
console.log('\n6️⃣ CSRF Token Validation');
console.log('------------------------\n');

const csrfProtector = new CSRFProtector();
const token = csrfProtector.generateToken('test-context');
console.log('   Generated token:', token);

const valid = csrfProtector.verifyToken(token);
console.log('   Token valid (first use):', valid ? '✅' : '❌');

const reused = csrfProtector.verifyToken(token);
console.log('   Token valid (reuse):', reused ? '❌' : '✅');

// Demo 7: Origin Management
console.log('\n7️⃣ Origin Management');
console.log('---------------------\n');

secureMessageChannel.addAllowedOrigin('https://new-trusted-origin.com');
console.log('   Added new trusted origin');

const updatedStats = secureMessageChannel.getSecurityStats();
console.log('   Updated origins:', updatedStats.allowedOrigins.join(', '));

console.log('\n✅ Demo complete!');
console.log('\nKey Security Features:');
console.log('• ✅ Source validation (null check, origin whitelist)');
console.log('• ✅ CSRF token protection');
console.log('• ✅ Worker pool verification');
console.log('• ✅ Threat intelligence reporting');
console.log('• ✅ Automatic lockdown on repeated violations');
console.log('• ✅ Custom message handlers');
console.log('• ✅ Security statistics tracking');
