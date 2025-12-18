// API 클라이언트 유틸리티

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"

// API 응답 타입
interface ApiResponse<T> {
  code: string
  message: string
  data: T
}

// API 요청 유틸리티
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`

  const response = await fetch(url, {
    ...options,
    credentials: "include", // 쿠키 포함
    headers: {
      ...options.headers,
    },
  })

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

// ==================== 인증 API ====================

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  id: number
  nickname: string
}

export interface SignupRequest {
  username: string
  password: string
  nickname: string
}

export async function login(data: LoginRequest): Promise<ApiResponse<LoginResponse>> {
  return apiRequest<LoginResponse>("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
}

export async function signup(data: SignupRequest): Promise<ApiResponse<null>> {
  return apiRequest<null>("/api/auth/signup", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
}

// ==================== 학습 스케줄 API ====================

export interface CreateScheduleRequest {
  learningSourceTitle: string
  startDate: string // YYYY-MM-DD
  endDate: string // YYYY-MM-DD
  excludeWeekend: boolean
  dailyStudyTime: number
}

export interface TaskInfo {
  taskId: number
  taskOrder: number
  taskTitle: string
  studyDate: string
  completed?: boolean
}

export interface ChapterInfo {
  chapterId: number
  chapterOrder: number
  chapterTitle: string
  taskInfoDtos: TaskInfo[]
  completed?: boolean
}

export interface ScheduleResponse {
  chapterInfoDtos: ChapterInfo[]
}

export async function createSchedule(
  file: File,
  request: CreateScheduleRequest,
): Promise<ApiResponse<ScheduleResponse>> {
  const formData = new FormData()
  formData.append("multipartFile", file)
  formData.append(
    "request",
    new Blob([JSON.stringify(request)], { type: "application/json" }),
  )

  return apiRequest<ScheduleResponse>("/api/schedule", {
    method: "POST",
    body: formData,
  })
}

export type RescheduleRequest = CreateScheduleRequest

export async function reschedule(
  request: RescheduleRequest,
): Promise<ApiResponse<ScheduleResponse>> {
  return apiRequest<ScheduleResponse>("/api/schedule/reschedule", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  })
}

// ==================== 홈 데이터 API ====================

export interface LearningSourceResponse {
  learningSourceId?: number
  learningSourceTitle: string
  chapterInfoDtos: ChapterInfo[]
}

export interface HomeResponse {
  userId: number
  nickname: string
  learningSourceResponseDtos: LearningSourceResponse[]
}

export async function getHomeData(userId: number): Promise<ApiResponse<HomeResponse>> {
  return apiRequest<HomeResponse>(`/api/home/${userId}`)
}

// ==================== 학습 자료 API ====================

export interface LearningSourceDetail {
  learningSourceTitle: string
  chapterInfoDtos: ChapterInfo[]
}

export async function getLearningSource(
  learningSourceId: number,
): Promise<ApiResponse<LearningSourceDetail>> {
  return apiRequest<LearningSourceDetail>(
    `/api/learning-source/${learningSourceId}`,
  )
}

export interface TaskSummaryRequest {
  learningSourceId: number
  taskId: number
}

export interface TaskSummaryResponse {
  summary: string
}

export async function getTaskSummary(
  learningSourceId: number,
  taskId: number,
): Promise<ApiResponse<TaskSummaryResponse>> {
  return apiRequest<TaskSummaryResponse>(
    `/api/learning-source/${learningSourceId}/${taskId}/summary`,
    {
      method: "POST",
    },
  )
}

// ==================== 챗봇 API ====================

export interface ChatMessage {
  content: string
}

export interface ChatSource {
  source: string
  page: number
}

export interface ChatResponse {
  userChatId: number
  assistantChatId: number
  assistantContent: string
  sources: ChatSource[]
}

export async function sendChatMessage(
  learningSourceId: number,
  userId: number,
  message: ChatMessage,
): Promise<ApiResponse<ChatResponse>> {
  return apiRequest<ChatResponse>(
    `/api/learning-sources/${learningSourceId}/chat?currentUserId=${userId}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    },
  )
}

export interface ChatHistoryItem {
  chatId: number
  role: "user" | "assistant"
  content: string
  timestamp: string
  sources?: ChatSource[]
}

export interface ChatHistoryResponse {
  chats: ChatHistoryItem[]
  hasNext: boolean
}

export async function getChatHistory(
  learningSourceId: number,
  userId: number,
  page: number = 0,
  size: number = 20,
): Promise<ApiResponse<ChatHistoryResponse>> {
  return apiRequest<ChatHistoryResponse>(
    `/api/learning-sources/${learningSourceId}/chat?currentUserId=${userId}&page=${page}&size=${size}`,
  )
}

// ==================== 학습 자료 삭제 API ====================

export async function deleteLearningSource(
  learningSourceId: number,
): Promise<ApiResponse<null>> {
  return apiRequest<null>(`/api/learning-source/${learningSourceId}`, {
    method: "DELETE",
  })
}

// ==================== 할 일 상태 업데이트 API ====================

export type TaskStatus = "SUCCESS" | "CANCEL"

export interface TaskCompletionRequest {
  status: TaskStatus
}

export async function updateTaskCompletion(
  taskId: number,
  status: TaskStatus,
): Promise<ApiResponse<null>> {
  return apiRequest<null>(`/api/tasks/${taskId}/completion`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status }),
  })
}
