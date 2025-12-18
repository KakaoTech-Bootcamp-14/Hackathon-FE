"use client"

import type React from "react"

import { useState, useMemo } from "react"
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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
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
import type { StudyPlan, Chapter } from "@/app/page"

interface HomeCalendarProps {
  studyPlans: StudyPlan[]
  onAddPdf: () => void
  onViewPdf: (plan: StudyPlan) => void
  onUpdatePlans: (plans: StudyPlan[]) => void
  onDeletePlan: (planId: string) => void
}

type ViewMode = "month" | "week"

export function HomeCalendar({ studyPlans, onAddPdf, onViewPdf, onUpdatePlans, onDeletePlan }: HomeCalendarProps) {
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

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const stats = useMemo(() => {
    const totalChapters = studyPlans.reduce((acc, plan) => acc + plan.chapters.length, 0)
    const completedChapters = studyPlans.reduce((acc, plan) => acc + plan.chapters.filter((c) => c.completed).length, 0)
    const overallProgress = totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0
    const remainingDays =
      studyPlans.length > 0
        ? Math.max(0, Math.ceil((new Date(studyPlans[0].dueDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)))
        : 0
    return { totalChapters, completedChapters, overallProgress, remainingDays }
  }, [studyPlans, today])

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
    const dateStr = date.toISOString().split("T")[0]
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
    const dateStr = date.toISOString().split("T")[0]
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

    const dateStr = targetDate.toISOString().split("T")[0]
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

  const handleReplan = () => {
    setShowReplanModal(false)
  }

  const toggleSectionComplete = (planId: string, chapterId: string, sectionId: string) => {
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
                variant="outline"
                size="sm"
                className="gap-2 text-primary border-primary/25 hover:bg-primary/5 hover:border-primary/40 bg-transparent shadow-sm hover-lift transition-smooth rounded-full"
                onClick={() => setShowReplanModal(true)}
              >
                <Zap className="h-4 w-4" />
                ZEUS AI 재배치
              </Button>
              <Button size="sm" className="gap-2 btn-gradient text-white border-0 shadow-md hover-lift rounded-full" onClick={onAddPdf}>
                <Plus className="h-4 w-4" />
                학습자료 추가
              </Button>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
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
                    <CollapsibleTrigger asChild>
                      <button className="flex items-center gap-3 text-left w-full">
                        <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 shrink-0 shadow-sm">
                          <BookOpen className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-bold text-foreground truncate">{plan.pdfName}</h3>
                          <p className="text-xs text-muted-foreground">{chapters.length}개 챕터</p>
                        </div>
                        <ChevronDown
                          className={cn(
                            "h-5 w-5 text-muted-foreground transition-transform duration-200",
                            expandedPlans.has(planId) && "rotate-180",
                          )}
                        />
                      </button>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
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
                              <button
                                onClick={() => toggleChapterExpand(chapter.id)}
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
                                  <div className="flex items-center gap-3 text-xs text-slate-500">
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {chapter.estimatedMinutes}분
                                    </span>
                                    <span>·</span>
                                    <span>
                                      {chapter.sections.filter((s) => s.completed).length}/{chapter.sections.length}{" "}
                                      완료
                                    </span>
                                  </div>
                                </div>

                                {/* Plus Button */}
                                <div className="shrink-0">
                                  <div
                                    className={cn(
                                      "h-8 w-8 rounded-full transition-all duration-200",
                                      "bg-slate-200/50 border border-slate-300/50",
                                      "flex items-center justify-center",
                                      "group-hover/chapter:bg-indigo-100/60 group-hover/chapter:border-indigo-300/60",
                                      expandedChapters.has(chapter.id) && "bg-primary/15 border-primary/50 rotate-45",
                                    )}
                                  >
                                    <Plus
                                      className={cn(
                                        "h-4 w-4 transition-colors",
                                        expandedChapters.has(chapter.id) ? "text-primary" : "text-slate-500",
                                      )}
                                    />
                                  </div>
                                </div>
                              </button>
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

                        {/* 상세 보기 버튼 */}
                        <div className="pt-2">
                          <button
                            onClick={() => onViewPdf(plan)}
                            className="w-full py-2.5 px-4 rounded-full text-xs text-slate-500 hover:text-primary transition-all flex items-center justify-center gap-1.5 border border-transparent hover:border-indigo-200/50 hover:bg-indigo-50/30 hover:shadow-sm"
                          >
                            상세 보기
                            <ChevronRight className="h-3.5 w-3.5" />
                          </button>
                        </div>
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
      <Dialog open={showReplanModal} onOpenChange={setShowReplanModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              ZEUS AI 일정 재배치
            </DialogTitle>
            <DialogDescription>현재 진도와 남은 기간을 분석하여 최적의 학습 일정을 다시 계산합니다.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="p-4 bg-secondary rounded-lg space-y-2">
              <p className="text-sm">
                <span className="text-muted-foreground">현재 진도:</span>{" "}
                <span className="font-medium">{stats.overallProgress}%</span>
              </p>
              <p className="text-sm">
                <span className="text-muted-foreground">남은 챕터:</span>{" "}
                <span className="font-medium">{stats.totalChapters - stats.completedChapters}개</span>
              </p>
              <p className="text-sm">
                <span className="text-muted-foreground">남은 기간:</span>{" "}
                <span className="font-medium">D-{stats.remainingDays}</span>
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReplanModal(false)}>
              취소
            </Button>
            <Button onClick={handleReplan} className="gap-2 btn-gradient text-white border-0">
              <Zap className="h-4 w-4" />
              재배치 실행
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
