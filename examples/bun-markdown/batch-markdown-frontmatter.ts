#!/usr/bin/env bun

/**
 * FactoryWager Markdown Batch Frontmatter Processor
 * Integrates frontmatter extraction with batch HTML generation
 */

import { extractFrontmatter, normalizeFrontmatter } from './frontmatter-extractor'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { join, dirname, basename, extname } from 'path'

interface BatchOptions {
  inputDir: string
  outputDir: string
  extractFrontmatter: boolean
  generateIndex: boolean
  injectMeta: boolean
}

interface ProcessedFile {
  inputPath: string
  outputPath: string
  frontmatter?: any
  normalized?: any
  content: string
  html: string
  processingTime: number
}

/**
 * Process a single markdown file with frontmatter extraction
 */
async function processMarkdownFile(
  inputPath: string,
  outputPath: string,
  options: BatchOptions
): Promise<ProcessedFile> {
  const startTime = Date.now()

  try {
    const markdownContent = readFileSync(inputPath, 'utf-8')
    let frontmatter = null
    let normalized = null
    let contentToProcess = markdownContent

    // Extract frontmatter if enabled
    if (options.extractFrontmatter) {
      const result = extractFrontmatter(markdownContent)
      frontmatter = result.data
      normalized = normalizeFrontmatter(frontmatter)
      contentToProcess = result.content
    }

    // Convert to HTML using Bun.markdown
    const html = (Bun.markdown as any).html(contentToProcess, {
      headingIds: true,
      allowIframes: false,
      allowMath: false
    })

    // Inject metadata if enabled
    let finalHtml = html
    if (options.injectMeta && normalized) {
      const metaInjection = generateMetaTags(normalized)
      finalHtml = html.replace('</head>', `${metaInjection}</head>`)
    }

    // Ensure output directory exists
    const outputDir = dirname(outputPath)
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true })
    }

    // Write HTML file
    writeFileSync(outputPath, finalHtml)

    const processingTime = Date.now() - startTime

    return {
      inputPath,
      outputPath,
      frontmatter,
      normalized,
      content: contentToProcess,
      html: finalHtml,
      processingTime
    }

  } catch (error: any) {
    throw new Error(`Failed to process ${inputPath}: ${error.message}`)
  }
}

/**
 * Generate HTML meta tags from normalized frontmatter
 */
function generateMetaTags(data: Record<string, any>): string {
  const tags: string[] = []

  if (data.meta?.title || data.title) {
    tags.push(`<meta name="title" content="${escapeHtml(data.meta?.title || data.title)}">`)
    tags.push(`<meta property="og:title" content="${escapeHtml(data.meta?.title || data.title)}">`)
  }

  if (data.description) {
    tags.push(`<meta name="description" content="${escapeHtml(data.description)}">`)
    tags.push(`<meta property="og:description" content="${escapeHtml(data.description)}">`)
  }

  if (data.date_iso) {
    tags.push(`<meta name="date" content="${data.date_iso}">`)
    tags.push(`<meta property="article:published_time" content="${data.date_iso}">`)
  }

  if (data.tags && Array.isArray(data.tags)) {
    tags.push(`<meta name="keywords" content="${data.tags.join(', ')}">`)
    tags.push(`<meta property="article:tag" content="${data.tags.join(', ')}">`)
  }

  if (data.author) {
    tags.push(`<meta name="author" content="${escapeHtml(data.author)}">`)
  }

  return tags.join('\n    ')
}

/**
 * Escape HTML entities
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Find all markdown files in directory recursively
 */
function findMarkdownFiles(dir: string): string[] {
  const files: string[] = []

  function scanDirectory(currentDir: string) {
    const entries = readFileSync(join(currentDir, '.files'), 'utf-8')
      .split('\n')
      .filter(Boolean)

    for (const entry of entries) {
      const fullPath = join(currentDir, entry)

      if (entry.endsWith('.md')) {
        files.push(fullPath)
      }
    }
  }

  // For simplicity, create a .files list if it doesn't exist
  if (!existsSync(join(dir, '.files'))) {
    const { execSync } = require('child_process')
    execSync(`find "${dir}" -name "*.md" > "${join(dir, '.files')}"`)
  }

  scanDirectory(dir)
  return files
}

/**
 * Batch process markdown files with frontmatter extraction
 */
