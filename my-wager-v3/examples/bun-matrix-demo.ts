#!/usr/bin/env bun
// Bun Matrix Demo - Tier-1380 Infrastructure

console.log('🚀 Bun Min Version Matrix - Tier-1380 Demo');
console.log('==========================================\n');

// Import the matrix viewer
import { matrixViewer } from '../src/matrix-view';

// 1. Show full matrix
console.log('1️⃣ Full Matrix View:');
matrixViewer.displayMatrix();

// 2. Filter by platform
console.log('\n\n2️⃣ Linux-only APIs:');
matrixViewer.displayMatrix({ platform: 'linux' });

// 3. Filter by stability
console.log('\n\n3️⃣ Experimental APIs:');
matrixViewer.displayMatrix({ stability: 'experimental' });

// 4. Search functionality
console.log('\n\n4️⃣ Search for "crypto":');
matrixViewer.displayMatrix({ searchTerm: 'crypto' });

// 5. Compatibility check
console.log('\n\n5️⃣ Compatibility Check:');
matrixViewer.checkCompatibility('1.3.7');

// 6. Breaking changes
console.log('\n\n6️⃣ Breaking Changes for 2.0.0:');
matrixViewer.getBreakingChanges('2.0.0');

// 7. RSS Sync (async)
console.log('\n\n7️⃣ RSS Sync:');
await matrixViewer.syncWithRSS();

console.log('\n✅ Demo Complete! Matrix is ready for Tier-1380 integration.');
