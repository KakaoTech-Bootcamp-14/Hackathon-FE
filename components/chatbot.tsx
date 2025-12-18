"use client"

import { useState, useRef, useEffect } from "react"
import { Send, X, Zap, User, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

interface ChatBotProps {
  pdfName: string
  currentChapter: string
  currentSection?: string
  onClose: () => void
}

type Message = {
  id: string
  role: "user" | "assistant"
  content: string
  reference?: string
}

export function ChatBot({ pdfName, currentChapter, currentSection, onClose }: ChatBotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: `안녕하세요! ZEUS AI입니다. "${pdfName}" 학습을 도와드리겠습니다. 현재 "${currentChapter}"를 학습 중이시네요. 궁금한 점이 있으시면 질문해주세요!`,
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const suggestedQuestions = ["이 챕터에서 가장 중요한 개념은?", "이 부분을 예시로 설명해줘", "핵심 포인트를 요약해줘"]

  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    await new Promise((resolve) => setTimeout(resolve, 1000))

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: generateMockResponse(input),
      reference: `${currentChapter} > ${currentSection || "개요"}`,
    }

    setMessages((prev) => [...prev, assistantMessage])
    setIsLoading(false)
  }

  const generateMockResponse = (question: string): string => {
    if (question.includes("중요한") || question.includes("핵심")) {
      return `이 챕터에서 가장 중요한 개념은 **기본 원리의 이해**입니다. 특히 다음 세 가지 포인트를 기억하세요:\n\n1. 기초 개념의 정확한 정의\n2. 실제 적용 사례 파악\n3. 관련 개념과의 연결성\n\n이 부분을 확실히 이해하면 다음 챕터 학습이 훨씬 수월해집니다.`
    }
    if (question.includes("예시") || question.includes("설명")) {
      return `물론이죠! 쉬운 예시로 설명해드릴게요.\n\n예를 들어, 일상에서 우리가 경험하는 **패턴 인식**을 생각해보세요. 매일 같은 시간에 출근하면서 교통 상황의 패턴을 학습하는 것처럼, 이 개념도 비슷한 방식으로 데이터에서 패턴을 찾아냅니다.\n\n핵심은 **반복적인 학습을 통한 개선**입니다.`
    }
    if (question.includes("요약")) {
      return `이 섹션의 핵심을 요약해드릴게요:\n\n⚡ **주요 개념**: 기본 원리와 적용 방법\n⚡ **주요 공식**: 관련 수식 및 정의\n⚡ **실전 팁**: 문제 풀이 시 주의사항\n\n특히 시험에서는 정의 부분이 자주 출제되니 꼭 암기해두세요!`
    }
    return `좋은 질문이에요! "${question}"에 대해 답변드리겠습니다.\n\n이 개념은 학습의 기초가 되는 중요한 부분입니다. 핵심은 **기본 원리를 이해하고 실제로 적용해보는 것**입니다.\n\n더 자세한 설명이 필요하시면 말씀해주세요!`
  }

  const handleSuggestedQuestion = (question: string) => {
    setInput(question)
  }

  return (
    <div className="fixed bottom-24 right-6 w-96 h-[500px] glass border border-border/50 rounded-xl shadow-2xl flex flex-col z-50 overflow-hidden animate-scale-in">
      <div className="flex items-center justify-between p-4 border-b border-border/50 glass-primary">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full icon-gradient flex items-center justify-center shadow-primary">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-foreground">ZEUS AI 학습 도우미</h3>
            <p className="text-xs text-muted-foreground truncate max-w-[200px]">{currentChapter}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-secondary">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn("flex gap-2", message.role === "user" ? "justify-end" : "justify-start")}
            >
              {message.role === "assistant" && (
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center shrink-0">
                  <Zap className="h-3.5 w-3.5 text-primary" />
                </div>
              )}
              <div
                className={cn(
                  "max-w-[80%] rounded-lg p-3 text-sm",
                  message.role === "user" ? "btn-gradient text-white shadow-primary" : "bg-secondary text-foreground shadow-sm",
                )}
              >
                <div className="whitespace-pre-wrap">{message.content}</div>
                {message.reference && (
                  <div
                    className={cn(
                      "flex items-center gap-1 mt-2 pt-2 border-t text-xs",
                      message.role === "user"
                        ? "border-white/20 text-white/70"
                        : "border-border/30 text-muted-foreground",
                    )}
                  >
                    <FileText className="h-3 w-3" />
                    <span>참조: {message.reference}</span>
                  </div>
                )}
              </div>
              {message.role === "user" && (
                <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center shrink-0">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center">
                <Zap className="h-3.5 w-3.5 text-primary animate-pulse" />
              </div>
              <div className="bg-secondary rounded-lg p-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" />
                  <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:0.1s]" />
                  <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:0.2s]" />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {messages.length <= 2 && (
        <div className="px-4 pb-2">
          <p className="text-xs text-muted-foreground mb-2">추천 질문</p>
          <div className="flex flex-wrap gap-1">
            {suggestedQuestions.map((q, i) => (
              <button
                key={i}
                onClick={() => handleSuggestedQuestion(q)}
                className="text-xs px-2.5 py-1.5 rounded-full glass-subtle hover:bg-primary/10 hover:text-primary text-foreground hover-scale transition-smooth shadow-sm"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="p-4 border-t border-border">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSend()
          }}
          className="flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="질문을 입력하세요..."
            disabled={isLoading}
            className="flex-1 bg-background focus:ring-primary/30"
          />
          <Button
            type="submit"
            size="icon"
            disabled={isLoading || !input.trim()}
            className="btn-gradient border-0 disabled:opacity-50 shadow-primary hover-lift"
          >
            <Send className="h-4 w-4 text-white" />
          </Button>
        </form>
      </div>
    </div>
  )
}
