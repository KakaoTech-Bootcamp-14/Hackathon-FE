"use client"

import { useState } from "react"
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  Calendar,
  BookOpen,
  Lightbulb,
  FileText,
  Zap,
  Menu,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { ChatBot } from "@/components/chatbot"
import type { StudyPlan, Chapter, Section } from "@/app/page"

interface PdfDetailViewProps {
  plan: StudyPlan
  onBack: () => void
  onUpdatePlan: (plan: StudyPlan) => void
}

export function PdfDetailView({ plan, onBack, onUpdatePlan }: PdfDetailViewProps) {
  const [selectedChapter, setSelectedChapter] = useState<Chapter>(plan.chapters[0])
  const [selectedSection, setSelectedSection] = useState<Section | null>(plan.chapters[0]?.sections[0] || null)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  const [showChatbot, setShowChatbot] = useState(false)
  const [tocOpen, setTocOpen] = useState(false)

  const totalProgress = Math.round((plan.chapters.filter((c) => c.completed).length / plan.chapters.length) * 100)

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
    const updatedChapters = plan.chapters.map((chapter) =>
      chapter.id === chapterId ? { ...chapter, completed: !chapter.completed } : chapter,
    )
    onUpdatePlan({ ...plan, chapters: updatedChapters })
  }

  const handleToggleSectionComplete = (chapterId: string, sectionId: string) => {
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

    if (selectedSection?.id === sectionId) {
      const updatedSection = updatedChapters.find((c) => c.id === chapterId)?.sections.find((s) => s.id === sectionId)
      if (updatedSection) {
        setSelectedSection(updatedSection)
      }
    }
  }

  const selectChapter = (chapter: Chapter) => {
    setSelectedChapter(chapter)
    if (chapter.sections.length > 0) {
      setSelectedSection(chapter.sections[0])
    }
    setTocOpen(false) // 모바일에서 선택 후 TOC 닫기
  }

  const TocContent = () => (
    <ScrollArea className="flex-1">
      <div className="p-2">
        {plan.chapters.map((chapter) => (
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
                <div
                  className={cn(
                    "mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
                    chapter.completed ? "icon-gradient border-transparent" : "border-border hover:border-primary/40",
                  )}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleToggleChapterComplete(chapter.id)
                  }}
                >
                  {chapter.completed && <Check className="h-3 w-3 text-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn("font-medium text-sm", chapter.completed && "text-muted-foreground line-through")}>
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
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {chapter.estimatedMinutes}분
                    </span>
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
              <div className="ml-6 mt-1 space-y-0.5">
                {chapter.sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => {
                      setSelectedSection(section)
                      setTocOpen(false)
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
  )

  return (
    <div className="flex h-screen bg-background animate-page-enter">
      {/* 데스크톱 좌측 사이드바 - 목차 */}
      <div className="hidden md:flex md:w-80 border-r border-border bg-card flex-col shadow-lg">
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
            <Progress value={totalProgress} className="h-1.5 rounded-full" />
          </div>
        </div>

        <TocContent />
      </div>

      {/* 메인 콘텐츠 */}
      <div className="flex-1 flex flex-col bg-background">
        <header className="border-b border-border bg-card px-3 md:px-6 py-3 md:py-4">
          <div className="flex items-center justify-between">
            {/* 모바일 TOC 버튼 */}
            <div className="flex items-center gap-2">
              <Sheet open={tocOpen} onOpenChange={setTocOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden h-8 w-8 hover:bg-secondary">
                    <Menu className="h-5 w-5 text-muted-foreground" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px] p-0 bg-background">
                  <SheetHeader className="border-b border-border p-4">
                    <SheetTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-primary" />
                      <span className="font-semibold">목차</span>
                    </SheetTitle>
                    <div className="mt-2 space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">전체 진도</span>
                        <span className="font-medium text-foreground">{totalProgress}%</span>
                      </div>
                      <Progress value={totalProgress} className="h-1.5 rounded-full" />
                    </div>
                  </SheetHeader>
                  <TocContent />
                </SheetContent>
              </Sheet>

              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="hidden md:flex gap-2 hover:bg-secondary rounded-full"
              >
                <ArrowLeft className="h-4 w-4" />
                돌아가기
              </Button>
            </div>

            <div className="flex-1 min-w-0 mx-2 md:mx-0">
              <div className="flex items-center gap-2">
                <Badge
                  variant={selectedChapter.completed ? "default" : "secondary"}
                  className={cn(
                    "text-xs",
                    selectedChapter.completed
                      ? "bg-gradient-to-r from-primary/90 to-primary/70 text-white border-0"
                      : "bg-secondary text-secondary-foreground",
                  )}
                >
                  {selectedChapter.completed ? "완료" : "진행중"}
                </Badge>
                <span className="text-xs md:text-sm text-muted-foreground hidden sm:inline">
                  {new Date(selectedChapter.scheduledDate).toLocaleDateString("ko-KR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}{" "}
                  예정
                </span>
              </div>
              <h1 className="text-lg md:text-2xl font-bold mt-1 md:mt-2 text-foreground truncate">
                {selectedChapter.title}
              </h1>
            </div>
            <Button
              onClick={() => handleToggleChapterComplete(selectedChapter.id)}
              variant={selectedChapter.completed ? "outline" : "default"}
              size="sm"
              className={cn(
                "gap-1 md:gap-2 rounded-full shrink-0",
                !selectedChapter.completed && "btn-gradient text-white border-0",
              )}
            >
              <Check className="h-4 w-4" />
              <span className="hidden sm:inline">{selectedChapter.completed ? "완료 취소" : "챕터 완료"}</span>
              <span className="sm:hidden">완료</span>
            </Button>
          </div>
        </header>

        <ScrollArea className="flex-1 p-3 md:p-6">
          {selectedSection ? (
            <div className="max-w-3xl mx-auto space-y-6">
              {/* 섹션 제목 */}
              <div>
                <h2 className="text-xl font-semibold text-foreground">{selectedSection.title}</h2>
                <p className="text-muted-foreground mt-2 leading-relaxed">{selectedSection.content}</p>
              </div>

              {/* 핵심 개념 */}
              <Card className="border border-border bg-card shadow-lg glass-subtle hover-lift">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <div className="w-5 h-5 rounded icon-gradient flex items-center justify-center shadow-sm">
                      <Lightbulb className="h-3 w-3 text-white" />
                    </div>
                    핵심 개념
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {selectedSection.keyPoints.map((point, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <div className="w-1.5 h-1.5 rounded-full icon-gradient mt-2 shrink-0" />
                        <span className="text-foreground">{point}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* 주요 정의 */}
              <Card className="border border-border bg-card shadow-lg glass-subtle hover-lift">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-accent" />
                    주요 정의
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {selectedSection.definitions.map((def, index) => (
                      <Collapsible key={index}>
                        <CollapsibleTrigger
                          onClick={() => toggleSectionExpand(`def-${selectedSection.id}-${index}`)}
                          className="flex items-center justify-between w-full p-3 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors"
                        >
                          <span className="text-sm font-medium text-foreground">{def.split(":")[0]}</span>
                          <ChevronDown
                            className={cn(
                              "h-4 w-4 text-muted-foreground transition-transform",
                              expandedSections.has(`def-${selectedSection.id}-${index}`) && "rotate-180",
                            )}
                          />
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="p-3 text-sm text-muted-foreground border-l-2 border-primary/40 ml-4 mt-2">
                            {def.split(":")[1] || def}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* 학습 포인트 */}
              <Card className="border border-border bg-card shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    학습 포인트
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-secondary/50 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      이 섹션에서는 <strong className="text-foreground">{selectedSection.keyPoints[0]}</strong>의 개념을
                      이해하는 것이 중요합니다. 특히{" "}
                      <strong className="text-foreground">{selectedSection.definitions[0]?.split(":")[0]}</strong>의
                      정의를 명확히 이해하고, 실제 사례에 적용할 수 있어야 합니다.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">섹션을 선택하세요</div>
          )}
        </ScrollArea>
      </div>

      {/* 챗봇 플로팅 버튼 */}
      <Button
        onClick={() => setShowChatbot(!showChatbot)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl glow-primary z-50 btn-gradient border-0 hover-lift animate-scale-in"
        size="icon"
        title="ZEUS AI 학습 도우미"
      >
        <Zap className="h-6 w-6 text-white" />
      </Button>

      {/* 챗봇 패널 */}
      {showChatbot && (
        <ChatBot
          pdfName={plan.pdfName}
          currentChapter={selectedChapter.title}
          currentSection={selectedSection?.title}
          onClose={() => setShowChatbot(false)}
        />
      )}
    </div>
  )
}
