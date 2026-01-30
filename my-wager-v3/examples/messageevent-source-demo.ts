#!/usr/bin/env bun
// MessageEvent.source Property Demo
// Shows proper usage of the readonly source property for secure messaging

// Export to make this file a module
export {};

console.log('📡 MessageEvent.source Property Demo');
console.log('===================================\n');

// Example 1: Cross-document messaging with source verification
class CrossDocumentMessenger {
  private trustedOrigins: Set<string>;
  private messageHandlers: Map<string, Function>;

  constructor(trustedOrigins: string[] = []) {
    this.trustedOrigins = new Set(trustedOrigins);
    this.messageHandlers = new Map();
  }

  // Listen for messages with source verification
  listen() {
    window.addEventListener('message', (event: MessageEvent) => {
      // Verify origin first
      if (!this.trustedOrigins.has(event.origin)) {
        console.warn(`⚠️ Untrusted origin: ${event.origin}`);
        return;
      }

      // Source is readonly - we can only check it
      if (!event.source) {
        console.warn('⚠️ Message has no source');
        return;
      }

      // Type guard for Window
      if (event.source instanceof Window) {
        console.log(`✅ Message from trusted window at ${event.origin}`);

        // Handle the message
        this.handleMessage(event.data, event.source);
      } else {
        console.log('📡 Message from MessagePort or Worker');
        this.handleMessage(event.data, event.source);
      }
    });
  }

  private handleMessage(data: any, source: MessageEventSource) {
    console.log('📨 Received:', data);
    console.log('📍 Source type:', source.constructor.name);

    // Echo back to source
    if (source && 'postMessage' in source) {
      source.postMessage({
        type: 'echo',
        original: data,
        timestamp: Date.now()
      }, '*');
    }
  }

  // Send message to a specific window
  sendToWindow(targetWindow: Window, message: any, origin: string = '*') {
    targetWindow.postMessage(message, { targetOrigin: origin });
  }
}

// Example 2: WebSocket integration with source tracking
class WebSocketManager {
  private connections: Map<WebSocket, any> = new Map();
  private messageQueue: Array<{source: MessageEventSource, data: any}> = [];

  handleWebSocketMessage(ws: any, event: MessageEvent) {
    // For WebSocket messages, source is typically the WebSocket itself
    // Note: Bun's WebSocket implementation may not set event.source
    // We'll track the WebSocket reference separately
    console.log('✅ WebSocket message received');

    // Store connection info
    this.connections.set(ws, {
      lastMessage: Date.now(),
      messageCount: (this.connections.get(ws)?.messageCount || 0) + 1
    });

    // Process message
    this.processMessage(event.data, ws);
  }

  private processMessage(data: any, source: any) {
    // Queue message with source
    this.messageQueue.push({ source, data });

    // Process queue
    this.processQueue();
  }

  private processQueue() {
    while (this.messageQueue.length > 0) {
      const { source, data } = this.messageQueue.shift()!;

      // Verify source is still connected
      if (source && typeof source === 'object' && 'readyState' in source && source.readyState === 1) {
        console.log('🔄 Processing:', data);

        // Send response back to source
        // Type guard to ensure source has send method
        if ('send' in source && typeof source.send === 'function') {
          (source as any).send(JSON.stringify({
            status: 'processed',
            timestamp: Date.now()
          }));
        }
      }
    }
  }
}

// Example 3: SharedWorker with MessagePort source
class SharedWorkerHandler {
  private ports: Set<MessagePort> = new Set();

  handleConnect(event: MessageEvent) {
    // In SharedWorker, event.source is the MessagePort
    const port = event.source as MessagePort;

    if (port instanceof MessagePort) {
      console.log('🔌 New MessagePort connected');
      this.ports.add(port);

      port.addEventListener('message', (msgEvent) => {
        // Verify the source is our port
        if (msgEvent.source === port) {
          this.handlePortMessage(msgEvent, port);
        }
      });

      port.start();
    }
  }

  private handlePortMessage(event: MessageEvent, port: MessagePort) {
    console.log('📨 Port message:', event.data);

    // Broadcast to all other ports
    this.ports.forEach(p => {
      if (p !== port) { // Don't send back to sender
        p.postMessage({
          type: 'broadcast',
          from: 'worker',
          data: event.data
        });
      }
    });
  }
}

// Example 4: Secure message validation
class SecureMessageValidator {
  private allowedSources: WeakSet<MessageEventSource> = new WeakSet();

  // Register a trusted source
  registerSource(source: MessageEventSource) {
    this.allowedSources.add(source);
    console.log('✅ Source registered');
  }

  validateMessage(event: MessageEvent): boolean {
    // Check if source exists
    if (!event.source) {
      console.error('❌ No source in message event');
      return false;
    }

    // Check if source is registered
    if (!this.allowedSources.has(event.source)) {
      console.error('❌ Unregistered source');
      return false;
    }

    // Additional validation
    if (!event.data || typeof event.data !== 'object') {
      console.error('❌ Invalid message data');
      return false;
    }

    if (!event.data.type) {
      console.error('❌ Missing message type');
      return false;
    }

    return true;
  }

  handleMessage(event: MessageEvent) {
    if (this.validateMessage(event)) {
      console.log('✅ Valid message from trusted source');

      // Process message
      switch (event.data.type) {
        case 'ping':
          event.source?.postMessage({ type: 'pong' });
          break;
        case 'data':
          console.log('📊 Data received:', event.data.payload);
          break;
        default:
          console.warn('⚠️ Unknown message type:', event.data.type);
      }
    }
  }
}

// Demo simulation
async function demo() {
  console.log('1️⃣ Cross-Document Messaging Example:');
  console.log('   (Simulating window-to-window communication)\n');

  // Simulate trusted origins
  const messenger = new CrossDocumentMessenger(['https://app.example.com', 'https://admin.example.com']);

  // Simulate message event (in real scenario, this comes from browser)
  const mockMessageEvent = {
    data: { type: 'test', message: 'Hello from popup!' },
    origin: 'https://app.example.com',
    source: window,
    // Add required MessageEvent properties
    type: 'message',
    bubbles: false,
    cancelable: false,
    composed: false,
    lastEventId: '',
    ports: [],
    // Additional properties to satisfy MessageEvent interface
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

  console.log('Simulating message event...');
  console.log('Source:', mockMessageEvent.source?.constructor.name);
  console.log('Origin:', mockMessageEvent.origin);
  console.log('Data:', mockMessageEvent.data);

  console.log('\n2️⃣ Source Types:');
  console.log('   • Window - for cross-document messaging');
  console.log('   • MessagePort - for SharedWorker connections');
  console.log('   • Worker - for WebWorker messages');
  console.log('   • null - if source cannot be determined');

  console.log('\n3️⃣ Security Best Practices:');
  console.log('   ✅ Always verify event.origin');
  console.log('   ✅ Check event.source is not null');
  console.log('   ✅ Use instanceof to validate source type');
  console.log('   ✅ Maintain allowlist of trusted sources');

  console.log('\n4️⃣ Common Use Cases:');
  console.log('   • Popup/iframe communication');
  console.log('   • SharedWorker coordination');
  console.log('   • WebSocket message routing');
  console.log('   • Cross-tab synchronization');
}

// Run demo
if (import.meta.main) {
  demo().catch(console.error);
}
