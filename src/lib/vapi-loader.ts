/**
 * Browser-only loader for the VAPI web SDK.
 *
 * Some bundled builds of `@vapi-ai/web` resolve their internal event-emitter
 * base class to a module namespace object, which makes `class Vapi extends
 * VapiEventEmitter` throw "The superclass is not a constructor" the moment the
 * module is evaluated or instantiated. We therefore try several module shapes
 * and, if the local build cannot be instantiated at all, fall back to the
 * pre-bundled ESM build served from a CDN.
 *
 * Every stage is reported through `onStage` so the diagnostics panel can show
 * exactly which source was used and why an earlier one was rejected.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

export type VapiInstance = {
  on: (event: string, callback: (...args: any[]) => void) => void;
  removeAllListeners?: () => void;
  start: (assistantId: string) => Promise<unknown>;
  stop: () => void;
};

type VapiCtor = new (key: string) => VapiInstance;

export type StageReporter = (label: string, ok: boolean, detail?: string) => void;

const CDN_URLS = [
  "https://esm.sh/@vapi-ai/web@2.5.2?bundle&target=es2020",
  "https://cdn.jsdelivr.net/npm/@vapi-ai/web@2.5.2/+esm",
];

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

export type LoadResult = { instance: VapiInstance; source: string; problems: string[] };

/**
 * Creates a live VAPI instance, trying the bundled SDK first and CDN builds
 * afterwards. Throws an Error whose message names every real failure.
 */
export async function createVapiInstance(
  publicKey: string,
  onStage: StageReporter = () => {},
): Promise<LoadResult> {
  const problems: string[] = [];

  const loaders: Array<{ label: string; load: () => Promise<unknown> }> = [
    { label: "bundled SDK", load: () => import("@vapi-ai/web") },
    ...CDN_URLS.map((url, index) => ({
      label: `CDN SDK ${index + 1}`,
      load: () => import(/* @vite-ignore */ url),
    })),
  ];

  for (const loader of loaders) {
    try {
      const mod = await loader.load();
      const Ctor = pickCtor(mod);
      if (!Ctor) {
        const detail = "no usable constructor export";
        problems.push(`${loader.label}: ${detail}`);
        onStage(loader.label, false, detail);
        continue;
      }
      // Instantiating is what actually trips the bad superclass, so do it here.
      const instance = new Ctor(publicKey);
      if (typeof instance?.start !== "function") {
        const detail = "instance is missing start()";
        problems.push(`${loader.label}: ${detail}`);
        onStage(loader.label, false, detail);
        continue;
      }
      onStage(loader.label, true, "constructor instantiated");
      return { instance, source: loader.label, problems };
    } catch (error) {
      const detail = describe(error);
      problems.push(`${loader.label}: ${detail}`);
      onStage(loader.label, false, detail);
    }
  }

  throw new Error(`Voice engine could not be initialised — ${problems.join(" | ")}`);
}
