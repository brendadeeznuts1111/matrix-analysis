/**
 * Frontmatter extraction, normalization, validation, batch processing, and HTML injection
 */

export { extractFrontmatter, type FrontmatterFormat, type FrontmatterResult } from "./extractor";
export { normalizeFrontmatter, type NormalizationOptions } from "./normalizer";
export { validateFrontmatter, type FieldRule, type FieldType, type FrontmatterSchema, type ValidationError, type ValidationResult } from "./validator";
export { batchExtractFrontmatter, generateIndex, writeIndex, type BatchEntry, type BatchOptions, type BatchResult } from "./batch";
export { generateHeadTags, injectIntoHtml, type InjectionMode, type InjectOptions } from "./inject";
