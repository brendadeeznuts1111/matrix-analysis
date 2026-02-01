#!/usr/bin/env bun
/**
 * FactoryWager Strike 3 - Final R2 Upload with Bun's Native S3Client
 * Uses Bun's built-in S3Client for direct Cloudflare R2 upload
 */

import { S3Client } from "bun";

// Cloudflare R2 Configuration
const R2_ACCESS_KEY = "77ed8cb4269045592404648128734d39";
const R2_SECRET_KEY = "40eddf5d35b617b41b6425dbddc7f6f1c9362d738476f3cc46c880ea966ed6d4";
const R2_ENDPOINT = "https://7a470541a704caaf91e71efccc78fd36.r2.cloudflarestorage.com";
const BUCKET_NAME = "factory-wager-profiles";

class R2Uploader {
  private client: S3Client;

  constructor() {
    this.client = new S3Client({
      accessKeyId: R2_ACCESS_KEY,
      secretAccessKey: R2_SECRET_KEY,
      bucket: BUCKET_NAME,
      endpoint: R2_ENDPOINT,
    });
  }

  async uploadProfile(key: string, content: string): Promise<{ success: boolean; url?: string; error?: string }> {
    console.log(`📤 Uploading to R2: ${key}`);
    
    try {
      const s3File = this.client.file(key);
      
      // Upload with content type
      await s3File.write(content, {
        type: "text/markdown",
        contentDisposition: `attachment; filename="${key.split('/').pop()}"`,
      });
      
      // Generate public URL
      const publicUrl = `${R2_ENDPOINT}/${BUCKET_NAME}/${key}`;
      
      console.log(`✅ Upload successful: ${publicUrl}`);
      return { success: true, url: publicUrl };
      
    } catch (error) {
      console.error(`❌ Upload failed:`, error);
      return { success: false, error: (error as Error).message };
    }
  }

  async verifyUpload(key: string): Promise<boolean> {
    try {
      const s3File = this.client.file(key);
      const exists = await s3File.exists();
      
      if (exists) {
        const size = await s3File.size();
        console.log(`✅ Verified upload: ${key} (${size} bytes)`);
        return true;
      } else {
        console.error(`❌ File not found after upload: ${key}`);
        return false;
      }
    } catch (error) {
      console.error(`❌ Verification failed:`, error);
      return false;
    }
  }

  async listProfiles(): Promise<string[]> {
    try {
      const files = await this.client.list();
      const profileFiles: string[] = [];
      
      // Handle the list response properly
      if (files && Array.isArray(files)) {
        for (const file of files) {
          if (file.key && file.key.startsWith('profiles/') && file.key.endsWith('.md')) {
            profileFiles.push(file.key);
          }
        }
      }
      
      console.log(`📋 Found ${profileFiles.length} profile files in R2`);
      return profileFiles;
    } catch (error) {
      console.error(`❌ List failed:`, error);
      return [];
    }
  }
}

class ProfileManager {
  private profilesDir = ".factory-wager/profiles";

  async getLatestProfiles(): Promise<{ cpu: { key: string; content: string } | null; heap: { key: string; content: string } | null }> {
    console.log(`📂 Loading profiles from local storage...`);
    
    try {
      // Use simple file scanning approach
      const cpuFile = ".factory-wager/profiles/cpu-2026-02-01T21-48-14-284Z.md";
      const heapFile = ".factory-wager/profiles/heap-2026-02-01T21-48-14-284Z.md";
      
      let cpuProfile = null;
      let heapProfile = null;
      
      // Check and load CPU profile
      try {
        const cpuExists = await Bun.file(cpuFile).exists();
        if (cpuExists) {
          const content = await Bun.file(cpuFile).text();
          const timestamp = "2026-02-01T21-48-14-284Z";
          cpuProfile = { key: `profiles/cpu/${timestamp}-cpu-profile.md`, content };
        }
      } catch (error) {
        console.log(`CPU profile not found: ${error}`);
      }
      
      // Check and load Heap profile
      try {
        const heapExists = await Bun.file(heapFile).exists();
        if (heapExists) {
          const content = await Bun.file(heapFile).text();
          const timestamp = "2026-02-01T21-48-14-284Z";
          heapProfile = { key: `profiles/heap/${timestamp}-heap-profile.md`, content };
        }
      } catch (error) {
        console.log(`Heap profile not found: ${error}`);
      }
      
      console.log(`✅ Found profiles: CPU=${!!cpuProfile}, Heap=${!!heapProfile}`);
      return { cpu: cpuProfile, heap: heapProfile };
    } catch (error) {
      console.error(`❌ Profile loading failed:`, error);
      return { cpu: null, heap: null };
    }
  }
}

