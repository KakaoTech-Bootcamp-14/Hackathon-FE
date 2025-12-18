"use client"

import type React from "react"

import { useState, useMemo, useEffect } from "react"
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  BookOpen,
  Calendar,
  GripVertical,
  Check,
  Zap,
  Trash2,
  Menu,
  Home,
  ChevronDown,
  Lock,
  Pencil,
  X,
  LogOut,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"
import { reCreateSchedule } from "@/lib/api/schedule"
import { updateTaskCompletionStatus } from "@/lib/api/study"
import { fetchLearningSourceProgress, type ProgressData } from "@/lib/api/progress"
import { ChatBot } from "@/components/chatbot"
import type { StudyPlan, Chapter } from "@/app/page"

interface HomeCalendarProps {
  studyPlans: StudyPlan[]
  onAddPdf: () => void
  onViewPdf: (plan: StudyPlan, chapterId?: string) => void
  onUpdatePlans: (plans: StudyPlan[]) => void
  onDeletePlan: (planId: string) => void
  onLogout: () => void
}

type ViewMode = "month" | "week"

// 로컬 타임존 기준 YYYY-MM-DD 문자열 생성
const getLocalDateKey = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function HomeCalendar({ studyPlans, onAddPdf, onViewPdf, onUpdatePlans, onDeletePlan, onLogout }: HomeCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<ViewMode>("month")
  const [showReplanModal, setShowReplanModal] = useState(false)
  const [draggedChapter, setDraggedChapter] = useState<{
    planId: string
    chapterId: string
  } | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [deleteConfirmPlan, setDeleteConfirmPlan] = useState<StudyPlan | null>(null)
  const [expandedPlans, setExpandedPlans] = useState<Set<string>>(new Set(studyPlans.map((p) => p.id)))
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set())
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null)
  const [editingPlanName, setEditingPlanName] = useState<string>("")
  const [replanTargetPlan, setReplanTargetPlan] = useState<StudyPlan | null>(null)
  const [replanLoading, setReplanLoading] = useState(false)
  const [replanSettings, setReplanSettings] = useState({
    startDate: "",
    dueDate: "",
    dailyHours: 2,
    excludeWeekends: false,
  })
  const [qnaPlan, setQnaPlan] = useState<StudyPlan | null>(null)
  const [progressMap, setProgressMap] = useState<Map<string, ProgressData>>(new Map())

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // 서버에서 각 학습 자료의 진도율 가져오기
  useEffect(() => {
    const fetchAllProgress = async () => {
      const newProgressMap = new Map<string, ProgressData>()

      for (const plan of studyPlans) {
        if (plan.learningSourceId) {
          try {
            const response = await fetchLearningSourceProgress(plan.learningSourceId)
            newProgressMap.set(plan.id, response.data)
          } catch (error) {
            console.error(`Failed to fetch progress for plan ${plan.id}`, error)
          }
        }
      }

      setProgressMap(newProgressMap)
    }

    if (studyPlans.length > 0) {
      void fetchAllProgress()
    }
  }, [studyPlans])

  const stats = useMemo(() => {
    let totalTasks = 0
    let doneTasks = 0

    // 서버 진도율이 있으면 사용, 없으면 클라이언트에서 계산
    progressMap.forEach((progress) => {
      totalTasks += progress.totalTaskCount
      doneTasks += progress.doneTaskCount
    })

    // 진도율이 없으면 기존 방식으로 계산
    if (totalTasks === 0) {
      const totalChapters = studyPlans.reduce((acc, plan) => acc + plan.chapters.length, 0)
      const completedChapters = studyPlans.reduce((acc, plan) => acc + plan.chapters.filter((c) => c.completed).length, 0)
      const overallProgress = totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0
      const remainingDays =
        studyPlans.length > 0
          ? Math.max(0, Math.ceil((new Date(studyPlans[0].dueDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)))
          : 0
      return { totalChapters, completedChapters: completedChapters, overallProgress, remainingDays }
    }

    const overallProgress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0
    const remainingDays =
      studyPlans.length > 0
        ? Math.max(0, Math.ceil((new Date(studyPlans[0].dueDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)))
        : 0

    return {
      totalChapters: totalTasks,
      completedChapters: doneTasks,
      overallProgress,
      remainingDays
    }
  }, [studyPlans, today, progressMap])

  // 자료(title) 기준으로는 항상 펼쳐진 상태 유지
  useEffect(() => {
    setExpandedPlans(new Set(studyPlans.map((p) => p.id)))
  }, [studyPlans])

  const startEditingPlanName = (planId: string, currentName: string) => {
    setEditingPlanId(planId)
    setEditingPlanName(currentName)
  }

  const saveEditingPlanName = () => {
    if (editingPlanId && editingPlanName.trim()) {
      const updatedPlans = studyPlans.map((plan) =>
        plan.id === editingPlanId ? { ...plan, pdfName: editingPlanName.trim() } : plan,
      )
      onUpdatePlans(updatedPlans)
    }
    setEditingPlanId(null)
    setEditingPlanName("")
  }

  const cancelEditingPlanName = () => {
    setEditingPlanId(null)
    setEditingPlanName("")
  }

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())

    const days: Date[] = []
    const current = new Date(startDate)
    while (current <= lastDay || days.length % 7 !== 0) {
      days.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }
    return days
  }, [currentDate])

  const weekDays = useMemo(() => {
    const startOfWeek = new Date(currentDate)
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay())
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(startOfWeek)
      day.setDate(startOfWeek.getDate() + i)
      return day
    })
  }, [currentDate])

  const getChaptersForDate = (date: Date) => {
    const dateStr = getLocalDateKey(date)
    const results: { plan: StudyPlan; chapter: Chapter }[] = []
    studyPlans.forEach((plan) => {
      plan.chapters.forEach((chapter) => {
        if (chapter.scheduledDate === dateStr) {
          results.push({ plan, chapter })
        }
      })
    })
    return results
  }

  const getHierarchicalTasksForDate = (date: Date) => {
    const dateStr = getLocalDateKey(date)
    const planMap = new Map<string, { plan: StudyPlan; chapters: Chapter[] }>()

    studyPlans.forEach((plan) => {
      const matchingChapters = plan.chapters.filter((c) => c.scheduledDate === dateStr)
      if (matchingChapters.length > 0) {
        planMap.set(plan.id, { plan, chapters: matchingChapters })
      }
    })

    return planMap
  }

  const selectedDateTasks = getHierarchicalTasksForDate(selectedDate)

  const hasItemsOnDate = (date: Date) => {
    const chapters = getChaptersForDate(date)
    return chapters.length > 0
  }

  // 기본적으로 조회된 날짜의 챕터들은 모두 펼쳐진 상태로 두기
  useEffect(() => {
    const initialExpanded = new Set<string>()
    const tasksForDate = getHierarchicalTasksForDate(selectedDate)
    tasksForDate.forEach(({ chapters }) => {
      chapters.forEach((chapter) => initialExpanded.add(chapter.id))
    })
    setExpandedChapters(initialExpanded)
  }, [selectedDate, studyPlans])

  const handlePrevious = () => {
    const newDate = new Date(currentDate)
    if (viewMode === "month") {
      newDate.setMonth(newDate.getMonth() - 1)
    } else {
      newDate.setDate(newDate.getDate() - 7)
    }
    setCurrentDate(newDate)
  }

  const handleNext = () => {
    const newDate = new Date(currentDate)
    if (viewMode === "month") {
      newDate.setMonth(newDate.getMonth() + 1)
    } else {
      newDate.setDate(newDate.getDate() + 7)
    }
    setCurrentDate(newDate)
  }

  const handleDragStart = (planId: string, chapterId: string) => {
    setDraggedChapter({ planId, chapterId })
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (targetDate: Date) => {
    if (!draggedChapter) return

    const dateStr = getLocalDateKey(targetDate)
    const updatedPlans = studyPlans.map((plan) => {
      if (plan.id === draggedChapter.planId) {
        return {
          ...plan,
          chapters: plan.chapters.map((chapter) =>
            chapter.id === draggedChapter.chapterId ? { ...chapter, scheduledDate: dateStr } : chapter,
          ),
        }
      }
      return plan
    })
    onUpdatePlans(updatedPlans)
    setDraggedChapter(null)
  }

  const buildChaptersFromApi = (chapterInfoDtos: any[]): Chapter[] => {
    const chapters: Chapter[] = []

    chapterInfoDtos.forEach((chapterDto: any, index: number) => {
      const tasks = chapterDto.taskInfoDtos || []
      if (!tasks.length) return

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

  const handleReplan = async () => {
    if (!replanTargetPlan || !replanTargetPlan.learningSourceId) {
      alert("학습 자료 ID가 없습니다.")
      return
    }

    try {
      setReplanLoading(true)
      const request = {
        learningSourceId: replanTargetPlan.learningSourceId,
        learningSourceTitle: replanTargetPlan.pdfName,
        startDate: replanSettings.startDate,
        endDate: replanSettings.dueDate,
        dailyStudyTime: Math.round(replanSettings.dailyHours),
        excludeWeekend: replanSettings.excludeWeekends,
      }

      const response: any = await reCreateSchedule(request)
      const chapterInfoDtos = response?.data?.chapterInfoDtos ?? []
      const chaptersFromApi = buildChaptersFromApi(chapterInfoDtos)

      if (!chaptersFromApi.length) {
        alert("재생성된 학습 스케줄이 없습니다.")
        return
      }

      const updatedPlans = studyPlans.map((plan) =>
        plan.id === replanTargetPlan.id
          ? {
              ...plan,
              chapters: chaptersFromApi,
              dueDate: replanSettings.dueDate || plan.dueDate,
              dailyHours: replanSettings.dailyHours,
              excludeWeekends: replanSettings.excludeWeekends,
            }
          : plan,
      )

      onUpdatePlans(updatedPlans)
    } catch (error) {
      console.error("Failed to re-create schedule", error)
      alert("스케줄 재생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.")
    } finally {
      setReplanLoading(false)
      setShowReplanModal(false)
    }
  }

  const toggleSectionComplete = async (planId: string, chapterId: string, sectionId: string) => {
    const updatedPlans = studyPlans.map((plan) => {
      if (plan.id === planId) {
        return {
          ...plan,
          chapters: plan.chapters.map((chapter) => {
            if (chapter.id === chapterId) {
              const updatedSections = chapter.sections.map((section) =>
                section.id === sectionId ? { ...section, completed: !section.completed } : section,
              )
              const allSectionsComplete = updatedSections.every((s) => s.completed)
              return {
                ...chapter,
                sections: updatedSections,
                completed: allSectionsComplete,
              }
            }
            return chapter
          }),
        }
      }
      return plan
    })

    onUpdatePlans(updatedPlans)

    // 방금 토글한 섹션과 taskId 계산
    const targetPlan = updatedPlans.find((p) => p.id === planId)
    const targetChapter = targetPlan?.chapters.find((c) => c.id === chapterId)
    const targetSection = targetChapter?.sections.find((s) => s.id === sectionId)
    const taskIdMatch = targetSection?.id.match(/task-(\d+)/)
    const taskId = taskIdMatch ? Number(taskIdMatch[1]) : null

    if (taskId && targetSection) {
      try {
        await updateTaskCompletionStatus(taskId, targetSection.completed ? "DONE" : "TODO")
      } catch (e) {
        console.error("Failed to update task completion status from home calendar", e)
      }
    }
  }

  const handleConfirmDelete = () => {
    if (deleteConfirmPlan) {
      onDeletePlan(deleteConfirmPlan.id)
      setDeleteConfirmPlan(null)
    }
  }

  const togglePlanExpand = (planId: string) => {
    const newExpanded = new Set(expandedPlans)
    if (newExpanded.has(planId)) {
      newExpanded.delete(planId)
    } else {
      newExpanded.add(planId)
    }
    setExpandedPlans(newExpanded)
  }

  const toggleChapterExpand = (chapterId: string) => {
    const newExpanded = new Set(expandedChapters)
    if (newExpanded.has(chapterId)) {
      newExpanded.delete(chapterId)
    } else {
      newExpanded.add(chapterId)
    }
    setExpandedChapters(newExpanded)
  }

  const formatDateHeader = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth() + 1
    if (viewMode === "month") {
      return `${year}년 ${month}월`
    }
    const weekStart = weekDays[0]
    const weekEnd = weekDays[6]
    return `${weekStart.getMonth() + 1}월 ${weekStart.getDate()}일 - ${weekEnd.getMonth() + 1}월 ${weekEnd.getDate()}일`
  }

  const formatSelectedDate = () => {
    return selectedDate.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
    })
  }

  const isToday = (date: Date) => {
    return date.toDateString() === today.toDateString()
  }

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth()
  }

  const isSelected = (date: Date) => {
    return date.toDateString() === selectedDate.toDateString()
  }

  const getChapterProgress = (chapter: Chapter) => {
    if (chapter.sections.length === 0) return chapter.completed ? 100 : 0
    const completedSections = chapter.sections.filter((s) => s.completed).length
    return Math.round((completedSections / chapter.sections.length) * 100)
  }

  const getTotalTaskCount = () => {
    let count = 0
    selectedDateTasks.forEach(({ chapters }) => {
      chapters.forEach((chapter) => {
        count += chapter.sections.length
      })
    })
    return count
  }

  return (
    <div className="flex h-screen bg-background animate-page-enter">
      <div className="w-[420px] border-r border-border bg-card flex flex-col shadow-lg rounded-r-3xl">
        <header className="border-b border-border px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-secondary">
                    <Menu className="h-5 w-5 text-muted-foreground" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px] p-0 bg-background">
                  <SheetHeader className="border-b border-border p-4">
                    <SheetTitle className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg icon-gradient shadow-primary">
                        <Zap className="h-4 w-4 text-white" />
                      </div>
                      <span className="font-semibold">ZEUS AI</span>
                    </SheetTitle>
                  </SheetHeader>

                  <div className="flex flex-col h-[calc(100%-73px)]">
                    <div className="p-3 border-b border-border">
                      <Button
                        variant="ghost"
                        className="w-full justify-start gap-3 h-10 hover:bg-secondary"
                        onClick={() => setSidebarOpen(false)}
                      >
                        <Home className="h-4 w-4 text-muted-foreground" />
                        <span>홈</span>
                      </Button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-muted-foreground px-2">내 학습자료</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 hover:bg-primary/10"
                          onClick={() => {
                            setSidebarOpen(false)
                            onAddPdf()
                          }}
                        >
                          <Plus className="h-3.5 w-3.5 text-primary" />
                        </Button>
                      </div>

                      {studyPlans.length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-sm text-muted-foreground">아직 학습자료가 없습니다</p>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {studyPlans.map((plan) => (
                            <div key={plan.id} className="group relative">
                              <button
                                onClick={() => {
                                  setSidebarOpen(false)
                                  onViewPdf(plan)
                                }}
                                className="w-full text-left p-2.5 rounded-md hover:bg-secondary transition-colors flex items-center gap-2"
                              >
                                <BookOpen className="h-4 w-4 text-muted-foreground shrink-0" />
                                <span className="text-sm truncate flex-1">{plan.pdfName}</span>
                              </button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setDeleteConfirmPlan(plan)
                                }}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="border-t border-border p-3">
                      <Button
                        className="w-full justify-start gap-3 h-10 btn-gradient text-white border-0"
                        onClick={() => {
                          setSidebarOpen(false)
                          onAddPdf()
                        }}
                      >
                        <Plus className="h-4 w-4" />
                        <span>새 학습자료 추가</span>
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>

              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full icon-gradient shadow-md">
                  <Zap className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="font-semibold text-foreground">ZEUS AI</span>
              </div>
            </div>

            <div className="flex items-center gap-1 bg-secondary rounded-full p-0.5">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-7 px-2.5 text-xs font-medium transition-all rounded-full",
                  viewMode === "month"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
                onClick={() => setViewMode("month")}
              >
                월간
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-7 px-2.5 text-xs font-medium transition-all rounded-full",
                  viewMode === "week"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
                onClick={() => setViewMode("week")}
              >
                주간
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/5 gap-1"
              onClick={onLogout}
            >
              <LogOut className="h-3.5 w-3.5" />
              로그아웃
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={handlePrevious} className="h-8 w-8 hover:bg-secondary">
              <ChevronLeft className="h-4 w-4 text-muted-foreground" />
            </Button>
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-foreground">{formatDateHeader()}</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const today = new Date()
                  setCurrentDate(today)
                  setSelectedDate(today)
                }}
                className="h-6 px-2.5 text-xs text-primary hover:bg-primary/10 hover-lift transition-smooth rounded-full"
              >
                오늘
              </Button>
            </div>
            <Button variant="ghost" size="icon" onClick={handleNext} className="h-8 w-8 hover:bg-secondary">
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        </header>

        {viewMode === "month" ? (
          <div className="flex-1 p-3">
            <div className="grid grid-cols-7 mb-2">
              {["일", "월", "화", "수", "목", "금", "토"].map((day, i) => (
                <div
                  key={day}
                  className={cn(
                    "text-center text-xs font-medium py-2",
                    i === 0 ? "text-destructive/70" : i === 6 ? "text-primary/70" : "text-muted-foreground",
                  )}
                >
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((date, index) => {
                const hasItems = hasItemsOnDate(date)
                return (
                  <button
                    key={index}
                    onClick={() => setSelectedDate(date)}
                    onDragOver={handleDragOver}
                    onDrop={() => handleDrop(date)}
                    className={cn(
                      "aspect-square rounded-2xl flex flex-col items-center justify-center text-sm transition-all relative",
                      !isCurrentMonth(date) && "text-muted-foreground/40",
                      isCurrentMonth(date) &&
                        !isToday(date) &&
                        !isSelected(date) &&
                        "text-foreground hover:bg-secondary/60 hover-scale transition-smooth",
                      isToday(date) && !isSelected(date) && "bg-primary/10 text-primary font-semibold shadow-md ring-2 ring-primary/20",
                      isSelected(date) && "bg-primary/15 ring-2 ring-primary/50 font-semibold shadow-md scale-105 transition-all",
                    )}
                  >
                    <span>{date.getDate()}</span>
                    {hasItems && <div className="absolute bottom-1.5 w-1.5 h-1.5 rounded-full bg-primary shadow-sm" />}
                  </button>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="flex-1 p-3">
            <div className="grid grid-cols-7 gap-2">
              {weekDays.map((date, index) => {
                const chapters = getChaptersForDate(date)
                return (
                  <div
                    key={index}
                    onClick={() => setSelectedDate(date)}
                    onDragOver={handleDragOver}
                    onDrop={() => handleDrop(date)}
                    className={cn(
                      "rounded-2xl p-2 cursor-pointer transition-all min-h-[120px] border",
                      isToday(date) ? "border-primary/25 bg-primary/5 shadow-sm" : "border-transparent hover:bg-secondary/60",
                      isSelected(date) && "ring-2 ring-primary/40 bg-primary/10 shadow-md",
                    )}
                  >
                    <div
                      className={cn(
                        "text-center mb-2",
                        index === 0 ? "text-destructive/70" : index === 6 ? "text-primary/70" : "",
                      )}
                    >
                      <div className="text-xs text-muted-foreground">
                        {["일", "월", "화", "수", "목", "금", "토"][index]}
                      </div>
                      <div className={cn("text-lg font-semibold", isToday(date) && "text-primary")}>
                        {date.getDate()}
                      </div>
                    </div>
                    <div className="space-y-1">
                      {chapters.slice(0, 2).map(({ chapter }) => (
                        <div
                          key={chapter.id}
                          className={cn(
                            "text-xs p-1.5 rounded-xl truncate shadow-sm",
                            chapter.completed
                              ? "bg-accent/10 text-muted-foreground line-through"
                              : "bg-primary/10 text-foreground",
                          )}
                        >
                          {chapter.title}
                        </div>
                      ))}
                      {chapters.length > 2 && (
                        <div className="text-xs text-muted-foreground text-center">+{chapters.length - 2}</div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {studyPlans.length > 0 && (
          <div className="p-3 border-t border-border bg-gradient-to-b from-transparent to-secondary/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">전체 진도</span>
              <span className="text-sm font-semibold text-foreground">{stats.overallProgress}%</span>
            </div>
            <Progress value={stats.overallProgress} className="h-2 rounded-full" />
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>
                {stats.completedChapters}/{stats.totalChapters} 챕터
              </span>
              {stats.remainingDays > 0 && <span>D-{stats.remainingDays}</span>}
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col bg-background">
        <header className="border-b border-border px-6 py-4 bg-card rounded-br-3xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-[10px] font-normal text-muted-foreground/80">{formatSelectedDate()}</h1>
              <p className="text-xs text-muted-foreground mt-0.5">{getTotalTaskCount()}개의 학습 항목</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                className="gap-2 btn-gradient text-white border-0 shadow-md hover-lift rounded-full"
                onClick={onAddPdf}
              >
                <Plus className="h-4 w-4" />
                학습자료 추가
              </Button>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-scroll p-6">
          {selectedDateTasks.size === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 rounded-full gradient-purple-pink flex items-center justify-center mb-4 shadow-lg animate-scale-in">
                <Calendar className="h-7 w-7 text-white" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">이 날에 학습 일정이 없습니다</h3>
              <p className="text-sm text-muted-foreground mb-4">PDF를 업로드하면 ZEUS AI가 학습 계획을 생성합니다</p>
              <Button onClick={onAddPdf} className="gap-2 btn-gradient text-white border-0 shadow-lg hover-lift rounded-full">
                <Plus className="h-4 w-4" />
                학습자료 추가
              </Button>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-6">
              {Array.from(selectedDateTasks.entries()).map(([planId, { plan, chapters }]) => (
                <Collapsible
                  key={planId}
                  open={expandedPlans.has(planId)}
                  onOpenChange={() => togglePlanExpand(planId)}
                >
                  <div className="space-y-3">
                    {/* 대제목: PDF 이름 */}
                    <div className="flex items-center justify-between group">
                      {editingPlanId === planId ? (
                        <div className="flex-1 flex items-center gap-2">
                          <Input
                            value={editingPlanName}
                            onChange={(e) => setEditingPlanName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveEditingPlanName()
                              if (e.key === "Escape") cancelEditingPlanName()
                            }}
                            className="text-lg font-bold bg-secondary/50 border-primary/30 focus-visible:ring-primary/30"
                            autoFocus
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={saveEditingPlanName}
                            className="h-8 w-8 text-primary hover:bg-primary/10"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={cancelEditingPlanName}
                            className="h-8 w-8 text-muted-foreground hover:bg-secondary"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <CollapsibleTrigger asChild>
                            <button className="flex-1 flex items-center gap-3 text-left">
                              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 shrink-0 shadow-sm">
                                <BookOpen className="h-4 w-4 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-bold text-foreground truncate">{plan.pdfName}</h3>
                                <div className="flex items-center gap-2">
                                  <p className="text-xs text-muted-foreground">{chapters.length}개 챕터</p>
                                  {progressMap.has(plan.id) && (
                                    <>
                                      <span className="text-xs text-muted-foreground">•</span>
                                      <p className="text-xs font-medium text-primary">
                                        {progressMap.get(plan.id)?.progressRate}%
                                      </p>
                                    </>
                                  )}
                                </div>
                              </div>
                              <ChevronDown
                                className={cn(
                                  "h-5 w-5 text-muted-foreground transition-transform duration-200",
                                  expandedPlans.has(planId) && "rotate-180",
                                )}
                              />
                            </button>
                          </CollapsibleTrigger>
                          <Button
                            variant="outline"
                            size="sm"
                            className="ml-1 h-8 px-3 text-[11px] gap-1 border-slate-200 text-slate-600 hover:bg-secondary hover:border-primary/30"
                            onClick={() => {
                              setQnaPlan(plan)
                              // QnA봇을 열 때 해당 자료 블록이 접혀 있으면 자동으로 펼쳐줌
                              setExpandedPlans((prev) => {
                                const next = new Set(prev)
                                next.add(planId)
                                return next
                              })
                            }}
                          >
                            <Zap className="h-3 w-3 text-primary" />
                            AI 학습 Agent
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="ml-1 h-8 px-3 text-[11px] gap-1 border-primary/30 text-primary hover:bg-primary/5 hover:border-primary/50"
                            onClick={() => {
                              setReplanTargetPlan(plan)
                              // 기존 플랜 정보로 초기값 세팅
                              const allDates = plan.chapters.map((ch) => new Date(ch.scheduledDate))
                              const minDate =
                                allDates.length > 0
                                  ? new Date(Math.min(...allDates.map((d) => d.getTime())))
                                  : new Date()
                              const maxDate =
                                allDates.length > 0
                                  ? new Date(Math.max(...allDates.map((d) => d.getTime())))
                                  : new Date(plan.dueDate)

                              setReplanSettings({
                                startDate: minDate.toISOString().split("T")[0],
                                dueDate: maxDate.toISOString().split("T")[0],
                                dailyHours: plan.dailyHours,
                                excludeWeekends: plan.excludeWeekends,
                              })
                              setShowReplanModal(true)
                            }}
                          >
                            <Zap className="h-3 w-3" />
                            스케줄 재생성
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => startEditingPlanName(planId, plan.pdfName)}
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity ml-1 hover:bg-secondary"
                          >
                            <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                        </>
                      )}
                    </div>

                    <CollapsibleContent>
                      {/* 홈 QnA봇: 자료 제목 아래, 챕터/태스크 목록 위에 표시 */}
                      {qnaPlan?.id === plan.id && (
                        <div className="ml-3 pl-6 pt-2">
                          <div className="rounded-2xl border border-border bg-card shadow-lg glass-subtle overflow-hidden">
                            <ChatBot
                              pdfName={plan.pdfName}
                              currentChapter={chapters[0]?.title || plan.pdfName}
                              currentSection={chapters[0]?.sections[0]?.title}
                              learningSourceId={plan.learningSourceId}
                              currentUserId={1}
                              embedded
                              onClose={() => setQnaPlan(null)}
                            />
                          </div>
                        </div>
                      )}

                      <div className="space-y-3 ml-3 pl-6 pt-2">
                        {chapters.map((chapter, chapterIndex) => (
                          <div key={chapter.id} className="space-y-2">
                            {/* 중제목: 챕터 Pill */}
                            <div
                              className={cn(
                                "group/chapter rounded-full glass-subtle transition-all duration-200",
                                "bg-gradient-to-r from-primary/5 via-primary/8 to-primary/5",
                                "border border-primary/15 shadow-md",
                                "hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10 hover-lift",
                                expandedChapters.has(chapter.id) && "border-primary/30 shadow-lg shadow-primary/8",
                              )}
                              draggable
                              onDragStart={() => handleDragStart(plan.id, chapter.id)}
                            >
                              <div
                                role="button"
                                tabIndex={0}
                                onClick={() => toggleChapterExpand(chapter.id)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault()
                                    toggleChapterExpand(chapter.id)
                                  }
                                }}
                                className="w-full px-5 py-3.5 flex items-center gap-4"
                              >
                                {/* Lock Icon */}
                                <div className="shrink-0">
                                  <Lock className="h-4 w-4 text-slate-400" />
                                </div>

                                {/* 챕터 제목 및 정보 */}
                                <div className="flex-1 min-w-0 text-left">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span
                                      className={cn(
                                        "font-semibold text-sm text-slate-900/90",
                                        chapter.completed && "line-through opacity-50",
                                      )}
                                    >
                                      {chapter.title}
                                    </span>
                                    {chapter.completed && (
                                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 border border-emerald-500/25 font-medium">
                                        완료
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <span>
                                      {chapter.sections.filter((s) => s.completed).length}/{chapter.sections.length}{" "}
                                      완료
                                    </span>
                                  </div>
                                </div>

                                {/* 오른쪽 액션 버튼: 챕터 상세 보기(>) */}
                                <div className="shrink-0 flex items-center">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      onViewPdf(plan, chapter.id)
                                    }}
                                    className="h-8 w-8 rounded-full border border-slate-300/60 bg-white/70 flex items-center justify-center hover:bg-indigo-50 hover:border-indigo-300 transition-all shadow-sm"
                                  >
                                    <ChevronRight className="h-4 w-4 text-slate-500" />
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* 소제목: 섹션들 (챕터가 확장되었을 때만 표시) */}
                            {expandedChapters.has(chapter.id) && (
                              <div className="space-y-2 pl-3">
                                {chapter.sections.map((section) => (
                                  <div
                                    key={section.id}
                                    onClick={() => toggleSectionComplete(plan.id, chapter.id, section.id)}
                                    className={cn(
                                      "group/section flex items-center gap-3 px-4 py-2.5 rounded-full",
                                      "bg-white/40 border border-slate-200/60 backdrop-blur-sm shadow-sm",
                                      "hover:bg-indigo-50/50 hover:border-indigo-200/70 hover:shadow-md",
                                      "cursor-pointer transition-all duration-150",
                                    )}
                                  >
                                    <div
                                      className={cn(
                                        "w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
                                        section.completed
                                          ? "bg-gradient-to-br from-primary to-primary/90 border-primary"
                                          : "border-slate-300 group-hover/section:border-indigo-400",
                                      )}
                                    >
                                      {section.completed && <Check className="h-2.5 w-2.5 text-white" />}
                                    </div>
                                    <span
                                      className={cn(
                                        "text-xs flex-1 font-medium",
                                        section.completed ? "text-slate-400 line-through" : "text-slate-700",
                                      )}
                                    >
                                      {section.title}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Replan Modal */}
      <Dialog
        open={showReplanModal}
        onOpenChange={(open) => {
          if (!replanLoading) {
            setShowReplanModal(open)
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              ZEUS AI 스케줄 재생성
            </DialogTitle>
            <DialogDescription>학습 기간과 하루 학습 시간을 다시 설정하고 스케줄을 재생성합니다.</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="replan-startDate" className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                목표 시작일
              </Label>
              <Input
                id="replan-startDate"
                type="date"
                value={replanSettings.startDate}
                onChange={(e) =>
                  setReplanSettings((prev) => ({
                    ...prev,
                    startDate: e.target.value,
                    // 완료일 최소값 보장을 위해 필요 시 여기서도 조정 가능
                  }))
                }
                min={new Date().toISOString().split("T")[0]}
                className="bg-background"
                disabled={replanLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="replan-dueDate" className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                목표 완료일
              </Label>
              <Input
                id="replan-dueDate"
                type="date"
                value={replanSettings.dueDate}
                onChange={(e) =>
                  setReplanSettings((prev) => ({
                    ...prev,
                    dueDate: e.target.value,
                  }))
                }
                min={replanSettings.startDate || new Date().toISOString().split("T")[0]}
                className="bg-background"
                disabled={replanLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="replan-dailyHours" className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                하루 학습 가능 시간
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="replan-dailyHours"
                  type="number"
                  min={0.5}
                  max={8}
                  step={0.5}
                  value={replanSettings.dailyHours}
                  onChange={(e) =>
                    setReplanSettings((prev) => ({
                      ...prev,
                      dailyHours: Number.parseFloat(e.target.value || "0") || 0,
                    }))
                  }
                  className="w-20 bg-background"
                  disabled={replanLoading}
                />
                <span className="text-sm text-muted-foreground">시간</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="replan-weekends" className="flex items-center gap-2 cursor-pointer text-sm">
                주말 제외하기
              </Label>
              <Switch
                id="replan-weekends"
                checked={replanSettings.excludeWeekends}
                onCheckedChange={(checked) => {
                  if (checked) {
                    // 목표 시작일 주말 체크
                    if (replanSettings.startDate) {
                      const start = new Date(replanSettings.startDate + "T00:00:00")
                      const startDay = start.getDay() // 0: 일요일, 6: 토요일
                      if (startDay === 0 || startDay === 6) {
                        alert("목표 시작일에 주말이 포함되어있습니다.")
                        return
                      }
                    }
                    // 목표 완료일 주말 체크
                    if (replanSettings.dueDate) {
                      const end = new Date(replanSettings.dueDate + "T00:00:00")
                      const endDay = end.getDay()
                      if (endDay === 0 || endDay === 6) {
                        alert("목표 완료일에 주말이 포함되어있습니다.")
                        return
                      }
                    }
                  }
                  setReplanSettings((prev) => ({ ...prev, excludeWeekends: checked }))
                }}
                disabled={replanLoading}
              />
            </div>

            {replanLoading && (
              <div className="flex flex-col items-center justify-center pt-2 space-y-2">
                <div className="w-10 h-10 rounded-full gradient-purple-pink flex items-center justify-center animate-pulse shadow-md">
                  <Zap className="h-5 w-5 text-white" />
                </div>
                <p className="text-xs text-muted-foreground">스케줄 재생성 중...</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowReplanModal(false)}
              disabled={replanLoading}
            >
              취소
            </Button>
            <Button
              onClick={handleReplan}
              disabled={
                replanLoading ||
                !replanSettings.startDate ||
                !replanSettings.dueDate ||
                new Date(replanSettings.dueDate) < new Date(replanSettings.startDate)
              }
              className="gap-2 btn-gradient text-white border-0 disabled:opacity-50"
            >
              <Zap className="h-4 w-4" />
              {replanLoading ? "재생성 중..." : "ZEUS AI로 스케줄 재생성"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirmPlan} onOpenChange={() => setDeleteConfirmPlan(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>학습자료 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleteConfirmPlan?.pdfName}"을(를) 삭제하시겠습니까?
              <br />
              모든 챕터, 학습 계획, 진도 기록이 함께 삭제됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
