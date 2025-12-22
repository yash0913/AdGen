"use client"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"

export function getToken(): string | null {
  if (typeof window === "undefined") return null
  try {
    return localStorage.getItem("token")
  } catch {
    return null
  }
}

function resolveUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path
  if (API_BASE) {
    // If caller passes '/api/xyz', drop the '/api' prefix when joining with API_BASE which already contains it.
    if (path.startsWith("/api/")) return `${API_BASE}${path.replace(/^\/api/, "")}`
    return `${API_BASE}${path}`
  }
  // If no API_BASE, assume Next.js rewrites or direct call
  return path
}

export async function postJSON<T = any>(path: string, body: any): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  const token = getToken()
  if (token) headers["Authorization"] = `Bearer ${token}`

  const url = resolveUrl(path)
  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    let message = `Request failed: ${res.status}`
    try {
      const data = await res.json()
      if (data?.message) message = data.message
    } catch {}
    throw new Error(message)
  }

  return res.json()
}

export async function postFormData<T = any>(path: string, formData: FormData): Promise<T> {
  const headers: Record<string, string> = {}
  const token = getToken()
  if (token) headers["Authorization"] = `Bearer ${token}`

  const url = resolveUrl(path)
  const res = await fetch(url, {
    method: "POST",
    headers,
    body: formData,
  })

  if (!res.ok) {
    let message = `Request failed: ${res.status}`
    try {
      const data = await res.json()
      if (data?.message) message = data.message
    } catch {}
    throw new Error(message)
  }

  return res.json()
}

export async function generateDesigns(formData: FormData) {
  const response = await postFormData("/api/generate-designs", formData)
  return response
}

export async function logEvent(eventType: string, metadata?: Record<string, any>) {
  try {
    const path = typeof window !== "undefined" ? window.location.pathname : undefined
    await postJSON("/api/events", { eventType, path, metadata })
  } catch {}
}
