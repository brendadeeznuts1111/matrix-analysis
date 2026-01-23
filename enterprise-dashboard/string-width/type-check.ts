/**
 * V8 Type Checking Utilities
 * Wraps Node.js util.types (V8 native type checks) with additional helpers
 */

import { types } from "util";

/**
 * V8TypeChecker - Native V8 type checking APIs
 * Uses v8::Value::Is* methods under the hood for maximum performance
 */
export class V8TypeChecker {
  // Primitive checks

  /**
   * Check if value is a string primitive
   */
  isString(value: unknown): value is string {
    return typeof value === "string";
  }

  /**
   * Check if value is a number primitive (not NaN)
   */
  isNumber(value: unknown): value is number {
    return typeof value === "number" && !Number.isNaN(value);
  }

  /**
   * Check if value is a safe integer (-2^53+1 to 2^53-1)
   * Uses Number.isSafeInteger (v8::Value::IsInt32 equivalent)
   */
  isSafeInteger(value: unknown): value is number {
    return Number.isSafeInteger(value);
  }

  /**
   * Check if value is a BigInt
   * Uses v8::Value::IsBigInt under the hood
   */
  isBigInt(value: unknown): value is bigint {
    return typeof value === "bigint";
  }

  /**
   * Check if value is a boolean primitive
   */
  isBoolean(value: unknown): value is boolean {
    return typeof value === "boolean";
  }

  /**
   * Check if value is undefined
   */
  isUndefined(value: unknown): value is undefined {
    return value === undefined;
  }

  /**
   * Check if value is null
   */
  isNull(value: unknown): value is null {
    return value === null;
  }

  /**
   * Check if value is a symbol
   */
  isSymbol(value: unknown): value is symbol {
    return typeof value === "symbol";
  }

  // Object checks

  /**
   * Check if value is a plain object (not null, not array)
   */
  isObject(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === "object" && !Array.isArray(value);
  }

  /**
   * Check if value is an array
   * Uses v8::Value::IsArray
   */
  isArray(value: unknown): value is unknown[] {
    return Array.isArray(value);
  }

  /**
   * Check if value is a function
   */
  isFunction(value: unknown): value is Function {
    return typeof value === "function";
  }

  // V8 native type checks via util.types

  /**
   * Check if value is a Date object
   * Uses v8::Value::IsDate
   */
  isDate(value: unknown): value is Date {
    return types.isDate(value);
  }

  /**
   * Check if value is a RegExp
   * Uses v8::Value::IsRegExp
   */
  isRegExp(value: unknown): value is RegExp {
    return types.isRegExp(value);
  }

  /**
   * Check if value is a Map
   * Uses v8::Value::IsMap
   */
  isMap(value: unknown): value is Map<unknown, unknown> {
    return types.isMap(value);
  }

  /**
   * Check if value is a Set
   * Uses v8::Value::IsSet
   */
  isSet(value: unknown): value is Set<unknown> {
    return types.isSet(value);
  }

  /**
   * Check if value is a WeakMap
   * Uses v8::Value::IsWeakMap
   */
  isWeakMap(value: unknown): value is WeakMap<object, unknown> {
    return types.isWeakMap(value);
  }

  /**
   * Check if value is a WeakSet
   * Uses v8::Value::IsWeakSet
   */
  isWeakSet(value: unknown): value is WeakSet<object> {
    return types.isWeakSet(value);
  }

  /**
   * Check if value is a Promise
   * Uses v8::Value::IsPromise
   */
  isPromise(value: unknown): value is Promise<unknown> {
    return types.isPromise(value);
  }

  /**
   * Check if value is an async function
   */
  isAsyncFunction(value: unknown): value is (...args: unknown[]) => Promise<unknown> {
    return types.isAsyncFunction(value);
  }

  /**
   * Check if value is a generator function
   */
  isGeneratorFunction(value: unknown): boolean {
    return types.isGeneratorFunction(value);
  }

  /**
   * Check if value is a native Error
   */
  isNativeError(value: unknown): value is Error {
    return types.isNativeError(value);
  }

