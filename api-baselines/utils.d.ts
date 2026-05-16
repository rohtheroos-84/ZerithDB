/**
 * zerithdb-utils — Internal shared utilities
 * Not for public consumption. Not exported from zerithdb-sdk.
 */
/** Type-safe check if a value is a plain object (not null, not array) */
declare function isPlainObject(value: unknown): value is Record<string, unknown>;
/** Asserts a value is not null or undefined, throws with a message if it is */
declare function assertDefined<T>(value: T | null | undefined, message: string): asserts value is T;
/** Convert a Uint8Array to a hex string */
declare function bytesToHex(bytes: Uint8Array): string;
/** Convert a hex string to a Uint8Array */
declare function hexToBytes(hex: string): Uint8Array;
/** Encode Uint8Array to base64 string */
declare function bytesToBase64(bytes: Uint8Array): string;
/** Decode base64 string to Uint8Array */
declare function base64ToBytes(b64: string): Uint8Array;
/** Sleep for a given number of milliseconds */
declare function sleep(ms: number): Promise<void>;
/** Exponential backoff with full jitter — returns delay in ms */
declare function backoffDelay(attempt: number, base?: number, max?: number): number;
/** Run an async function with a timeout, rejecting if it exceeds `ms` */
declare function withTimeout<T>(fn: () => Promise<T>, ms: number, timeoutMessage?: string): Promise<T>;
/** Generate a random UUID v4 */
declare function randomId(): string;

export { assertDefined, backoffDelay, base64ToBytes, bytesToBase64, bytesToHex, hexToBytes, isPlainObject, randomId, sleep, withTimeout };
