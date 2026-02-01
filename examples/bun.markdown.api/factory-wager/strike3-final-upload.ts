#!/usr/bin/env bun
/**
 * FactoryWager Strike 3 - Final R2 Upload with Updated Credentials
 * Uses the provided Cloudflare credentials for successful R2 upload
 */

const CLOUDFLARE_TOKEN = "NpeqA18CUHa3Z59kQnj1HvbOUJ1yh-YbeCRUA36d";
const R2_ACCESS_KEY = "77ed8cb4269045592404648128734d39";
const R2_SECRET_KEY = "40eddf5d35b617b41b6425dbddc7f6f1c9362d738476f3cc46c880ea966ed6d4";
const R2_ENDPOINT = "https://7a470541a704caaf91e71efccc78fd36.r2.cloudflarestorage.com";
const BUCKET_NAME = "factory-wager-profiles";

class R2Uploader {
  private async createPresignedUrl(key: string): Promise<string> {
    console.log(`🔑 Creating presigned URL for: ${key}`);
    
    try {
      const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/7a470541a704caaf91e71efccc78fd36/r2/buckets/${BUCKET_NAME}/presigned-urls`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          method: 'PUT',
          path: key,
          expiresIn: 3600
        })
      });

      const data = await response.json();
      
      if (data.success) {
        console.log(`✅ Presigned URL created successfully`);
        return data.result.url;
      } else {
        console.error(`❌ Presigned URL failed:`, data.errors);
        throw new Error(`Presigned URL creation failed: ${data.errors?.[0]?.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error(`❌ API error:`, error);
      throw error;
    }
  }

  async uploadWithPresignedUrl(url: string, content: string, contentType: string = 'text/markdown'): Promise<boolean> {
    console.log(`📤 Uploading to R2...`);
    
    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': contentType
        },
        body: content
      });

      if (response.ok) {
        console.log(`✅ Upload successful`);
        return true;
      } else {
        console.error(`❌ Upload failed: ${response.status} ${response.statusText}`);
        const errorText = await response.text();
        console.error(`   Details: ${errorText}`);
        return false;
      }
    } catch (error) {
      console.error(`❌ Upload error:`, error);
      return false;
    }
  }

  async uploadProfile(key: string, content: string): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      // Step 1: Create presigned URL
      const presignedUrl = await this.createPresignedUrl(key);
      
      // Step 2: Upload using presigned URL
      const uploadSuccess = await this.uploadWithPresignedUrl(presignedUrl, content);
      
      if (uploadSuccess) {
        // Generate public URL
        const publicUrl = `${R2_ENDPOINT}/${BUCKET_NAME}/${key}`;
        return { success: true, url: publicUrl };
      } else {
        return { success: false, error: 'Upload failed' };
      }
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }
}

class ProfileManager {
  private profilesDir = ".factory-wager/profiles";

  async getLatestProfiles(): Promise<{ cpu: { key: string; content: string } | null; heap: { key: string; content: string } | null }> {
    console.log(`📂 Scanning profile directory...`);
    
    try {
      const files = await Array.fromAsync(Bun.file(this.profilesDir).list());
      
      const cpuFile = files.find(f => f.name.includes('cpu-') && f.name.endsWith('.md'));
      const heapFile = files.find(f => f.name.includes('heap-') && f.name.endsWith('.md'));
      
      let cpuProfile = null;
      let heapProfile = null;
      
      if (cpuFile) {
        const content = await Bun.file(`${this.profilesDir}/${cpuFile.name}`).text();
        const timestamp = cpuFile.name.replace('cpu-', '').replace('.md', '');
        cpuProfile = { key: `profiles/cpu/${timestamp}-cpu-profile.md`, content };
      }
      
      if (heapFile) {
        const content = await Bun.file(`${this.profilesDir}/${heapFile.name}`).text();
        const timestamp = heapFile.name.replace('heap-', '').replace('.md', '');
        heapProfile = { key: `profiles/heap/${timestamp}-heap-profile.md`, content };
      }
      
      console.log(`✅ Found profiles: CPU=${!!cpuProfile}, Heap=${!!heapProfile}`);
      return { cpu: cpuProfile, heap: heapProfile };
    } catch (error) {
      console.error(`❌ Profile scan failed:`, error);
      return { cpu: null, heap: null };
    }
  }
}

async function runStrike3Final() {
  console.log(`🚀 Running Strike 3: Final R2 Upload with Updated Credentials`);
  console.log(`══════════════════════════════════════════════════════════════════════════════`);
  
  const uploader = new R2Uploader();
  const profileManager = new ProfileManager();
  
  // Step 1: Load existing profiles
  console.log(`\n📂 Step 1: Loading existing profiles...`);
  const profiles = await profileManager.getLatestProfiles();
  
  if (!profiles.cpu && !profiles.heap) {
    console.error(`❌ No profiles found to upload`);
    process.exit(1);
  }
  
  // Step 2: Upload profiles to R2
  console.log(`\n📤 Step 2: Uploading profiles to R2...`);
  
  const results = [];
  
  if (profiles.cpu) {
    console.log(`\n📊 Uploading CPU profile...`);
    const result = await uploader.uploadProfile(profiles.cpu.key, profiles.cpu.content);
    results.push({ type: 'CPU', ...result });
    
    if (result.success) {
      console.log(`✅ CPU profile uploaded: ${result.url}`);
    } else {
      console.error(`❌ CPU profile upload failed: ${result.error}`);
    }
  }
  
  if (profiles.heap) {
    console.log(`\n📊 Uploading Heap profile...`);
    const result = await uploader.uploadProfile(profiles.heap.key, profiles.heap.content);
    results.push({ type: 'Heap', ...result });
    
    if (result.success) {
      console.log(`✅ Heap profile uploaded: ${result.url}`);
    } else {
      console.error(`❌ Heap profile upload failed: ${result.error}`);
    }
  }
  
  // Step 3: Results summary
  console.log(`\n══════════════════════════════════════════════════════════════════════════════`);
  console.log(`📊 STRIKE 3 FINAL RESULTS:`);
  
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
  
  if (successCount === totalCount) {
    console.log(`\n🎉 STRIKE 3 COMPLETE: All profiles uploaded to R2 successfully`);
    console.log(`   Bucket: ${BUCKET_NAME}`);
    console.log(`   Endpoint: ${R2_ENDPOINT}`);
    console.log(`   Total Uploaded: ${successCount}/${totalCount} profiles`);
    
    console.log(`\n🌐 Public URLs:`);
    results.forEach(result => {
      if (result.success && result.url) {
        console.log(`   📄 ${result.type}: ${result.url}`);
      }
    });
  } else {
    console.log(`\n⚠️  STRIKE 3 PARTIAL: ${successCount}/${totalCount} profiles uploaded`);
    console.log(`   Check error messages above for details`);
    process.exit(1);
  }
}

if (import.meta.main) {
  await runStrike3Final();
}

export { R2Uploader, ProfileManager };
