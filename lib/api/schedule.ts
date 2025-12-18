import { ApiError } from "./client"

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

// 순수 JS 스타일 함수로 작성해 Turbopack의 TS 파싱 이슈를 피합니다.
export async function createSchedule(
  file: File,
  request: {
    learningSourceTitle: string
    startDate: string
    endDate: string
    dailyStudyTime: number
    excludeWeekend: boolean
  },
) {
  if (!BASE_URL) {
    throw new ApiError({
      status: 0,
      message: "NEXT_PUBLIC_API_BASE_URL이 설정되어 있지 않습니다.",
    })
  }

  const formData = new FormData()
  formData.append("multipartFile", file)
  formData.append(
    "request",
    new Blob([JSON.stringify(request)], {
      type: "application/json",
    }),
  )

  let res: Response

  try {
    res = await fetch(`${BASE_URL}/api/schedule`, {
      method: "POST",
      body: formData,
    })
  } catch (error) {
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

  // DataResponseDto<CreateScheduleResponseDto> 구조를 그대로 반환
  return data as any
}


// 스케줄 재생성: POST /api/schedule/reschedule
type ReCreateScheduleRequest = {
  learningSourceTitle: string
  startDate: string
  endDate: string
  dailyStudyTime: number
  excludeWeekend: boolean
}

export async function reCreateSchedule(request: ReCreateScheduleRequest) {
  if (!BASE_URL) {
    throw new ApiError({
      status: 0,
      message: "NEXT_PUBLIC_API_BASE_URL이 설정되어 있지 않습니다.",
    })
  }

  let res: Response

  try {
    res = await fetch(`${BASE_URL}/api/schedule/reschedule`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    })
  } catch (error) {
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

  // DataResponseDto<CreateScheduleResponseDto> 구조를 그대로 반환
  return data as any
}
