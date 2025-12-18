import { apiFetch } from "./client"

export interface TaskInfoDto {
  taskId: number
  taskOrder: number
  taskTitle: string
  studyDate: string // "YYYY-MM-DD"
  taskStatus?: "DONE" | "TODO"
}

export interface ChapterInfoDto {
  chapterId: number
  chapterOrder: number
  chapterTitle: string
  taskInfoDtos: TaskInfoDto[]
}

export interface LearningSourceResponseDto {
  learningSourceId: number
  learningSourceTitle: string
  chapterInfoDtos: ChapterInfoDto[]
}

export interface HomeData {
  userId: number
  nickname: string
  learningSourceResponseDtos: LearningSourceResponseDto[]
}

export interface HomeResponse {
  code: string
  message: string
  data: HomeData
}

export async function fetchHomeData() {
  return apiFetch<HomeResponse>("/api/home/1", {
    method: "GET",
  })
}


