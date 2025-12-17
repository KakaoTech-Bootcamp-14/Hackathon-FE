"use client"

import type React from "react"

import { useState } from "react"
import { Zap, User, Mail, Lock, ArrowRight, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface SignUpPageProps {
  onSignUp: () => void
  onBackToLogin: () => void
}

export function SignUpPage({ onSignUp, onBackToLogin }: SignUpPageProps) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSignUp()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 rounded-xl icon-gradient flex items-center justify-center shadow-md mb-4">
            <Zap className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">ZEUS AI</h1>
          <p className="text-sm text-muted-foreground mt-1">학습 계획의 새로운 시작</p>
        </div>

        {/* Sign Up Form */}
        <div className="bg-card border border-border rounded-2xl p-8 shadow-soft">
          <h2 className="text-xl font-semibold text-foreground mb-2 text-center">계정 만들기</h2>
          <p className="text-sm text-muted-foreground text-center mb-6">ZEUS AI와 함께 효율적인 학습을 시작하세요</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm text-foreground">
                이름
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  placeholder="홍길동"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10 bg-background"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm text-foreground">
                이메일
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                  placeholder="8자 이상 입력"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 bg-background"
                />
              </div>
              <p className="text-xs text-muted-foreground">비밀번호는 8자 이상이어야 합니다</p>
            </div>

            <Button type="submit" className="w-full btn-gradient text-white border-0 h-11 gap-2">
              ZEUS AI 시작하기
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <div className="mt-6">
            <Button
              variant="ghost"
              onClick={onBackToLogin}
              className="w-full h-11 text-muted-foreground hover:text-foreground gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              로그인으로 돌아가기
            </Button>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          가입 시 ZEUS AI의 서비스 약관 및 개인정보 처리방침에 동의하는 것입니다.
        </p>
      </div>
    </div>
  )
}
