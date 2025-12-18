"use client"

import type React from "react"

import { useState } from "react"
import { Zap, User, UserCircle2, Lock, ArrowRight, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { signup } from "@/lib/api/auth"

interface SignUpPageProps {
  onSignUp: () => void
  onBackToLogin: () => void
}

export function SignUpPage({ onSignUp, onBackToLogin }: SignUpPageProps) {
  const [nickname, setNickname] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (loading) return

    try {
      setLoading(true)
      await signup({
        username: username,
        password,
        nickname,
      })
      onSignUp()
    } catch (error) {
      console.error("Signup failed", error)
      alert("회원가입에 실패했습니다. 입력 정보를 확인하거나 잠시 후 다시 시도해주세요.")
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
          <p className="text-sm text-muted-foreground mt-1">학습 계획의 새로운 시작</p>
        </div>

        {/* Sign Up Form */}
        <div className="bg-card border border-border rounded-2xl p-8 shadow-xl glass-subtle animate-fade-in-up">
          <h2 className="text-xl font-semibold text-foreground mb-2 text-center">계정 만들기</h2>
          <p className="text-sm text-muted-foreground text-center mb-6">나비서와 함께 효율적인 학습을 시작하세요</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="nickname" className="text-sm text-foreground">
                이름
              </Label>
              <div className="relative">
                <UserCircle2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="nickname"
                  type="text"
                  placeholder="홍길동"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="pl-10 bg-background"
                />
              </div>
            </div>

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
              {loading ? "가입 중..." : "나비서 시작하기"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <div className="mt-6">
            <Button
              variant="ghost"
              onClick={onBackToLogin}
              className="w-full h-11 text-muted-foreground hover:text-foreground gap-2 hover-lift transition-smooth"
            >
              <ArrowLeft className="h-4 w-4" />
              로그인으로 돌아가기
            </Button>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          가입 시 나비서의 서비스 약관 및 개인정보 처리방침에 동의하는 것입니다.
        </p>
      </div>
    </div>
  )
}
