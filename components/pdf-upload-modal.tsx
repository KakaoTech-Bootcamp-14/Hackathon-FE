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
    dueDate: "",
    dailyHours: 2,
    includeWeekends: false,
    excludedDates: [] as string[],
  })
  const [generatingProgress, setGeneratingProgress] = useState(0)
  const [generatedPlan, setGeneratedPlan] = useState<StudyPlan | null>(null)

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

  const handleGenerate = async () => {
    setStep("generating")

    for (let i = 0; i <= 100; i += 10) {
      await new Promise((resolve) => setTimeout(resolve, 200))
      setGeneratingProgress(i)
    }

    const mockPlan: StudyPlan = {
      id: Date.now().toString(),
      pdfName: pdfName || "새 학습 자료",
      totalProgress: 0,
      dueDate: settings.dueDate,
      dailyHours: settings.dailyHours,
      includeWeekends: settings.includeWeekends,
      excludedDates: settings.excludedDates,
      chapters: generateMockChapters(settings.dueDate),
    }

    setGeneratedPlan(mockPlan)
    setStep("preview")
  }

  const generateMockChapters = (dueDate: string): Chapter[] => {
    const chapters: Chapter[] = []
    const startDate = new Date()
    const chapterTitles = ["기초 개념 이해", "핵심 이론 학습", "응용 사례 분석", "실전 문제 풀이", "종합 정리"]

    chapterTitles.forEach((title, index) => {
      const scheduledDate = new Date(startDate)
      scheduledDate.setDate(startDate.getDate() + index + 1)

      chapters.push({
        id: `new-c${index + 1}`,
        title: `Chapter ${index + 1}. ${title}`,
        scheduledDate: scheduledDate.toISOString().split("T")[0],
        completed: false,
        estimatedMinutes: 45 + Math.floor(Math.random() * 30),
        sections: [
          {
            id: `new-s${index * 2 + 1}`,
            title: `${index + 1}.1 개요`,
            content: "이 섹션에서는 기본 개념을 다룹니다.",
            keyPoints: ["핵심 포인트 1", "핵심 포인트 2"],
            definitions: ["정의 1", "정의 2"],
            completed: false,
          },
          {
            id: `new-s${index * 2 + 2}`,
            title: `${index + 1}.2 심화 내용`,
            content: "심화 내용을 학습합니다.",
            keyPoints: ["심화 포인트 1"],
            definitions: ["심화 정의 1"],
            completed: false,
          },
        ],
      })
    })

    return chapters
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
      dueDate: "",
      dailyHours: 2,
      includeWeekends: false,
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
                <Label htmlFor="dueDate" className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  목표 완료일
                </Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={settings.dueDate}
                  onChange={(e) => setSettings({ ...settings, dueDate: e.target.value })}
                  min={new Date().toISOString().split("T")[0]}
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
                  주말에도 학습하기
                </Label>
                <Switch
                  id="weekends"
                  checked={settings.includeWeekends}
                  onCheckedChange={(checked) => setSettings({ ...settings, includeWeekends: checked })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setStep("upload")}>
                이전
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={!settings.dueDate}
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
                        {chapter.sections.length}개 섹션 · {chapter.estimatedMinutes}분
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