  // ArrayBuffer and TypedArray checks

  /**
   * Check if value is an ArrayBuffer
   * Uses v8::Value::IsArrayBuffer
   */
  isArrayBuffer(value: unknown): value is ArrayBuffer {
    return types.isArrayBuffer(value);
  }

  /**
   * Check if value is a SharedArrayBuffer
   */
  isSharedArrayBuffer(value: unknown): value is SharedArrayBuffer {
    return types.isSharedArrayBuffer(value);
  }

  /**
   * Check if value is a DataView
   * Uses v8::Value::IsDataView
   */
  isDataView(value: unknown): value is DataView {
    return types.isDataView(value);
  }

  /**
   * Check if value is a TypedArray (Uint8Array, Int32Array, etc.)
   * Uses v8::Value::IsTypedArray
   */
  isTypedArray(value: unknown): value is NodeJS.TypedArray {
    return types.isTypedArray(value);
  }

  /**
   * Check if value is a Uint8Array specifically
   */
  isUint8Array(value: unknown): value is Uint8Array {
    return types.isUint8Array(value);
  }

  // Utility methods

  /**
   * Get the type name of a value
   */
  getTypeName(value: unknown): string {
    if (value === null) return "null";
    if (value === undefined) return "undefined";
    if (Array.isArray(value)) return "array";
    if (types.isDate(value)) return "date";
    if (types.isRegExp(value)) return "regexp";
    if (types.isMap(value)) return "map";
    if (types.isSet(value)) return "set";
    if (types.isPromise(value)) return "promise";
    if (types.isArrayBuffer(value)) return "arraybuffer";
    if (types.isDataView(value)) return "dataview";
    if (types.isTypedArray(value)) return "typedarray";
    if (typeof value === "bigint") return "bigint";
    return typeof value;
  }

  /**
   * Validate object has required properties with expected types
   */
  validateShape<T extends Record<string, unknown>>(
    value: unknown,
    shape: { [K in keyof T]: (v: unknown) => boolean }
  ): value is T {
    if (!this.isObject(value)) return false;

    for (const [key, validator] of Object.entries(shape)) {
      if (!(key in value) || !validator((value as Record<string, unknown>)[key])) {
        return false;
      }
    }

    return true;
  }
}

export const typeCheck = new V8TypeChecker();

/**
 * Type guard helpers for common patterns
 */
export const TypeGuards = {
  /**
   * Check if value is a non-empty string
   */
  isNonEmptyString(value: unknown): value is string {
    return typeof value === "string" && value.length > 0;
  },

  /**
   * Check if value is a positive number
   */
  isPositiveNumber(value: unknown): value is number {
    return typeof value === "number" && value > 0 && !Number.isNaN(value);
  },

  /**
   * Check if value is a non-negative integer
   */
  isNonNegativeInteger(value: unknown): value is number {
    return Number.isInteger(value) && (value as number) >= 0;
  },

  /**
   * Check if value is a valid array index
   */
  isValidArrayIndex(value: unknown, arrayLength: number): value is number {
    return Number.isInteger(value) && (value as number) >= 0 && (value as number) < arrayLength;
  },

  /**
   * Check if value is a non-empty array
   */
  isNonEmptyArray<T>(value: unknown): value is T[] {
    return Array.isArray(value) && value.length > 0;
  },

  /**
   * Check if value is an array of strings
   */
  isStringArray(value: unknown): value is string[] {
    return Array.isArray(value) && value.every(item => typeof item === "string");
  },

  /**
   * Check if value is an array of numbers
   */
  isNumberArray(value: unknown): value is number[] {
    return Array.isArray(value) && value.every(item => typeof item === "number");
  },

  /**
   * Check if value looks like a valid URL string
   */
  isURLString(value: unknown): value is string {
    if (typeof value !== "string") return false;
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Check if value is a valid ISO date string
   */
  isISODateString(value: unknown): value is string {
    if (typeof value !== "string") return false;
    const date = new Date(value);
    return !isNaN(date.getTime()) && value.includes("T");
  },
};
