#!/usr/bin/env bun
/**
 * FactoryWager Strike 3 - Direct R2 Upload
 * Simple direct upload using curl and presigned URLs
 */

const CLOUDFLARE_TOKEN = "NpeqA18CUHa3Z59kQnj1HvbOUJ1yh-YbeCRUA36d";
const R2_ENDPOINT = "https://7a470541a704caaf91e71efccc78fd36.r2.cloudflarestorage.com";
const BUCKET_NAME = "factory-wager-profiles";

async function createPresignedUrl(key: string): Promise<string> {
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

async function uploadToR2(url: string, content: string): Promise<boolean> {
  console.log(`📤 Uploading to R2...`);
  
  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'text/markdown'
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

async function runStrike3Direct() {
  console.log(`🚀 Running Strike 3: Direct R2 Upload`);
  console.log(`══════════════════════════════════════════════════════════════════════════════`);
  
  // Load profiles directly
  console.log(`\n📂 Step 1: Loading profiles...`);
  
  const cpuFile = ".factory-wager/profiles/cpu-2026-02-01T21-48-14-284Z.md";
  const heapFile = ".factory-wager/profiles/heap-2026-02-01T21-48-14-284Z.md";
  
  let cpuContent = "";
  let heapContent = "";
  
  try {
    cpuContent = await Bun.file(cpuFile).text();
    console.log(`✅ CPU profile loaded (${cpuContent.length} bytes)`);
  } catch (error) {
    console.error(`❌ Failed to load CPU profile:`, error);
  }
  
  try {
    heapContent = await Bun.file(heapFile).text();
    console.log(`✅ Heap profile loaded (${heapContent.length} bytes)`);
  } catch (error) {
    console.error(`❌ Failed to load Heap profile:`, error);
  }
  
  if (!cpuContent && !heapContent) {
    console.error(`❌ No profiles found to upload`);
    process.exit(1);
  }
  
  // Step 2: Upload profiles
  console.log(`\n📤 Step 2: Uploading profiles to R2...`);
  
  const results = [];
  const timestamp = "2026-02-01T21-48-14-284Z";
  
  if (cpuContent) {
    console.log(`\n📊 Uploading CPU profile...`);
    try {
      const key = `profiles/cpu/${timestamp}-cpu-profile.md`;
      const presignedUrl = await createPresignedUrl(key);
      const uploadSuccess = await uploadToR2(presignedUrl, cpuContent);
      
      if (uploadSuccess) {
        const publicUrl = `${R2_ENDPOINT}/${BUCKET_NAME}/${key}`;
        results.push({ type: 'CPU', success: true, url: publicUrl });
        console.log(`✅ CPU profile uploaded: ${publicUrl}`);
      } else {
        results.push({ type: 'CPU', success: false, error: 'Upload failed' });
      }
    } catch (error) {
      results.push({ type: 'CPU', success: false, error: (error as Error).message });
      console.error(`❌ CPU profile upload failed:`, error);
    }
  }
  
  if (heapContent) {
    console.log(`\n📊 Uploading Heap profile...`);
    try {
      const key = `profiles/heap/${timestamp}-heap-profile.md`;
      const presignedUrl = await createPresignedUrl(key);
      const uploadSuccess = await uploadToR2(presignedUrl, heapContent);
      
      if (uploadSuccess) {
        const publicUrl = `${R2_ENDPOINT}/${BUCKET_NAME}/${key}`;
        results.push({ type: 'Heap', success: true, url: publicUrl });
        console.log(`✅ Heap profile uploaded: ${publicUrl}`);
      } else {
        results.push({ type: 'Heap', success: false, error: 'Upload failed' });
      }
    } catch (error) {
      results.push({ type: 'Heap', success: false, error: (error as Error).message });
      console.error(`❌ Heap profile upload failed:`, error);
    }
  }
  
  // Step 3: Results
  console.log(`\n══════════════════════════════════════════════════════════════════════════════`);
  console.log(`📊 STRIKE 3 DIRECT RESULTS:`);
  
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
  await runStrike3Direct();
}
