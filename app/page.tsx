"use client"

import { useState, useEffect } from "react"
import { SplashScreen } from "@/components/splash-screen"
import { LoginPage } from "@/components/login-page"
import { SignUpPage } from "@/components/signup-page"
import { HomeCalendar } from "@/components/home-calendar"
import { PdfUploadModal } from "@/components/pdf-upload-modal"
import { PdfDetailView } from "@/components/pdf-detail-view"
import { CelebrationPage } from "@/components/celebration-page"
import { IncompletePage } from "@/components/incomplete-page"
import { fetchHomeData, type HomeData } from "@/lib/api/home"

export type StudyPlan = {
  id: string
  learningSourceId?: number
  pdfName: string
  chapters: Chapter[]
  dueDate: string
  dailyHours: number
  /** true이면 주말을 제외하고 학습 (서버로도 이렇게 내려감) */
  excludeWeekends: boolean
  excludedDates: string[]
  totalProgress: number
}

export type Chapter = {
  id: string
  title: string
  sections: Section[]
  scheduledDate: string
  completed: boolean
}

export type Section = {
  id: string
  title: string
  content: string
  keyPoints: string[]
  definitions: string[]
  completed: boolean
}

type AppView = "splash" | "login" | "signup" | "home" | "pdf-detail" | "celebration" | "incomplete"

const SESSION_KEY = "zeus-auth-session"

function mapHomeDataToStudyPlans(data: HomeData): StudyPlan[] {
  const plans: StudyPlan[] = []

  data.learningSourceResponseDtos.forEach((source, sourceIndex) => {
    const chapters: Chapter[] = []

    source.chapterInfoDtos.forEach((chapterDto, chapterIndex) => {
      const tasks = chapterDto.taskInfoDtos || []
      if (!tasks.length) return

      // 해당 챕터의 학습 날짜는 task들 중 가장 이른 날짜로 설정
      const earliestDate = tasks
        .map((t) => new Date(t.studyDate))
        .reduce((min: Date, d: Date) => (d < min ? d : min), new Date(tasks[0].studyDate))

      const scheduledDate = earliestDate.toISOString().split("T")[0]

      const sections: Section[] = tasks.map((task, taskIndex) => ({
        id: `task-${task.taskId ?? `${chapterIndex}-${taskIndex}`}`,
        title: task.taskTitle,
        content: "",
        keyPoints: [],
        definitions: [],
        completed: task.taskStatus === "DONE",
      }))

      chapters.push({
        id: `chapter-${chapterDto.chapterId ?? chapterIndex}`,
        title: chapterDto.chapterTitle,
        sections,
        scheduledDate,
        completed: false,
      })
    })

    const allDates = chapters.map((ch) => new Date(ch.scheduledDate))
    const maxDate = allDates.length > 0 ? new Date(Math.max(...allDates.map((d) => d.getTime()))) : new Date()
    const dueDateStr = maxDate.toISOString().split("T")[0]

    plans.push({
      id: `plan-${sourceIndex + 1}`,
      learningSourceId: source.learningSourceId,
      pdfName: source.learningSourceTitle,
      chapters,
      dueDate: dueDateStr,
      dailyHours: 2,
      excludeWeekends: false,
      excludedDates: [],
      totalProgress: 0,
    })
  })

  return plans
}

