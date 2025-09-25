// app/lib/env.ts
// [AI] Minimal env detection for Vite/Bun/Vitest across browser/SSR.

type AnyRecord = Record<string, unknown>;

const g: AnyRecord = globalThis as AnyRecord;

export const isBrowser = typeof window !== "undefined";
export const isSSR = !isBrowser;

export const isNode =
  typeof process !== "undefined" && !!process.versions?.node;

const hasImportMeta = typeof import.meta !== "undefined";
const importMetaAny = (
  hasImportMeta ? (import.meta as unknown as AnyRecord) : {}
) as AnyRecord;
const importMetaEnv = (importMetaAny.env ?? {}) as AnyRecord;


export const isDev =
  (hasImportMeta && (importMetaEnv.DEV as boolean)) === true ||
  (isNode && process.env.NODE_ENV === "development");

export const isProd =
  (hasImportMeta && (importMetaEnv.PROD as boolean)) === true ||
  (isNode && process.env.NODE_ENV === "production");

export const isTestRuntime =
  // Preferred Vitest signals
  (hasImportMeta && "vitest" in import.meta) ||
  (isNode && process.env.VITEST === "true") ||
  (isNode && process.env.NODE_ENV === "test");