export async function batchMarkdownFrontmatter(options: BatchOptions): Promise<{
  processed: ProcessedFile[]
  totalTime: number
  index?: any
}> {
  const startTime = Date.now()
  const processed: ProcessedFile[] = []

  console.log(`🚀 Starting batch frontmatter processing...`)
  console.log(`📂 Input: ${options.inputDir}`)
  console.log(`📁 Output: ${options.outputDir}`)

  try {
    const markdownFiles = findMarkdownFiles(options.inputDir)
    console.log(`📄 Found ${markdownFiles.length} markdown files`)

    // Process files in parallel batches
    const batchSize = 10
    for (let i = 0; i < markdownFiles.length; i += batchSize) {
      const batch = markdownFiles.slice(i, i + batchSize)

      const batchPromises = batch.map(async (inputFile) => {
        const relativePath = inputFile.replace(options.inputDir, '').replace(/^\//, '')
        const outputFile = join(options.outputDir, relativePath.replace(/\.md$/, '.html'))

        return processMarkdownFile(inputFile, outputFile, options)
      })

      const batchResults = await Promise.all(batchPromises)
      processed.push(...batchResults)

      console.log(`✅ Processed ${Math.min(i + batchSize, markdownFiles.length)}/${markdownFiles.length} files`)
    }

    // Generate index if enabled
    let index
    if (options.generateIndex) {
      index = generateFrontmatterIndex(processed)
      const indexPath = join(options.outputDir, 'frontmatter-index.json')
      writeFileSync(indexPath, JSON.stringify(index, null, 2))
      console.log(`📋 Generated frontmatter index: ${indexPath}`)
    }

    const totalTime = Date.now() - startTime
    const avgTime = processed.length > 0 ? totalTime / processed.length : 0

    console.log(`\n🎉 Batch processing complete!`)
    console.log(`📊 Processed: ${processed.length} files`)
    console.log(`⏱️  Total time: ${totalTime}ms`)
    console.log(`📈 Average: ${avgTime.toFixed(2)}ms per file`)

    return { processed, totalTime, index }

  } catch (error: any) {
    console.error('❌ Batch processing failed:', error.message)
    throw error
  }
}

/**
 * Generate frontmatter index for search and metadata
 */
function generateFrontmatterIndex(processed: ProcessedFile[]): any {
  const index: {
    generated: string
    total_files: number
    tags: Set<string>
    categories: Set<string>
    authors: Set<string>
    files: any[]
  } = {
    generated: new Date().toISOString(),
    total_files: processed.length,
    tags: new Set<string>(),
    categories: new Set<string>(),
    authors: new Set<string>(),
    files: processed.map(file => ({
      path: file.inputPath,
      output: file.outputPath,
      frontmatter: file.frontmatter,
      normalized: file.normalized,
      processing_time: file.processingTime,
      content_length: file.content.length,
      html_length: file.html.length
    }))
  }

  // Extract metadata statistics
  for (const file of processed) {
    if (file.normalized?.tags) {
      file.normalized.tags.forEach((tag: string) => index.tags.add(tag))
    }
    if (file.normalized?.categories) {
      file.normalized.categories.forEach((cat: string) => index.categories.add(cat))
    }
    if (file.normalized?.author) {
      index.authors.add(file.normalized.author)
    }
  }

  // Convert Sets to Arrays for JSON serialization and return properly typed object
  const finalIndex = {
    generated: index.generated,
    total_files: index.total_files,
    tags: Array.from(index.tags),
    categories: Array.from(index.categories),
    authors: Array.from(index.authors),
    files: index.files
  }

  return finalIndex
}

// CLI interface
async function main() {
  const args = process.argv.slice(2)

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🏭 FactoryWager Markdown Batch Frontmatter Processor

Usage:
  bun run batch-markdown-frontmatter.ts <input> <output> [options]

Arguments:
  input           Input directory containing markdown files
  output          Output directory for HTML files

Options:
  --extract-frontmatter    Extract and normalize frontmatter
  --generate-index         Generate frontmatter index JSON
  --inject-meta           Inject metadata into HTML head
  --help, -h              Show this help

Examples:
  bun run batch-markdown-frontmatter.ts content dist --extract-frontmatter --generate-index --inject-meta
    `)
    return
  }

  if (args.length < 2) {
    console.error('❌ Input and output directories required')
    console.error('Use --help for usage information')
    return
  }

  const options: BatchOptions = {
    inputDir: args[0],
    outputDir: args[1],
    extractFrontmatter: args.includes('--extract-frontmatter'),
    generateIndex: args.includes('--generate-index'),
    injectMeta: args.includes('--inject-meta')
  }

  try {
    await batchMarkdownFrontmatter(options)
  } catch (error: any) {
    console.error('❌ Processing failed:', error.message)
    process.exit(1)
  }
}

// Run if executed directly
if (import.meta.main) {
  main().catch(console.error)
}
