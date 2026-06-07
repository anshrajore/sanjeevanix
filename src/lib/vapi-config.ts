/** Sanjeevani X VAPI voice assistant. */
export const VAPI_ASSISTANT_ID =
  import.meta.env.VITE_VAPI_ASSISTANT_ID?.trim() || "d2ba34ac-aba0-4b10-a861-c053169c3d09";

export function getVapiPublicKey(): string | undefined {
  return import.meta.env.VITE_VAPI_PUBLIC_KEY?.trim() || undefined;
}

export function isVapiConfigured(): boolean {
  return Boolean(getVapiPublicKey());
}
