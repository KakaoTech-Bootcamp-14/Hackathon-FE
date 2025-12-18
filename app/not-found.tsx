"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Home, Search, ArrowLeft, Sparkles } from "lucide-react"

export default function NotFound() {
  const [float, setFloat] = useState(false)

  useEffect(() => {
    setFloat(true)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-primary/5 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Floating Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-32 h-32 rounded-full bg-primary/10 blur-3xl animate-pulse-soft" />
        <div
          className="absolute bottom-20 right-20 w-40 h-40 rounded-full bg-accent-pink/10 blur-3xl animate-pulse-soft"
          style={{ animationDelay: "1s" }}
        />
        <div
          className="absolute top-1/2 left-1/2 w-48 h-48 rounded-full bg-accent-purple/10 blur-3xl animate-pulse-soft"
          style={{ animationDelay: "2s" }}
        />
      </div>

      {/* Main Content */}
      <div className="max-w-2xl w-full text-center space-y-8 relative z-10">
        {/* 404 Number */}
        <div className="relative animate-fade-in-up">
          <h1
            className={cn(
              "text-[180px] font-bold leading-none text-gradient transition-all duration-1000",
              float && "animate-bounce-soft",
            )}
          >
            404
          </h1>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/5 rounded-full blur-2xl -z-10" />
        </div>

        {/* Message */}
        <div className="space-y-4 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-6 h-6 text-primary animate-spin" style={{ animationDuration: "3s" }} />
            <h2 className="text-3xl font-bold text-foreground">페이지를 찾을 수 없습니다</h2>
            <Sparkles className="w-6 h-6 text-accent-pink animate-spin" style={{ animationDuration: "4s" }} />
          </div>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            요청하신 페이지가 존재하지 않거나, 이동되었거나, 삭제되었을 수 있습니다.
          </p>
        </div>

        {/* Decorative Card */}
        <div
          className="bg-card/80 backdrop-blur-sm border border-border rounded-3xl p-8 shadow-lg animate-fade-in-up mx-auto max-w-md"
          style={{ animationDelay: "0.4s" }}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-3">
              <Search className="w-5 h-5 text-primary" />
              <p className="text-sm text-muted-foreground">다음을 시도해보세요:</p>
            </div>
            <ul className="text-sm text-foreground space-y-2 text-left">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>URL이 올바른지 확인해보세요</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>홈페이지로 돌아가서 다시 시작해보세요</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>브라우저의 뒤로가기 버튼을 눌러보세요</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4 animate-fade-in-up" style={{ animationDelay: "0.6s" }}>
          <Button
            onClick={() => window.history.back()}
            variant="outline"
            size="lg"
            className="gap-2 rounded-full border-primary/25 hover:bg-primary/5 hover:border-primary/40 hover-lift"
          >
            <ArrowLeft className="h-5 w-5" />
            이전 페이지
          </Button>
          <Link href="/">
            <Button size="lg" className="gap-2 btn-gradient text-white border-0 shadow-primary-lg hover-lift rounded-full px-8">
              <Home className="h-5 w-5" />
              홈으로 가기
            </Button>
          </Link>
        </div>

        {/* Additional Help */}
        <div className="pt-8 animate-fade-in-up" style={{ animationDelay: "0.8s" }}>
          <p className="text-sm text-muted-foreground">
            문제가 계속되면{" "}
            <a href="mailto:support@zeusai.com" className="text-primary hover:underline font-medium">
              고객 지원팀
            </a>
            에 문의해주세요.
          </p>
        </div>
      </div>
    </div>
  )
}

// Helper function (inline since we can't import from utils in this file context)
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ")
}
