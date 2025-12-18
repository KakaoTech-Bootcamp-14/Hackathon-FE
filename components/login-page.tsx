"use client"

import type React from "react"

import { useState } from "react"
import { Zap, Mail, Lock, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface LoginPageProps {
  onLogin: () => void
  onCreateAccount: () => void
  onForgotPassword: () => void
}

export function LoginPage({ onLogin, onCreateAccount, onForgotPassword }: LoginPageProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onLogin()
  }

  return (
    <div className="min-h-screen gradient-mesh animate-fade-in flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 rounded-xl icon-gradient flex items-center justify-center shadow-primary glow-primary mb-4 animate-scale-in">
            <Zap className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">ZEUS AI</h1>
          <p className="text-sm text-muted-foreground mt-1">학습의 신이 함께합니다</p>
        </div>

        {/* Login Form */}
        <div className="bg-card border border-border rounded-2xl p-8 shadow-xl glass-subtle animate-fade-in-up">
          <h2 className="text-xl font-semibold text-foreground mb-6 text-center">로그인</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
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
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 bg-background"
                />
              </div>
            </div>

            <Button type="submit" className="w-full btn-gradient text-white border-0 h-11 gap-2 hover-lift shadow-primary">
              로그인
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <div className="mt-6 space-y-3">
            <button
              onClick={onForgotPassword}
              className="w-full text-center text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              비밀번호를 잊으셨나요?
            </button>

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
          계속 진행하면 ZEUS AI의 서비스 약관 및 개인정보 처리방침에 동의하는 것입니다.
        </p>
      </div>
    </div>
  )
}
