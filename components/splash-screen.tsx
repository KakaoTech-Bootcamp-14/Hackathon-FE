"use client"

import { Zap } from "lucide-react"

export function SplashScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex flex-col items-center justify-center">
      {/* Logo */}
      <div className="relative mb-8">
        <div className="w-24 h-24 rounded-2xl icon-gradient flex items-center justify-center shadow-lg">
          <Zap className="h-12 w-12 text-white" />
        </div>
        {/* Subtle glow effect */}
        <div className="absolute inset-0 w-24 h-24 rounded-2xl bg-primary/20 blur-xl -z-10" />
      </div>

      {/* Brand Name */}
      <h1 className="text-4xl font-bold text-foreground tracking-tight mb-4">ZEUS AI</h1>

      {/* Tagline */}
      <p className="text-muted-foreground text-lg">Let Zeus decide your study plan.</p>

      {/* Loading indicator */}
      <div className="mt-12 flex gap-1.5">
        <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" />
        <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:0.1s]" />
        <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:0.2s]" />
      </div>
    </div>
  )
}
