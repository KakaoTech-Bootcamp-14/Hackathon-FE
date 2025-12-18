"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Trophy, Sparkles, Star, Home } from "lucide-react"
import type { StudyPlan } from "@/app/page"

interface CelebrationPageProps {
  plan: StudyPlan
  onBackToHome: () => void
}

export function CelebrationPage({ plan, onBackToHome }: CelebrationPageProps) {
  const [confetti, setConfetti] = useState<{ id: number; x: number; y: number; rotation: number; delay: number }[]>([])

  useEffect(() => {
    // Generate confetti particles
    const particles = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: -10 - Math.random() * 20,
      rotation: Math.random() * 360,
      delay: Math.random() * 0.5,
    }))
    setConfetti(particles)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-accent-pink/5 to-accent-purple/5 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Confetti */}
      {confetti.map((particle) => (
        <div
          key={particle.id}
          className="absolute w-3 h-3 animate-bounce-soft"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            animationDelay: `${particle.delay}s`,
            animationDuration: "3s",
          }}
        >
          <Star
            className="text-primary/60"
            style={{
              transform: `rotate(${particle.rotation}deg)`,
            }}
          />
        </div>
      ))}

      {/* Main Content */}
      <div className="max-w-2xl w-full text-center space-y-8 animate-scale-in">
        {/* Trophy Icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary via-accent-orange to-accent-pink flex items-center justify-center shadow-primary-lg animate-pulse-soft">
              <Trophy className="w-20 h-20 text-white" />
            </div>
            <div className="absolute -top-2 -right-2">
              <Sparkles className="w-12 h-12 text-accent-orange animate-spin" style={{ animationDuration: "3s" }} />
            </div>
            <div className="absolute -bottom-2 -left-2">
              <Sparkles className="w-10 h-10 text-primary animate-spin" style={{ animationDuration: "4s" }} />
            </div>
          </div>
        </div>

        {/* Congratulations Text */}
        <div className="space-y-4">
          <h1 className="text-5xl font-bold text-gradient animate-fade-in-up">축하합니다!</h1>
          <p className="text-xl text-muted-foreground animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            <span className="font-semibold text-foreground">{plan.pdfName}</span> 학습을 완료하셨습니다
          </p>
        </div>

        {/* Stats Card */}
        <div
          className="bg-card/80 backdrop-blur-sm border border-border rounded-3xl p-8 shadow-lg animate-fade-in-up"
          style={{ animationDelay: "0.2s" }}
        >
          <div className="grid grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="text-4xl font-bold text-primary">{plan.chapters.length}</div>
              <div className="text-sm text-muted-foreground">챕터 완료</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-primary">100%</div>
              <div className="text-sm text-muted-foreground">진도율</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-primary">
                {plan.chapters.reduce((acc, ch) => acc + ch.sections.length, 0)}
              </div>
              <div className="text-sm text-muted-foreground">섹션 완료</div>
            </div>
          </div>
        </div>

        {/* Motivational Message */}
        <div
          className="bg-gradient-to-r from-primary/10 via-accent-pink/10 to-accent-purple/10 rounded-2xl p-6 animate-fade-in-up"
          style={{ animationDelay: "0.3s" }}
        >
          <p className="text-lg text-foreground">
            🎉 멋진 성과를 이루셨네요! 꾸준한 학습으로 목표를 달성하셨습니다.
          </p>
          <p className="text-sm text-muted-foreground mt-2">다음 학습도 화이팅하세요!</p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center pt-4" style={{ animationDelay: "0.4s" }}>
          <Button
            size="lg"
            className="gap-2 btn-gradient text-white border-0 shadow-primary-lg hover-lift rounded-full px-8"
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
