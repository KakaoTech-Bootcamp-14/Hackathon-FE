"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Clock, Calendar, TrendingUp, Home, RefreshCw } from "lucide-react"
import type { StudyPlan } from "@/app/page"

interface IncompletePageProps {
  plan: StudyPlan
  onBackToHome: () => void
  onRetry: () => void
}

export function IncompletePage({ plan, onBackToHome, onRetry }: IncompletePageProps) {
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; delay: number }[]>([])

  useEffect(() => {
    // Generate floating particles
    const floatingParticles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 2,
    }))
    setParticles(floatingParticles)
  }, [])

  const totalChapters = plan.chapters.length
  const completedChapters = plan.chapters.filter((ch) => ch.completed).length
  const remainingChapters = totalChapters - completedChapters
  const progressPercentage = plan.totalProgress

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent-orange/5 via-primary/5 to-accent-purple/5 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Floating particles */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute w-2 h-2 bg-primary/20 rounded-full animate-float"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            animationDelay: `${particle.delay}s`,
            animationDuration: "4s",
          }}
        />
      ))}

      {/* Main Content */}
      <div className="max-w-2xl w-full text-center space-y-8 animate-scale-in">
        {/* Clock Icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-accent-orange via-primary to-accent-purple flex items-center justify-center shadow-primary-lg animate-pulse-soft">
              <Clock className="w-20 h-20 text-white" />
            </div>
            <div className="absolute -top-2 -right-2">
              <Calendar className="w-12 h-12 text-accent-orange" />
            </div>
          </div>
        </div>

        {/* Message Text */}
        <div className="space-y-4">
          <h1 className="text-5xl font-bold text-gradient animate-fade-in-up">아직 시간은 있어요!</h1>
          <p className="text-xl text-muted-foreground animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            <span className="font-semibold text-foreground">{plan.pdfName}</span> 학습이 목표 기한을 지났습니다
          </p>
        </div>

        {/* Stats Card */}
        <div
          className="bg-card/80 backdrop-blur-sm border border-border rounded-3xl p-8 shadow-lg animate-fade-in-up"
          style={{ animationDelay: "0.2s" }}
        >
          <div className="grid grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="text-4xl font-bold text-primary">{completedChapters}</div>
              <div className="text-sm text-muted-foreground">완료한 챕터</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-accent-orange">{progressPercentage}%</div>
              <div className="text-sm text-muted-foreground">진도율</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-accent-purple">{remainingChapters}</div>
              <div className="text-sm text-muted-foreground">남은 챕터</div>
            </div>
          </div>
        </div>

        {/* Progress Visualization */}
        <div
          className="bg-card/60 backdrop-blur-sm border border-border rounded-2xl p-6 animate-fade-in-up"
          style={{ animationDelay: "0.25s" }}
        >
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">현재 진행 상황</span>
              <span className="font-semibold text-foreground">{progressPercentage}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary via-accent-orange to-accent-purple transition-all duration-500 ease-out rounded-full"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Motivational Message */}
        <div
          className="bg-gradient-to-r from-accent-orange/10 via-primary/10 to-accent-purple/10 rounded-2xl p-6 animate-fade-in-up"
          style={{ animationDelay: "0.3s" }}
        >
          <p className="text-lg text-foreground">
            포기하지 마세요! 이미 {progressPercentage}%나 진행하셨습니다.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            작은 진전도 큰 성과입니다. 계속해서 앞으로 나아가세요!
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center pt-4 flex-wrap" style={{ animationDelay: "0.4s" }}>
          <Button
            size="lg"
            className="gap-2 btn-gradient text-white border-0 shadow-primary-lg hover-lift rounded-full px-8"
            onClick={onRetry}
          >
            <TrendingUp className="h-5 w-5" />
            계속 학습하기
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="gap-2 rounded-full px-8 hover-lift"
            onClick={onBackToHome}
          >
            <Home className="h-5 w-5" />
            홈으로 돌아가기
          </Button>
        </div>
      </div>
    </div>
  )
}