export default function Home() {
  const [currentView, setCurrentView] = useState<AppView>("splash")
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<StudyPlan | null>(null)
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null)
  const [studyPlans, setStudyPlans] = useState<StudyPlan[]>([])
  const [homeLoaded, setHomeLoaded] = useState(false)
  const [homeError, setHomeError] = useState<string | null>(null)

  // 최초 마운트 시 저장된 세션 여부에 따라 초기 화면 결정
  useEffect(() => {
    if (typeof window === "undefined") return
    const hasSession = sessionStorage.getItem(SESSION_KEY) === "true"
    if (hasSession) {
      setCurrentView("home")
    } else {
      // 세션이 없으면 모든 상태 초기화
      setSelectedPlan(null)
      setStudyPlans([])
      setHomeLoaded(false)
      setHomeError(null)
      setShowUploadModal(false)
    }
  }, [])

  // 스플래시 → 로그인/홈 전환
  useEffect(() => {
    if (currentView === "splash") {
      const timer = setTimeout(() => {
        const hasSession = typeof window !== "undefined" && sessionStorage.getItem(SESSION_KEY) === "true"
        if (!hasSession) {
          // 로그인 화면으로 갈 때 이전 데이터 초기화
          setSelectedPlan(null)
          setStudyPlans([])
          setHomeLoaded(false)
          setHomeError(null)
          setShowUploadModal(false)
        }
        setCurrentView(hasSession ? "home" : "login")
      }, 2500)
      return () => clearTimeout(timer)
    }
  }, [currentView])

  // 로그인 화면으로 전환될 때 이전 데이터 초기화
  useEffect(() => {
    if (currentView === "login") {
      setSelectedPlan(null)
      setStudyPlans([])
      setHomeLoaded(false)
      setHomeError(null)
      setShowUploadModal(false)
    }
  }, [currentView])

  useEffect(() => {
    if (currentView !== "home" || homeLoaded) return

    const load = async () => {
      try {
        // 이전 데이터 완전히 초기화 후 새로 불러오기
        setStudyPlans([])
        setHomeError(null)
        
        const res = await fetchHomeData()
        const plans = mapHomeDataToStudyPlans(res.data)
        setStudyPlans(plans)
        setHomeError(null)
      } catch (error: any) {
        console.error("Failed to load home data", error)
        setHomeError("홈 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.")
        setStudyPlans([])
      } finally {
        setHomeLoaded(true)
      }
    }

    load()
  }, [currentView, homeLoaded])

  const handlePlanCreated = async (newPlan: StudyPlan) => {
    setStudyPlans([...studyPlans, newPlan])
    setShowUploadModal(false)

    // PDF 생성 후 홈 데이터를 다시 불러와서 실제 learningSourceId 반영
    try {
      const res = await fetchHomeData()
      const plans = mapHomeDataToStudyPlans(res.data)
      setStudyPlans(plans)
    } catch (error: any) {
      console.error("Failed to reload home data after plan creation", error)
    }
  }

  const handlePlanUpdate = (updatedPlan: StudyPlan) => {
    // Calculate progress based on completed chapters
    const totalChapters = updatedPlan.chapters.length
    const completedChapters = updatedPlan.chapters.filter((ch) => ch.completed).length
    const progress = totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0

    // Update plan with calculated progress
    const planWithProgress = { ...updatedPlan, totalProgress: progress }

    setStudyPlans(studyPlans.map((p) => (p.id === planWithProgress.id ? planWithProgress : p)))
    setSelectedPlan(planWithProgress)

    // Check if plan is 100% complete and show celebration
    if (progress === 100 && completedChapters === totalChapters) {
      setCurrentView("celebration")
    } else {
      // Check if deadline has passed and plan is incomplete
      const dueDate = new Date(planWithProgress.dueDate)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      dueDate.setHours(0, 0, 0, 0)

      if (today > dueDate && progress < 100) {
        setCurrentView("incomplete")
      }
    }
  }

  const handleViewPdf = (plan: StudyPlan, chapterId?: string) => {
    setSelectedPlan(plan)
    setSelectedChapterId(chapterId || null)
    setCurrentView("pdf-detail")
  }

  const handleDeletePlan = (planId: string) => {
    setStudyPlans(studyPlans.filter((p) => p.id !== planId))
    if (selectedPlan?.id === planId) {
      setSelectedPlan(null)
      setCurrentView("home")
    }
  }

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(SESSION_KEY)
    }
    // 모든 상태 초기화
    setSelectedPlan(null)
    setStudyPlans([])
    setHomeLoaded(false)
    setHomeError(null)
    setShowUploadModal(false)
    setCurrentView("login")
  }

  const handleLogin = () => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(SESSION_KEY, "true")
    }
    // 로그인 시 이전 사용자 데이터 완전히 초기화
    setSelectedPlan(null)
    setStudyPlans([])
    setHomeLoaded(false)
    setHomeError(null)
    setShowUploadModal(false)
    setCurrentView("home")
  }

  const handleSignUp = () => {
    // 회원가입 후에는 세션을 만들지 않고 로그인 화면으로 이동
    setCurrentView("login")
  }

  if (currentView === "splash") {
    return <SplashScreen />
  }

  if (currentView === "login") {
    return (
      <LoginPage onLogin={handleLogin} onCreateAccount={() => setCurrentView("signup")} />
    )
  }

  if (currentView === "signup") {
    return <SignUpPage onSignUp={handleSignUp} onBackToLogin={() => setCurrentView("login")} />
  }

  if (currentView === "celebration" && selectedPlan) {
    return <CelebrationPage plan={selectedPlan} onBackToHome={() => setCurrentView("home")} />
  }

  if (currentView === "incomplete" && selectedPlan) {
    return (
      <IncompletePage
        plan={selectedPlan}
        onBackToHome={() => setCurrentView("home")}
        onRetry={() => setCurrentView("pdf-detail")}
      />
    )
  }

  return (
    <>
      {currentView === "home" ? (
        <HomeCalendar
          studyPlans={studyPlans}
          onAddPdf={() => setShowUploadModal(true)}
          onViewPdf={handleViewPdf}
          onUpdatePlans={setStudyPlans}
          onDeletePlan={handleDeletePlan}
          onLogout={handleLogout}
        />
      ) : selectedPlan ? (
        <PdfDetailView
          plan={selectedPlan}
          initialChapterId={selectedChapterId}
          onBack={() => setCurrentView("home")}
          onUpdatePlan={handlePlanUpdate}
        />
      ) : null}

      <PdfUploadModal open={showUploadModal} onOpenChange={setShowUploadModal} onPlanCreated={handlePlanCreated} />
    </>
  )
}
