import { ApiError } from "./client"

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

type LearningSourceSummaryDto = {
    study_session_id: string
    topic: string
    content_md: string
  }
  
  type SummaryResponse = {
    code: string
    message: string
    data: LearningSourceSummaryDto
  }
  
  type TaskStatus = "DONE" | "TODO"
  
  export async function fetchTaskSummary(learningSourceId: number, taskId: number) {
    if (!BASE_URL) {
      throw new ApiError({
        status: 0,
        message: "NEXT_PUBLIC_API_BASE_URL이 설정되어 있지 않습니다.",
      })
    }
  
    let res: Response
    try {
      // 요약 조회: GET /{learningSourceId}/{taskId}/summary
      res = await fetch(`${BASE_URL}/api/learning-source/${learningSourceId}/${taskId}/summary`, {
        method: "GET",
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
  
    return data as SummaryResponse
  }
  
  // 요약 생성: POST /{learningSourceId}/{taskId}/summary
  export async function createTaskSummary(learningSourceId: number, taskId: number) {
    if (!BASE_URL) {
      throw new ApiError({
        status: 0,
        message: "NEXT_PUBLIC_API_BASE_URL이 설정되어 있지 않습니다.",
      })
    }
  
    let res: Response
    try {
      res = await fetch(`${BASE_URL}/api/learning-source/${learningSourceId}/${taskId}/summary`, {
        method: "POST",
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
  
    return data as SummaryResponse
  }



// Task 완료 상태 업데이트: PATCH /api/task/{taskId}/completion
export async function updateTaskCompletionStatus(taskId: number, status: TaskStatus) {
    if (!BASE_URL) {
      throw new ApiError({
        status: 0,
        message: "NEXT_PUBLIC_API_BASE_URL이 설정되어 있지 않습니다.",
      })
    }
  
    let res: Response
    try {
      res = await fetch(`${BASE_URL}/api/tasks/${taskId}/completion`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      })
    } catch (error) {
      throw new ApiError({
        status: 0,
        message: "서버에 연결할 수 없습니다. 네트워크 상태를 확인해주세요.",
        details: error,
      })
    }
  
    if (!res.ok) {
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
  
      const body = (data ?? {}) as any
  
      throw new ApiError({
        status: res.status,
        message: body?.message || `API Error: ${res.status}`,
        code: body?.code,
        details: body,
      })
    }
  }
  
  