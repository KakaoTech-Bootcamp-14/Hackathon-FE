"use client"

import { useState, useEffect } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { ArrowLeft, Check, ChevronRight, Calendar, FileText, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { ChatBot } from "@/components/chatbot"
import { fetchTaskSummary, createTaskSummary, updateTaskCompletionStatus } from "@/lib/api/study"
import { fetchChapterProgress, type ProgressData } from "@/lib/api/progress"
import type { StudyPlan, Chapter, Section } from "@/app/page"

interface PdfDetailViewProps {
  plan: StudyPlan
  initialChapterId?: string | null
  onBack: () => void
  onUpdatePlan: (plan: StudyPlan) => void
}

// 좌측 사이드바 한 페이지에 보여줄 챕터 수
const CHAPTERS_PER_PAGE = 8

const parseTaskIdFromSectionId = (sectionId: string): number | null => {
  const match = sectionId.match(/task-(\d+)/)
  return match ? Number(match[1]) : null
}

const parseChapterIdFromChapterId = (chapterId: string): number | null => {
  const match = chapterId.match(/chapter-(\d+)/)
  return match ? Number(match[1]) : null
}

export function PdfDetailView({ plan, initialChapterId, onBack, onUpdatePlan }: PdfDetailViewProps) {
  // initialChapterId가 있으면 해당 챕터를 찾아서 초기값으로 설정, 없으면 첫 번째 챕터 사용
  const getInitialChapter = () => {
    if (initialChapterId) {
      const foundChapter = plan.chapters.find((ch) => ch.id === initialChapterId)
      if (foundChapter) return foundChapter
    }
    return plan.chapters[0]
  }

  const initialChapter = getInitialChapter()
  const [selectedChapter, setSelectedChapter] = useState<Chapter>(initialChapter)
  const [selectedSection, setSelectedSection] = useState<Section | null>(initialChapter?.sections[0] || null)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  const [showChatbot, setShowChatbot] = useState(false)
  const [chapterPage, setChapterPage] = useState(0)
  const [summaryContent, setSummaryContent] = useState<string>("")
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [summaryGenerating, setSummaryGenerating] = useState(false)
  const [chapterProgressMap, setChapterProgressMap] = useState<Map<string, ProgressData>>(new Map())

  const totalProgress = Math.round((plan.chapters.filter((c) => c.completed).length / plan.chapters.length) * 100)

  const totalChapterPages = Math.max(1, Math.ceil(plan.chapters.length / CHAPTERS_PER_PAGE))
  const currentPage = Math.min(chapterPage, totalChapterPages - 1)
  const visibleChapters = plan.chapters.slice(
    currentPage * CHAPTERS_PER_PAGE,
    (currentPage + 1) * CHAPTERS_PER_PAGE,
  )

  // 플랜이 바뀌면 챕터 페이지네이션 초기화
  useEffect(() => {
    setChapterPage(0)
  }, [plan.id])

  // initialChapterId가 변경되면 해당 챕터로 이동
  useEffect(() => {
    const newChapter = getInitialChapter()
    setSelectedChapter(newChapter)
    setSelectedSection(newChapter?.sections[0] || null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan.id, initialChapterId])

  // 챕터별 진도율 가져오기
  useEffect(() => {
    const fetchAllChapterProgress = async () => {
      const newProgressMap = new Map<string, ProgressData>()

      for (const chapter of plan.chapters) {
        const chapterId = parseChapterIdFromChapterId(chapter.id)
        if (chapterId !== null) {
          try {
            const response = await fetchChapterProgress(chapterId)
            newProgressMap.set(chapter.id, response.data)
          } catch (error) {
            console.error(`Failed to fetch progress for chapter ${chapter.id}`, error)
          }
        }
      }

      setChapterProgressMap(newProgressMap)
    }

    if (plan.chapters.length > 0) {
      void fetchAllChapterProgress()
    }
  }, [plan.chapters, plan.id])

  // 상세 페이지 진입 시, 현재 선택된 섹션에 대해 요약 조회
  useEffect(() => {
    if (selectedChapter && selectedSection) {
      void loadSummary(selectedChapter, selectedSection)
    }
    // plan이 바뀔 때만 동작하도록
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan.id])

  const toggleSectionExpand = (sectionId: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId)
    } else {
      newExpanded.add(sectionId)
    }
    setExpandedSections(newExpanded)
  }

  const handleToggleChapterComplete = (chapterId: string) => {
    const updatedChapters = plan.chapters.map((chapter) => {
      if (chapter.id !== chapterId) return chapter

      const nextCompleted = !chapter.completed
      // 챕터 토글 시, 하위 섹션들도 모두 같은 상태로 맞춰줌
      const updatedSections = chapter.sections.map((section) => ({
        ...section,
        completed: nextCompleted,
      }))

      return {
        ...chapter,
        completed: nextCompleted,
        sections: updatedSections,
      }
    })
    onUpdatePlan({ ...plan, chapters: updatedChapters })
  }

  const handleCompleteAllChapters = async () => {
    const updatedChapters = plan.chapters.map((chapter) => ({
      ...chapter,
      completed: true,
      sections: chapter.sections.map((section) => ({
        ...section,
        completed: true,
      })),
    }))
    onUpdatePlan({ ...plan, chapters: updatedChapters })

    // 백엔드에 모든 task를 DONE으로 업데이트
    try {
      const tasks = plan.chapters.flatMap((chapter) =>
        chapter.sections
          .map((section) => parseTaskIdFromSectionId(section.id))
          .filter((id): id is number => !!id),
      )

      await Promise.all(tasks.map((taskId) => updateTaskCompletionStatus(taskId, "DONE")))
    } catch (e) {
      console.error("Failed to mark all tasks as DONE", e)
    }
  }

  const handleResetAllChapters = async () => {
    const updatedChapters = plan.chapters.map((chapter) => ({
      ...chapter,
      completed: false,
      sections: chapter.sections.map((section) => ({
        ...section,
        completed: false,
      })),
    }))
    onUpdatePlan({ ...plan, chapters: updatedChapters })

    // 백엔드에 모든 task를 TODO로 업데이트
    try {
      const tasks = plan.chapters.flatMap((chapter) =>
        chapter.sections
          .map((section) => parseTaskIdFromSectionId(section.id))
          .filter((id): id is number => !!id),
      )

      await Promise.all(tasks.map((taskId) => updateTaskCompletionStatus(taskId, "TODO")))
    } catch (e) {
      console.error("Failed to reset all tasks to TODO", e)
    }
  }

  const handleToggleSectionComplete = async (chapterId: string, sectionId: string) => {
    const updatedChapters = plan.chapters.map((chapter) => {
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
    })
    onUpdatePlan({ ...plan, chapters: updatedChapters })

    const targetChapter = updatedChapters.find((c) => c.id === chapterId)
    const targetSection = targetChapter?.sections.find((s) => s.id === sectionId)
    const taskId = targetSection ? parseTaskIdFromSectionId(targetSection.id) : null

    if (selectedSection?.id === sectionId && targetSection) {
      setSelectedSection(targetSection)
    }

    // 백엔드에 해당 task의 완료 상태 반영
    if (taskId) {
      try {
        await updateTaskCompletionStatus(taskId, targetSection?.completed ? "DONE" : "TODO")
      } catch (e) {
        console.error("Failed to update task completion status", e)
      }
    }
  }

  const loadSummary = async (chapter: Chapter, section: Section) => {
    const learningSourceId = plan.learningSourceId
    const taskId = parseTaskIdFromSectionId(section.id)

    if (!learningSourceId || !taskId) {
      setSummaryContent("")
      return
    }

    try {
      setSummaryLoading(true)
      const res = await fetchTaskSummary(learningSourceId, taskId)
      setSummaryContent(res.data.content_md)
    } catch (e) {
      console.error("Failed to fetch summary", e)
      setSummaryContent("")
    } finally {
      setSummaryLoading(false)
    }
  }

  const handleGenerateSummary = async () => {
    if (!selectedSection) return

    const learningSourceId = plan.learningSourceId
    const taskId = parseTaskIdFromSectionId(selectedSection.id)

    if (!learningSourceId || !taskId) return

    try {
      setSummaryGenerating(true)
      const res = await createTaskSummary(learningSourceId, taskId)
      setSummaryContent(res.data.content_md)
    } catch (e) {
      console.error("Failed to generate summary", e)
      setSummaryContent("")
    } finally {
      setSummaryGenerating(false)
    }
  }

  const selectChapter = (chapter: Chapter) => {
    setSelectedChapter(chapter)
    if (chapter.sections.length > 0) {
      const firstSection = chapter.sections[0]
      setSelectedSection(firstSection)
      void loadSummary(chapter, firstSection)
    } else {
      setSelectedSection(null)
      setSummaryContent("")
    }
  }

  return (
    <div className="flex h-screen bg-background animate-page-enter">
      {/* 좌측 사이드바 - 목차 */}
      <div className="w-80 border-r border-border bg-card flex flex-col shadow-lg">
        <div className="p-4 border-b border-border">
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-2 mb-3 hover:bg-secondary">
            <ArrowLeft className="h-4 w-4" />
            돌아가기
          </Button>
          <h2 className="font-semibold text-lg truncate text-foreground">{plan.pdfName}</h2>
          <div className="mt-2 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">전체 진도</span>
              <span className="font-medium text-foreground">{totalProgress}%</span>
            </div>
            <Progress value={totalProgress} className="h-1.5" />
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2">
            {visibleChapters.map((chapter) => (
              <div key={chapter.id} className="mb-1">
                <button
                  onClick={() => selectChapter(chapter)}
                  className={cn(
                    "w-full text-left p-3 rounded-lg transition-all",
                    selectedChapter.id === chapter.id
                      ? "bg-primary/10 ring-2 ring-primary/30 shadow-primary"
                      : "hover:bg-secondary hover-lift transition-smooth",
                  )}
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0 pl-2">
                      <p
                        className={cn("font-medium text-sm", chapter.completed && "text-muted-foreground line-through")}
                      >
                        {chapter.title}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(chapter.scheduledDate).toLocaleDateString("ko-KR", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                        {chapterProgressMap.has(chapter.id) && (
                          <span className="font-medium text-primary">
                            {chapterProgressMap.get(chapter.id)?.progressRate}%
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight
                      className={cn(
                        "h-4 w-4 text-muted-foreground transition-transform",
                        selectedChapter.id === chapter.id && "rotate-90",
                      )}
                    />
                  </div>
                </button>

                {/* 섹션 목록 */}
                {selectedChapter.id === chapter.id && (
                  <div className="ml-6 mt-2 space-y-1">
                    {chapter.sections.map((section) => (
                      <button
                        key={section.id}
                        onClick={() => {
                          setSelectedSection(section)
                          void loadSummary(chapter, section)
                        }}
                        className={cn(
                          "w-full text-left p-2 rounded-md text-sm transition-all flex items-center gap-2",
                          selectedSection?.id === section.id
                            ? "bg-primary/8 text-primary font-medium"
                            : "text-muted-foreground hover:text-foreground hover:bg-secondary",
                        )}
                      >
                        <div
                          className={cn(
                            "w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all",
                            section.completed ? "icon-gradient border-transparent" : "border-border",
                          )}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleToggleSectionComplete(chapter.id, section.id)
                          }}
                        >
                          {section.completed && <Check className="h-2.5 w-2.5 text-white" />}
                        </div>
                        <span className={cn("truncate", section.completed && "line-through")}>{section.title}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        {totalChapterPages > 1 && (
          <div className="border-t border-border px-3 py-2 flex items-center justify-between text-xs text-muted-foreground">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 0}
              onClick={() => setChapterPage((p) => Math.max(0, p - 1))}
              className="h-7 px-2"
            >
              이전
            </Button>
            <span>
              {currentPage + 1} / {totalChapterPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalChapterPages - 1}
              onClick={() => setChapterPage((p) => Math.min(totalChapterPages - 1, p + 1))}
              className="h-7 px-2"
            >
              다음
            </Button>
          </div>
        )}
      </div>

      {/* 우측 메인 콘텐츠 */}
      <div className="flex-1 flex flex-col bg-background">
        <header className="border-b border-border bg-card px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={selectedChapter.completed ? "default" : "secondary"}
                  className={cn(
                    selectedChapter.completed
                      ? "bg-gradient-to-r from-primary/90 to-primary/70 text-white border-0"
                      : "bg-secondary text-secondary-foreground",
                  )}
                >
                  {selectedChapter.completed ? "완료" : "진행중"}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {new Date(selectedChapter.scheduledDate).toLocaleDateString("ko-KR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}{" "}
                  예정
                </span>
              </div>
              <h1 className="text-2xl font-bold mt-2 text-foreground">{selectedChapter.title}</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => handleToggleChapterComplete(selectedChapter.id)}
                variant={selectedChapter.completed ? "outline" : "default"}
                className={cn("gap-2", !selectedChapter.completed && "btn-gradient text-white border-0")}
              >
                <Check className="h-4 w-4" />
                {selectedChapter.completed ? "완료 취소" : "챕터 완료"}
              </Button>
              <Button
                onClick={handleCompleteAllChapters}
                variant="outline"
                className="gap-2 text-xs"
              >
                <Check className="h-4 w-4" />
                전체 완료
              </Button>
              {plan.chapters.every((c) => c.completed) && (
                <Button
                  onClick={handleResetAllChapters}
                  variant="outline"
                  className="gap-2 text-xs text-muted-foreground"
                >
                  전체 완료 취소
                </Button>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 p-6 overflow-y-scroll">
          {selectedSection ? (
            <div className="max-w-6xl mx-auto space-y-6">
              {/* 섹션 제목 */}
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-foreground">{selectedSection.title}</h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                {/* 학습 요약 카드 */}
                <Card className="border border-border bg-card shadow-lg glass-subtle hover-lift">
                  <CardHeader className="pb-1">
                    <CardTitle className="text-base flex items-center gap-2">
                      <div className="w-5 h-5 rounded icon-gradient flex items-center justify-center shadow-sm">
                        <FileText className="h-3 w-3 text-white" />
                      </div>
                      학습 요약
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="min-h-[260px] flex flex-col">
                    {summaryContent ? (
                      <div className="markdown-body">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {summaryContent.replace(/\n/g, "  \n")}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                          아직 생성된 요약이 없습니다. 요약을 생성해서 학습을 시작해 보세요.
                        </p>
                        <Button
                          size="sm"
                          className="mt-1 btn-gradient text-white border-0 gap-2 hover-lift disabled:opacity-60"
                          onClick={handleGenerateSummary}
                          disabled={summaryGenerating}
                        >
                          <Zap className="h-4 w-4" />
                          요약 생성하기
                        </Button>
                        {summaryGenerating && (
                          <p className="text-xs text-muted-foreground">요약을 생성하는 중입니다...</p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* QnA 챗봇 카드 */}
                <Card className="border border-border bg-card shadow-lg glass-subtle hover-lift">
                  <CardHeader className="pb-1">
                    <CardTitle className="text-base flex items-center gap-2">
                      <div className="w-5 h-5 rounded icon-gradient flex items-center justify-center shadow-sm">
                        <Zap className="h-3 w-3 text-white" />
                      </div>
                      QnA봇
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ChatBot
                      pdfName={plan.pdfName}
                      currentChapter={selectedChapter.title}
                      currentSection={selectedSection?.title}
                      learningSourceId={plan.learningSourceId}
                      currentUserId={1}
                    embedded
                    onClose={() => {
                      /* 상세 페이지에서는 닫기 시에도 카드 유지 */
                    }}
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">섹션을 선택하세요</div>
          )}
        </div>
      </div>
    </div>
  )
}
