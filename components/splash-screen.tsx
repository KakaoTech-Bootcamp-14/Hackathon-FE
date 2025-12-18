"use client"

import { Zap } from "lucide-react"

export function SplashScreen() {
  return (
    <div className="min-h-screen gradient-mesh animate-fade-in flex flex-col items-center justify-center">
      {/* Logo */}
      <div className="relative mb-8">
        <div className="w-24 h-24 rounded-2xl icon-gradient flex items-center justify-center shadow-primary-lg glow-primary animate-scale-in">
          <Zap className="h-12 w-12 text-white" />
        </div>
        {/* Enhanced glow effect */}
        <div className="absolute inset-0 w-24 h-24 rounded-2xl bg-primary/30 blur-2xl -z-10 animate-pulse-soft" />
      </div>

      {/* Brand Name */}
      <h1 className="text-4xl font-bold text-foreground tracking-tight mb-4 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>ZEUS AI</h1>

      {/* Tagline */}
      <p className="text-muted-foreground text-lg animate-fade-in-up" style={{ animationDelay: '0.2s' }}>학습의 신이 함께합니다.</p>

      {/* Loading indicator */}
      <div className="mt-12 flex gap-1.5">
        <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" />
        <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:0.1s]" />
        <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:0.2s]" />
      </div>
    </div>
  )
}
