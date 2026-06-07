import type { BloodGroup } from "./donor-matching";
import type { GeoPoint } from "./geo";

export type PatientRequestStatus = "Open" | "Matching" | "Fulfilled" | "Cancelled";

export type PatientRequest = {
  request_id: string;
  patient_name: string;
  blood_group: BloodGroup;
  units_needed: string;
  city: string;
  hospital: string;
  urgency: string;
  patient_type: string;
  hospital_contact: string;
  required_before: string;
  status: PatientRequestStatus;
  latitude: number;
  longitude: number;
  assigned_donor_ids: string[];
  created_at: string;
};

const STORAGE_KEY = "sanjeevani_patient_requests";

function readAll(): PatientRequest[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PatientRequest[]) : [];
  } catch {
    return [];
  }
}

function writeAll(requests: PatientRequest[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
  window.dispatchEvent(new CustomEvent("sanjeevani:requests-updated"));
}

export function getPatientRequests(): PatientRequest[] {
  return readAll().sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

export function getActivePatientRequests(): PatientRequest[] {
  return getPatientRequests().filter((r) => r.status === "Open" || r.status === "Matching");
}

export function savePatientRequest(
  input: Omit<PatientRequest, "request_id" | "created_at" | "status" | "assigned_donor_ids">,
): PatientRequest {
  const request: PatientRequest = {
    ...input,
    request_id: `SJX-${Date.now().toString(36).toUpperCase()}`,
    status: "Open",
    assigned_donor_ids: [],
    created_at: new Date().toISOString(),
  };
  writeAll([request, ...readAll()]);
  return request;
}

export function updatePatientRequest(
  requestId: string,
  patch: Partial<Pick<PatientRequest, "status" | "assigned_donor_ids">>,
): void {
  writeAll(readAll().map((r) => (r.request_id === requestId ? { ...r, ...patch } : r)));
}

export function subscribePatientRequests(cb: () => void): () => void {
  const handler = () => cb();
  window.addEventListener("sanjeevani:requests-updated", handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener("sanjeevani:requests-updated", handler);
    window.removeEventListener("storage", handler);
  };
}

export type MapPatientPin = {
  id: string;
  name: string;
  bloodGroup: BloodGroup;
  lat: number;
  lng: number;
  urgency: string;
  hospital: string;
  status: PatientRequestStatus;
};

export function toMapPatientPins(requests: PatientRequest[]): MapPatientPin[] {
  return requests.map((r) => ({
    id: r.request_id,
    name: r.patient_name,
    bloodGroup: r.blood_group,
    lat: r.latitude,
    lng: r.longitude,
    urgency: r.urgency,
    hospital: r.hospital,
    status: r.status,
  }));
}

export function locationFromPoint(point: GeoPoint) {
  return { latitude: point.lat, longitude: point.lng };
}
