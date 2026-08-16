/**
 * Browser-only loader for the VAPI web SDK.
 *
 * Some bundled builds of `@vapi-ai/web` resolve their internal event-emitter
 * base class to a module namespace object, which makes `class Vapi extends
 * VapiEventEmitter` throw "The superclass is not a constructor" the moment the
 * module is evaluated or instantiated. We therefore try several module shapes
 * and, if the local build cannot be instantiated at all, fall back to the
 * pre-bundled ESM build served from a CDN.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

export type VapiInstance = {
  on: (event: string, callback: (...args: any[]) => void) => void;
  removeAllListeners?: () => void;
  start: (assistantId: string) => Promise<unknown>;
  stop: () => void;
};

type VapiCtor = new (key: string) => VapiInstance;

const CDN_URL = "https://esm.sh/@vapi-ai/web@2.5.2?bundle&target=es2020";

/** Pull a real constructor out of whatever shape the module exposes. */
function pickCtor(mod: unknown): VapiCtor | null {
  const candidates = [
    mod,
    (mod as { default?: unknown })?.default,
    (mod as { default?: { default?: unknown } })?.default?.default,
    (mod as { Vapi?: unknown })?.Vapi,
    (mod as { default?: { Vapi?: unknown } })?.default?.Vapi,
  ];
  for (const candidate of candidates) {
    if (typeof candidate === "function" && candidate.prototype) return candidate as VapiCtor;
  }
  return null;
}

function describe(error: unknown): string {
  if (error instanceof Error) return error.message;
  return typeof error === "string" ? error : "unknown error";
}

/**
 * Creates a live VAPI instance. Throws an Error whose message names the real
 * underlying failure so it can be shown to the operator.
 */
export async function createVapiInstance(publicKey: string): Promise<VapiInstance> {
  const problems: string[] = [];

  const loaders: Array<{ label: string; load: () => Promise<unknown> }> = [
    { label: "bundled SDK", load: () => import("@vapi-ai/web") },
    { label: "CDN SDK", load: () => import(/* @vite-ignore */ CDN_URL) },
  ];

  for (const loader of loaders) {
    try {
      const mod = await loader.load();
      const Ctor = pickCtor(mod);
      if (!Ctor) {
        problems.push(`${loader.label}: no usable constructor export`);
        continue;
      }
      // Instantiating is what actually trips the bad superclass, so do it here.
      const instance = new Ctor(publicKey);
      if (typeof instance?.start !== "function") {
        problems.push(`${loader.label}: instance is missing start()`);
        continue;
      }
      return instance;
    } catch (error) {
      problems.push(`${loader.label}: ${describe(error)}`);
    }
  }

  throw new Error(`Voice engine could not be initialised — ${problems.join(" | ")}`);
}
