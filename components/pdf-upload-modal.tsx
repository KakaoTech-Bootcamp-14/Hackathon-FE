"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Upload, Calendar, Clock, Zap, FileText } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import type { StudyPlan, Chapter } from "@/app/page"
import { createSchedule } from "@/lib/api/schedule"

interface PdfUploadModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onPlanCreated: (plan: StudyPlan) => void
}

type Step = "upload" | "settings" | "generating" | "preview"

export function PdfUploadModal({ open, onOpenChange, onPlanCreated }: PdfUploadModalProps) {
  const [step, setStep] = useState<Step>("upload")
  const [isDragging, setIsDragging] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [pdfName, setPdfName] = useState<string>("")
  const [settings, setSettings] = useState({
    startDate: "",
    dueDate: "",
    dailyHours: 2,
    excludeWeekends: false,
    excludedDates: [] as string[],
  })
  const [generatingProgress, setGeneratingProgress] = useState(0)
  const [generatedPlan, setGeneratedPlan] = useState<StudyPlan | null>(null)

  const isGenerateDisabled =
    !settings.startDate ||
    !settings.dueDate ||
    new Date(settings.dueDate) < new Date(settings.startDate)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file?.type === "application/pdf") {
      setUploadedFile(file)
      setPdfName(file.name.replace(".pdf", ""))
      setStep("settings")
    }
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setUploadedFile(file)
      setPdfName(file.name.replace(".pdf", ""))
      setStep("settings")
    }
  }

  const buildChaptersFromApi = (chapterInfoDtos: any[]): Chapter[] => {
    const chapters: Chapter[] = []

    chapterInfoDtos.forEach((chapterDto: any, index: number) => {
      const tasks = chapterDto.taskInfoDtos || []
      if (!tasks.length) return

      // 해당 챕터의 학습 날짜는 task들 중 가장 이른 날짜로 설정
      const earliestDate = tasks
        .map((t: any) => new Date(t.studyDate))
        .reduce((min: Date, d: Date) => (d < min ? d : min), new Date(tasks[0].studyDate))

      const scheduledDate = earliestDate.toISOString().split("T")[0]

      const sections = tasks.map((task: any, taskIndex: number) => ({
        id: `task-${task.taskId ?? `${index}-${taskIndex}`}`,
        title: task.taskTitle,
        content: "",
        keyPoints: [] as string[],
        definitions: [] as string[],
        completed: task.taskStatus === "DONE",
      }))

      chapters.push({
        id: `chapter-${chapterDto.chapterId ?? index}`,
        title: chapterDto.chapterTitle,
        sections,
        scheduledDate,
        completed: false,
      })
    })

    return chapters
  }

  const handleGenerate = async () => {
    if (!uploadedFile) {
      alert("먼저 PDF 파일을 업로드해주세요.")
      return
    }

    const requestPayload = {
      learningSourceTitle: pdfName || uploadedFile.name.replace(".pdf", ""),
      startDate: settings.startDate,
      endDate: settings.dueDate,
      // 서버 DTO가 int이므로 소수점은 반올림해서 보냄
      dailyStudyTime: Math.round(settings.dailyHours),
      excludeWeekend: settings.excludeWeekends,
    }

    try {
      setStep("generating")
      setGeneratingProgress(30)

      // 백엔드에 학습 스케줄 생성 요청 (멀티파트)
      const response: any = await createSchedule(uploadedFile, requestPayload)

      setGeneratingProgress(80)

      const chapterInfoDtos = response?.data?.chapterInfoDtos ?? []
      const chaptersFromApi = buildChaptersFromApi(chapterInfoDtos)

      if (!chaptersFromApi.length) {
        throw new Error("생성된 학습 계획이 없습니다.")
      }

      const generated: StudyPlan = {
        id: Date.now().toString(),
        pdfName: pdfName || "새 학습 자료",
        totalProgress: 0,
        dueDate: settings.dueDate,
        dailyHours: settings.dailyHours,
        excludeWeekends: settings.excludeWeekends,
        excludedDates: settings.excludedDates,
        chapters: chaptersFromApi,
      }

      setGeneratedPlan(generated)
      setGeneratingProgress(100)
      setStep("preview")
    } catch (error) {
      console.error("Failed to create schedule", error)
      alert("학습 스케줄 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.")
      setStep("settings")
      setGeneratingProgress(0)
      return
    }

  }

  const handleConfirm = () => {
    if (generatedPlan) {
      onPlanCreated(generatedPlan)
    }
    handleClose()
  }

  const handleClose = () => {
    setStep("upload")
    setUploadedFile(null)
    setPdfName("")
    setGeneratingProgress(0)
    setGeneratedPlan(null)
    setSettings({
      startDate: "",
      dueDate: "",
      dailyHours: 2,
      excludeWeekends: false,
      excludedDates: [],
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        {step === "upload" && (
          <>
            <DialogHeader>
              <DialogTitle>PDF 업로드</DialogTitle>
              <DialogDescription>
                학습할 PDF 파일을 업로드하세요. ZEUS AI가 분석하여 학습 계획을 생성합니다.
              </DialogDescription>
            </DialogHeader>
            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center transition-all",
                isDragging
                  ? "border-primary/50 bg-primary/10 shadow-primary-lg scale-105"
                  : "border-border hover:border-primary/30 hover:bg-secondary/50 hover-lift transition-smooth",
              )}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="w-14 h-14 rounded-full gradient-cyan-blue flex items-center justify-center mx-auto mb-4 shadow-primary animate-scale-in">
                <Upload className="h-6 w-6 text-white" />
              </div>
              <p className="text-sm text-muted-foreground mb-2">PDF 파일을 여기에 드래그하거나</p>
              <label className="cursor-pointer">
                <span className="text-sm text-primary hover:underline font-medium">파일 선택</span>
                <input type="file" accept=".pdf" className="hidden" onChange={handleFileSelect} />
              </label>
            </div>
          </>
        )}

        {step === "settings" && (
          <>
            <DialogHeader>
              <DialogTitle>학습 설정</DialogTitle>
              <DialogDescription>PDF 정보와 학습 일정을 설정하세요</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  학습자료 이름
                </Label>
                <div className="px-3 py-2 rounded-md border border-border bg-secondary/30 text-sm text-foreground">
                  {pdfName || "새 학습 자료"}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="startDate" className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  목표 시작일
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={settings.startDate}
                  onChange={(e) => setSettings({ ...settings, startDate: e.target.value })}
                  min={new Date().toISOString().split("T")[0]}
                  className="bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate" className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  목표 완료일
                </Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={settings.dueDate}
                  onChange={(e) => setSettings({ ...settings, dueDate: e.target.value })}
                  min={settings.startDate || new Date().toISOString().split("T")[0]}
                  className="bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dailyHours" className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  하루 학습 가능 시간
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="dailyHours"
                    type="number"
                    min={0.5}
                    max={8}
                    step={0.5}
                    value={settings.dailyHours}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        dailyHours: Number.parseFloat(e.target.value),
                      })
                    }
                    className="w-20 bg-background"
                  />
                  <span className="text-sm text-muted-foreground">시간</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="weekends" className="flex items-center gap-2 cursor-pointer text-sm">
                  주말 제외하기
                </Label>
                <Switch
                  id="weekends"
                  checked={settings.excludeWeekends}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      // 목표 시작일 주말 체크
                      if (settings.startDate) {
                        const start = new Date(settings.startDate + "T00:00:00")
                        const startDay = start.getDay() // 0: 일요일, 6: 토요일
                        if (startDay === 0 || startDay === 6) {
                          alert("목표 시작일에 주말이 포함되어있습니다.")
                          return
                        }
                      }
                      // 목표 완료일 주말 체크
                      if (settings.dueDate) {
                        const end = new Date(settings.dueDate + "T00:00:00")
                        const endDay = end.getDay()
                        if (endDay === 0 || endDay === 6) {
                          alert("목표 완료일에 주말이 포함되어있습니다.")
                          return
                        }
                      }
                    }
                    setSettings({ ...settings, excludeWeekends: checked })
                  }}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setStep("upload")}>
                이전
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={isGenerateDisabled}
                className="gap-2 btn-gradient text-white border-0 disabled:opacity-50"
              >
                <Zap className="h-4 w-4" />
                ZEUS AI로 계획 생성
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "generating" && (
          <>
            <DialogHeader>
              <DialogTitle>ZEUS AI가 분석 중입니다</DialogTitle>
              <DialogDescription>PDF를 분석하고 최적의 학습 계획을 생성하고 있습니다.</DialogDescription>
            </DialogHeader>
            <div className="py-8 space-y-4">
              <div className="flex items-center justify-center">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full gradient-purple-pink flex items-center justify-center shadow-primary-lg glow-primary">
                    <Zap className="h-8 w-8 text-white animate-pulse" />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">진행률</span>
                  <span className="font-medium text-foreground">{generatingProgress}%</span>
                </div>
                <Progress value={generatingProgress} className="h-1.5" />
              </div>
              <div className="text-center text-sm text-muted-foreground">
                {generatingProgress < 30 && "PDF 구조 분석 중..."}
                {generatingProgress >= 30 && generatingProgress < 60 && "챕터 및 섹션 추출 중..."}
                {generatingProgress >= 60 && generatingProgress < 90 && "학습 분량 계산 중..."}
                {generatingProgress >= 90 && "일정 배치 중..."}
              </div>
            </div>
          </>
        )}

        {step === "preview" && generatedPlan && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <div className="w-6 h-6 rounded icon-gradient flex items-center justify-center">
                  <Zap className="h-4 w-4 text-white" />
                </div>
                학습 계획이 생성되었습니다
              </DialogTitle>
              <DialogDescription>
                아래 계획을 확인하고 적용하세요. 적용 후에도 캘린더에서 직접 수정할 수 있습니다.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 max-h-[300px] overflow-y-auto">
              <div className="space-y-2">
                {generatedPlan.chapters.map((chapter) => (
                  <div
                    key={chapter.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border bg-card shadow-md glass-subtle hover:bg-secondary/30 hover-lift transition-smooth"
                  >
                    <div>
                      <p className="font-medium text-sm text-foreground">{chapter.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {chapter.sections.length}개 섹션
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-foreground">
                        {new Date(chapter.scheduledDate).toLocaleDateString("ko-KR", {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                취소
              </Button>
              <Button onClick={handleConfirm} className="btn-gradient text-white border-0">
                이대로 적용
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