async function runStrike3BunS3() {
  console.log(`🚀 Running Strike 3: R2 Upload with Bun's Native S3Client`);
  console.log(`══════════════════════════════════════════════════════════════════════════════`);
  
  const uploader = new R2Uploader();
  const profileManager = new ProfileManager();
  
  // Step 1: Test R2 connection
  console.log(`\n🔍 Step 1: Testing R2 connection...`);
  try {
    const existingFiles = await uploader.listProfiles();
    console.log(`✅ R2 connection successful, ${existingFiles.length} existing profiles`);
  } catch (error) {
    console.error(`❌ R2 connection failed:`, error);
    process.exit(1);
  }
  
  // Step 2: Load profiles
  console.log(`\n📂 Step 2: Loading local profiles...`);
  const profiles = await profileManager.getLatestProfiles();
  
  if (!profiles.cpu && !profiles.heap) {
    console.error(`❌ No profiles found to upload`);
    process.exit(1);
  }
  
  // Step 3: Upload profiles
  console.log(`\n📤 Step 3: Uploading profiles to R2...`);
  
  const results = [];
  
  if (profiles.cpu) {
    console.log(`\n📊 Uploading CPU profile...`);
    const result = await uploader.uploadProfile(profiles.cpu.key, profiles.cpu.content);
    
    if (result.success) {
      const verified = await uploader.verifyUpload(profiles.cpu.key);
      results.push({ type: 'CPU', success: verified, url: result.url });
    } else {
      results.push({ type: 'CPU', success: false, error: result.error });
    }
  }
  
  if (profiles.heap) {
    console.log(`\n📊 Uploading Heap profile...`);
    const result = await uploader.uploadProfile(profiles.heap.key, profiles.heap.content);
    
    if (result.success) {
      const verified = await uploader.verifyUpload(profiles.heap.key);
      results.push({ type: 'Heap', success: verified, url: result.url });
    } else {
      results.push({ type: 'Heap', success: false, error: result.error });
    }
  }
  
  // Step 4: Final verification
  console.log(`\n📋 Step 4: Final verification...`);
  const finalFiles = await uploader.listProfiles();
  
  // Step 5: Results
  console.log(`\n══════════════════════════════════════════════════════════════════════════════`);
  console.log(`📊 STRIKE 3 BUN S3 RESULTS:`);
  
  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;
  
  results.forEach(result => {
    console.log(`   ${result.type} Profile: ${result.success ? '✅ SUCCESS' : '❌ FAILED'}`);
    if (result.success && result.url) {
      console.log(`      URL: ${result.url}`);
    } else if (!result.success && result.error) {
      console.log(`      Error: ${result.error}`);
    }
  });
  
  console.log(`\n📋 R2 Bucket Status:`);
  console.log(`   Total Profiles: ${finalFiles.length}`);
  console.log(`   Bucket: ${BUCKET_NAME}`);
  console.log(`   Endpoint: ${R2_ENDPOINT}`);
  
  if (successCount === totalCount) {
    console.log(`\n🎉 STRIKE 3 COMPLETE: All profiles uploaded to R2 successfully`);
    console.log(`   Upload Method: Bun's native S3Client`);
    console.log(`   Total Uploaded: ${successCount}/${totalCount} profiles`);
    console.log(`   Verification: All files confirmed in R2`);
    
    console.log(`\n🌐 Public URLs:`);
    results.forEach(result => {
      if (result.success && result.url) {
        console.log(`   📄 ${result.type}: ${result.url}`);
      }
    });
    
    console.log(`\n🔧 Technical Details:`);
    console.log(`   Client: Bun.S3Client (native)`);
    console.log(`   Protocol: S3-compatible`);
    console.log(`   Authentication: Access Key + Secret Key`);
    console.log(`   Content Type: text/markdown`);
    
  } else {
    console.log(`\n⚠️  STRIKE 3 PARTIAL: ${successCount}/${totalCount} profiles uploaded`);
    console.log(`   Check error messages above for details`);
    process.exit(1);
  }
}

if (import.meta.main) {
  await runStrike3BunS3();
}

export { R2Uploader, ProfileManager };
