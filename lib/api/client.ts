const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

export interface ApiErrorShape {
  status: number
  message: string
  code?: string
  details?: unknown
}

export class ApiError extends Error {
  status: number
  code?: string
  details?: unknown

  constructor({ status, message, code, details }: ApiErrorShape) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.code = code
    this.details = details
  }
}

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  if (!BASE_URL) {
    throw new ApiError({
      status: 0,
      message: "NEXT_PUBLIC_API_BASE_URL이 설정되어 있지 않습니다.",
    })
  }

  let res: Response

  try {
    res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options?.headers || {}),
      },
    })
  } catch (error) {
    // 네트워크 에러 (서버 미응답, CORS 등)
    throw new ApiError({
      status: 0,
      message: "서버에 연결할 수 없습니다. 네트워크 상태를 확인해주세요.",
      details: error,
    })
  }

  let data: unknown
  const contentType = res.headers.get("content-type") ?? ""

  if (contentType.includes("application/json")) {
    try {
      data = await res.json()
    } catch {
      // JSON 파싱 실패 시에도 최소한 상태코드 기반으로 처리
      data = null
    }
  } else {
    data = await res.text().catch(() => null)
  }

  if (!res.ok) {
    const body = (data ?? {}) as any

    throw new ApiError({
      status: res.status,
      message: body?.message || `API Error: ${res.status}`,
      code: body?.code,
      details: body,
    })
  }

  return data as T
}