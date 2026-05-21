export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://cryorevive.onrender.com";

export async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw Object.assign(new Error(body.detail || res.statusText), {
      status: res.status,
    });
  }
  return res.json();
}

export function parseTimeSlot(slot: string): string {
  const match = slot.match(/^(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return "09:00";
  let hours = parseInt(match[1]);
  const isPM = match[3].toUpperCase() === "PM";
  if (isPM && hours !== 12) hours += 12;
  if (!isPM && hours === 12) hours = 0;
  return `${hours.toString().padStart(2, "0")}:${match[2]}`;
}
