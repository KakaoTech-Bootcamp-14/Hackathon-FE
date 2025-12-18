import { apiFetch } from "./client"

export interface ProgressData {
  totalTaskCount: number
  doneTaskCount: number
  progressRate: number
}

export interface ProgressResponse {
  code: string
  message: string
  data: ProgressData
}

/**
 * 학습 자료 진도율 조회
 * GET /api/learning-source/{learningSourceId}/progress
 */
export async function fetchLearningSourceProgress(learningSourceId: number) {
  return apiFetch<ProgressResponse>(`/api/learning-source/${learningSourceId}/progress`, {
    method: "GET",
  })
}

/**
 * 챕터 진도율 조회
 * GET /api/chapters/{chapterId}/progress
 */
export async function fetchChapterProgress(chapterId: number) {
  return apiFetch<ProgressResponse>(`/api/chapters/${chapterId}/progress`, {
    method: "GET",
  })
}
