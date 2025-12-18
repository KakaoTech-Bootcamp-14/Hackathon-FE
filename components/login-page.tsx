 "use client"

import type React from "react"

import { useState } from "react"
import { Zap, User, Lock, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { login } from "@/lib/api/auth"

interface LoginPageProps {
  onLogin: () => void
  onCreateAccount: () => void
}

export function LoginPage({ onLogin, onCreateAccount }: LoginPageProps) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (loading) return

    try {
      setLoading(true)
      await login({ username, password })
      onLogin()
    } catch (error) {
      // TODO: 에러 UI 연결 (toast 등)
      console.error("Login failed", error)
      alert("로그인에 실패했습니다. 아이디/비밀번호를 확인해주세요.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen gradient-mesh animate-fade-in flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 rounded-xl icon-gradient flex items-center justify-center shadow-primary glow-primary mb-4 animate-scale-in">
            <Zap className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">나비서</h1>
          <p className="text-sm text-muted-foreground mt-1">학습의 신이 함께합니다</p>
        </div>

        {/* Login Form */}
        <div className="bg-card border border-border rounded-2xl p-8 shadow-xl glass-subtle animate-fade-in-up">
          <h2 className="text-xl font-semibold text-foreground mb-6 text-center">로그인</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm text-foreground">
                아이디
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="username"
                  type="text"
                  placeholder="아이디를 입력하세요"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10 bg-background"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm text-foreground">
                비밀번호
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="비밀번호를 입력하세요"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 bg-background"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full btn-gradient text-white border-0 h-11 gap-2 hover-lift shadow-primary"
              disabled={loading}
            >
              {loading ? "로그인 중..." : "로그인"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <div className="mt-6 space-y-3">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-card px-2 text-muted-foreground">또는</span>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={onCreateAccount}
              className="w-full h-11 border-border hover:bg-secondary bg-transparent hover-lift transition-smooth"
            >
              새 계정 만들기
            </Button>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          계속 진행하면 나비서의 서비스 약관 및 개인정보 처리방침에 동의하는 것입니다.
        </p>
      </div>
    </div>
  )
}
