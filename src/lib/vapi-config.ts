/** Sanjeevani X VAPI voice assistant. */
export const VAPI_ASSISTANT_ID =
  import.meta.env.VITE_VAPI_ASSISTANT_ID?.trim() || "1ad5fffd-5f9c-4870-8adb-562cfa8b06ed";

export const VAPI_SHARE_KEY =
  import.meta.env.VITE_VAPI_SHARE_KEY?.trim() || "46b36511-6c89-475f-ad76-9d87490f292d";

export function getVapiPublicKey(): string | undefined {
  return import.meta.env.VITE_VAPI_PUBLIC_KEY?.trim() || "a7dcd579-2f8d-4dcf-9fc5-d3630ce00a63";
}

export function isVapiConfigured(): boolean {
  return Boolean(getVapiPublicKey());
}

/** Public demo fallback when no SDK key is configured. */
export const VAPI_DEMO_URL = `https://vapi.ai?demo=true&shareKey=${VAPI_SHARE_KEY}&assistantId=${VAPI_ASSISTANT_ID}`;
