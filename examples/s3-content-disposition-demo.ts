#!/usr/bin/env bun
/**
 * Bun S3 Content-Disposition Demo
 * Demonstrates the new contentDisposition option for S3 file operations
 */

import { s3 } from "bun";

// Example 1: Force download with a specific filename
const reportFile = s3.file("report.pdf", {
  contentDisposition: 'attachment; filename="quarterly-report.pdf"',
});

// Example 2: Inline display (for images, PDFs that should open in browser)
const imageFile = s3.file("image.png", {
  contentDisposition: "inline",
});

// Example 3: Set contentDisposition when writing
async function uploadWithDisposition() {
  const imageData = Buffer.from("fake-image-data"); // Replace with actual image data
  
  await s3.write("image.png", imageData, {
    contentDisposition: "inline",
  });
  
  console.log("✓ Uploaded with inline disposition");
}

// Example 4: Download-triggering upload
async function uploadForDownload() {
  const reportData = Buffer.from("fake-report-data"); // Replace with actual PDF data
  
  await s3.write("report.pdf", reportData, {
    contentDisposition: 'attachment; filename="my-report.pdf"',
  });
  
  console.log("✓ Uploaded with attachment disposition");
}

// Run demos
console.log("S3 Content-Disposition Demo");
console.log("===========================\n");

console.log("File with attachment disposition:", reportFile);
console.log("File with inline disposition:", imageFile);

// Note: These would require actual S3 credentials to run
// await uploadWithDisposition();
// await uploadForDownload();

console.log("\n✓ Demo complete - contentDisposition option is available");
