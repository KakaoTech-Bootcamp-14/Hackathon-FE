"use client"

import { useState, useEffect } from "react"
import { SplashScreen } from "@/components/splash-screen"
import { LoginPage } from "@/components/login-page"
import { SignUpPage } from "@/components/signup-page"
import { HomeCalendar } from "@/components/home-calendar"
import { PdfUploadModal } from "@/components/pdf-upload-modal"
import { PdfDetailView } from "@/components/pdf-detail-view"
import { CelebrationPage } from "@/components/celebration-page"

export type StudyPlan = {
  id: string
  pdfName: string
  chapters: Chapter[]
  dueDate: string
  dailyHours: number
  includeWeekends: boolean
  excludedDates: string[]
  totalProgress: number
}

export type Chapter = {
  id: string
  title: string
  sections: Section[]
  scheduledDate: string
  completed: boolean
  estimatedMinutes: number
}

export type Section = {
  id: string
  title: string
  content: string
  keyPoints: string[]
  definitions: string[]
  completed: boolean
}

type AppView = "splash" | "login" | "signup" | "home" | "pdf-detail" | "celebration"

export default function Home() {
  const [currentView, setCurrentView] = useState<AppView>("splash")
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<StudyPlan | null>(null)
  const [studyPlans, setStudyPlans] = useState<StudyPlan[]>([
    {
      id: "1",
      pdfName: "머신러닝 기초",
      totalProgress: 35,
      dueDate: "2025-01-15",
      dailyHours: 2,
      includeWeekends: false,
      excludedDates: [],
      chapters: [
        {
          id: "c1",
          title: "Chapter 1. 머신러닝 개요",
          scheduledDate: "2024-12-17",
          completed: true,
          estimatedMinutes: 45,
          sections: [
            {
              id: "s1",
              title: "1.1 머신러닝이란?",
              content:
                "머신러닝은 컴퓨터가 명시적으로 프로그래밍되지 않고도 데이터로부터 학습하여 예측이나 결정을 내릴 수 있게 하는 인공지능의 한 분야입니다.",
              keyPoints: ["데이터 기반 학습", "패턴 인식", "예측 모델링"],
              definitions: ["지도학습: 레이블이 있는 데이터로 학습", "비지도학습: 레이블 없이 패턴 발견"],
              completed: true,
            },
            {
              id: "s2",
              title: "1.2 머신러닝의 종류",
              content: "머신러닝은 크게 지도학습, 비지도학습, 강화학습으로 나뉩니다.",
              keyPoints: ["지도학습 vs 비지도학습", "강화학습의 특징"],
              definitions: ["강화학습: 보상을 통해 행동 학습"],
              completed: true,
            },
          ],
        },
        {
          id: "c2",
          title: "Chapter 2. 선형 회귀",
          scheduledDate: "2024-12-18",
          completed: false,
          estimatedMinutes: 60,
          sections: [
            {
              id: "s3",
              title: "2.1 선형 회귀 기초",
              content:
                "선형 회귀는 독립 변수와 종속 변수 간의 선형 관계를 모델링하는 가장 기본적인 예측 알고리즘입니다.",
              keyPoints: ["최소제곱법", "가설 함수", "비용 함수"],
              definitions: ["가설 함수: h(x) = θ₀ + θ₁x", "비용 함수: J(θ) = 1/2m Σ(h(x) - y)²"],
              completed: false,
            },
            {
              id: "s4",
              title: "2.2 경사 하강법",
              content:
                "경사 하강법은 비용 함수를 최소화하기 위해 파라미터를 반복적으로 조정하는 최적화 알고리즘입니다.",
              keyPoints: ["학습률의 중요성", "수렴 조건", "배치 vs 확률적 경사 하강법"],
              definitions: ["학습률(α): 파라미터 업데이트 크기 조절"],
              completed: false,
            },
          ],
        },
        {
          id: "c3",
          title: "Chapter 3. 분류 알고리즘",
          scheduledDate: "2024-12-19",
          completed: false,
          estimatedMinutes: 75,
          sections: [
            {
              id: "s5",
              title: "3.1 로지스틱 회귀",
              content: "로지스틱 회귀는 이진 분류 문제를 해결하기 위한 알고리즘으로, 시그모이드 함수를 사용합니다.",
              keyPoints: ["시그모이드 함수", "결정 경계", "다중 클래스 분류"],
              definitions: ["시그모이드: σ(z) = 1/(1+e⁻ᶻ)"],
              completed: false,
            },
          ],
        },
        {
          id: "c4",
          title: "Chapter 4. 신경망 기초",
          scheduledDate: "2024-12-20",
          completed: false,
          estimatedMinutes: 90,
          sections: [
            {
              id: "s6",
              title: "4.1 퍼셉트론",
              content:
                "퍼셉트론은 인공 신경망의 가장 기본적인 형태로, 입력과 가중치의 선형 결합에 활성화 함수를 적용합니다.",
              keyPoints: ["활성화 함수", "가중치 업데이트", "XOR 문제"],
              definitions: ["퍼셉트론: y = f(Σwᵢxᵢ + b)"],
              completed: false,
            },
          ],
        },
      ],
    },
  ])

  useEffect(() => {
    if (currentView === "splash") {
      const timer = setTimeout(() => {
        setCurrentView("login")
      }, 2500)
      return () => clearTimeout(timer)
    }
  }, [currentView])

  const handlePlanCreated = (newPlan: StudyPlan) => {
    setStudyPlans([...studyPlans, newPlan])
    setShowUploadModal(false)
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
    }
  }

  const handleViewPdf = (plan: StudyPlan) => {
    setSelectedPlan(plan)
    setCurrentView("pdf-detail")
  }

  const handleDeletePlan = (planId: string) => {
    setStudyPlans(studyPlans.filter((p) => p.id !== planId))
    if (selectedPlan?.id === planId) {
      setSelectedPlan(null)
      setCurrentView("home")
    }
  }

  const handleLogin = () => {
    setCurrentView("home")
  }

  const handleSignUp = () => {
    setCurrentView("home")
  }

  if (currentView === "splash") {
    return <SplashScreen />
  }

  if (currentView === "login") {
    return (
      <LoginPage onLogin={handleLogin} onCreateAccount={() => setCurrentView("signup")} onForgotPassword={() => {}} />
    )
  }

  if (currentView === "signup") {
    return <SignUpPage onSignUp={handleSignUp} onBackToLogin={() => setCurrentView("login")} />
  }

  if (currentView === "celebration" && selectedPlan) {
    return <CelebrationPage plan={selectedPlan} onBackToHome={() => setCurrentView("home")} />
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
        />
      ) : selectedPlan ? (
        <PdfDetailView plan={selectedPlan} onBack={() => setCurrentView("home")} onUpdatePlan={handlePlanUpdate} />
      ) : null}

      <PdfUploadModal open={showUploadModal} onOpenChange={setShowUploadModal} onPlanCreated={handlePlanCreated} />
    </>
  )
}
