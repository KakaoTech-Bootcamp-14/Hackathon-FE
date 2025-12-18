"use client"

import { useState, useRef, useEffect } from "react"
import { Send, X, Zap, User, FileText, Maximize2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { apiFetch } from "@/lib/api/client"

interface ChatBotProps {
  pdfName: string
  currentChapter: string
  currentSection?: string
  onClose: () => void
  embedded?: boolean
  learningSourceId?: number
  currentUserId?: number
}

type Message = {
  id: string
  role: "user" | "assistant"
  content: string
  reference?: string
}

export function ChatBot({
  pdfName,
  currentChapter,
  currentSection,
  onClose,
  embedded = false,
  learningSourceId,
  currentUserId,
}: ChatBotProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [size, setSize] = useState({ width: 384, height: 500 }) // w-96 = 384px (floating 모드 전용)
  const [isResizing, setIsResizing] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const chatRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // 히스토리 불러오기 함수 (재사용 가능)
  const loadHistory = async () => {
    const userId = currentUserId ?? 1
    const safeChapter = currentChapter || pdfName
    const greeting: Message = {
      id: "greeting-1",
      role: "assistant",
      content: `안녕하세요! ZEUS AI입니다. "${pdfName}" 학습을 도와드리겠습니다. 현재 "${safeChapter}"를 학습 중이시네요. 궁금한 점이 있으시면 질문해주세요!`,
    }

    // learningSourceId가 없으면 서버 기록 없이 기본 인사만 보여준다.
    if (!learningSourceId) {
      setMessages([greeting])
      return
    }

    try {
      const res: any = await apiFetch(
        `/api/learning-sources/${learningSourceId}/chat?currentUserId=${userId}&size=50`,
        {
          method: "GET",
        },
      )

      const data = (res as any)?.data ?? res
      const rawItems: any[] =
        data?.content ?? data?.chats ?? data?.messages ?? []

      // 서버는 id DESC 정렬로 내려주므로, 오래된 것부터 보이도록 역순 정렬
      const items = [...rawItems].reverse()

      const history: Message[] = items
        .map((item: any, idx: number) => {
          const rawRole = item.role ?? item.sender ?? item.senderType ?? item.from
          const role: "user" | "assistant" =
            rawRole && String(rawRole).toLowerCase().includes("user")
              ? "user"
              : "assistant"

          const content = item.content ?? item.message ?? item.text
          if (!content) return null

          const message: Message = {
            id: String(item.id ?? item.chatId ?? `srv-${idx}`),
            role,
            content,
          }
          
          if (item.reference) {
            message.reference = item.reference
          }
          
          return message
        })
        .filter((m): m is Message => !!m)

      setMessages([greeting, ...history])
    } catch (error) {
      console.error("Failed to load chat history", error)
      // 실패 시에도 최소한 인사 메시지는 보여준다.
      setMessages([greeting])
    }
  }

  // pdfName / currentChapter / learningSourceId / currentUserId 변경 시, 안내 메시지 + 이전 채팅 내역을 불러온다.
  useEffect(() => {
    // 사용자나 학습자료가 변경되면 메시지 초기화 후 새로 불러오기
    setMessages([])
    loadHistory()
  }, [pdfName, currentChapter, learningSourceId, currentUserId])

  useEffect(() => {
    if (embedded) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !chatRef.current) return

      const rect = chatRef.current.getBoundingClientRect()
      // 왼쪽 위 핸들: 마우스를 왼쪽으로 = width 증가, 위로 = height 증가
      const newWidth = Math.max(320, Math.min(800, rect.right - e.clientX))
      const newHeight = Math.max(400, Math.min(800, rect.bottom - e.clientY))

      setSize({ width: newWidth, height: newHeight })
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [embedded, isResizing])

  const handleResizeStart = (e: React.MouseEvent) => {
    if (embedded) return
    e.preventDefault()
    setIsResizing(true)
  }

  // 추천 질문은 초기 버전에서만 사용했고 현재는 가이드를 통해 사용법을 안내합니다.

  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    }

    setMessages((prev) => [...prev, userMessage])
    const userInput = input
    setInput("")
    setIsLoading(true)

    const userId = currentUserId ?? 1

    // 서버 연동: learningSourceId가 있으면 서버에 메시지를 보내고, 없으면 기존 mock 응답 사용
    if (learningSourceId) {
      try {
        const res: any = await apiFetch(`/api/learning-sources/${learningSourceId}/chat?currentUserId=${userId}`, {
          method: "POST",
          body: JSON.stringify({ content: userInput }),
        })

        // 서버 응답 형태를 최대한 유연하게 처리
        //
        // 백엔드 DTO:
        // ChatSendResponse {
        //   userChatId,
        //   assistantChatId,
        //   assistantContent,
        //   sources: [{ source, page }]
        // }
        //
        // 예상 응답 예시:
        // { code, message, data: { userChatId, assistantChatId, assistantContent, sources: [...] } }
        // 또는 직접: { userChatId, assistantChatId, assistantContent, sources: [...] }
        const root = (res as any) ?? {}
        
        // 응답 구조를 더 정확하게 파싱
        // 1) { code, message, data: { ... } } 형태
        // 2) { data: { ... } } 형태  
        // 3) 직접 { assistantContent, ... } 형태
        let payload = root.data ?? root
        
        // data 안에 또 data가 있을 수 있음
        if (payload?.data) {
          payload = payload.data
        }

        const replyContent =
          payload?.assistantContent ??
          payload?.assistantMessage?.content ??
          payload?.content ??
          payload?.answer ??
          null

        if (!replyContent) {
          console.warn("서버 응답에서 assistantContent를 찾을 수 없습니다. 응답:", res)
          // 서버 응답이 없으면 히스토리를 다시 불러와서 최신 메시지 확인
          await loadHistory()
          setIsLoading(false)
          return
        }

        // 백엔드에서 내려주는 참조 정보(sources)가 있으면 첫 번째 것을 참조로 붙인다.
        let reference: string | undefined = undefined
        const sources = payload?.sources as Array<{ source?: string; page?: number }> | undefined
        if (Array.isArray(sources) && sources.length > 0) {
          const first = sources[0]
          if (first?.source) {
            reference = first.page
              ? `${first.source} p.${first.page}`
              : first.source
          }
        }

        const assistantMessage: Message = {
          id: String(payload?.assistantChatId ?? Date.now() + 1),
          role: "assistant",
          content: replyContent,
          reference: reference ?? `${currentChapter} > ${currentSection || "개요"}`,
        }

        // 새로 받은 메시지를 추가하고, 히스토리를 다시 불러와서 최신 상태로 갱신
        setMessages((prev) => [...prev, assistantMessage])
        
        // 서버에 저장된 최신 히스토리를 다시 불러와서 동기화
        await loadHistory()
      } catch (error) {
        console.error("Failed to send chat to server, falling back to local response", error)
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: generateMockResponse(userInput),
          reference: `${currentChapter} > ${currentSection || "개요"}`,
        }
        setMessages((prev) => [...prev, assistantMessage])
      } finally {
        setIsLoading(false)
      }
    } else {
      // 서버 연동 정보가 없으면 기존 mock 응답 사용
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: generateMockResponse(userInput),
        reference: `${currentChapter} > ${currentSection || "개요"}`,
      }

      setMessages((prev) => [...prev, assistantMessage])
      setIsLoading(false)
    }
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

  const containerClasses = embedded
    ? "flex flex-col h-[520px]"
    : "fixed bottom-24 right-6 glass border border-border/50 rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden animate-scale-in"

  const containerStyle = embedded
    ? undefined
    : { width: `${size.width}px`, height: `${size.height}px` }

  // 메시지 내 URL을 자동으로 하이퍼링크로 변환
  const renderMessageContent = (content: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g

    return content.split("\n").map((line, lineIdx) => {
      const parts: React.ReactNode[] = []
      let lastIndex = 0
      const matches = [...line.matchAll(urlRegex)]

      matches.forEach((match, idx) => {
        const url = match[0]
        const start = match.index ?? 0

        if (start > lastIndex) {
          parts.push(
            <span key={`text-${lineIdx}-${idx}`} className="whitespace-pre-wrap">
              {line.slice(lastIndex, start)}
            </span>,
          )
        }

        parts.push(
          <a
            key={`link-${lineIdx}-${idx}`}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-blue-500 hover:text-blue-600 break-all"
          >
            {url}
          </a>,
        )

        lastIndex = start + url.length
      })

      if (lastIndex < line.length) {
        parts.push(
          <span key={`text-tail-${lineIdx}`} className="whitespace-pre-wrap">
            {line.slice(lastIndex)}
          </span>,
        )
      }

      // 마지막 줄이 아니면 줄바꿈 추가
      return (
        <span key={`line-${lineIdx}`}>
          {parts}
          {lineIdx < content.split("\n").length - 1 && <br />}
        </span>
      )
    })
  }

  // 유튜브 링크에서 videoId 추출
  const extractYouTubeVideoId = (url: string): string | null => {
    try {
      const parsed = new URL(url)
      if (parsed.hostname === "youtu.be") {
        return parsed.pathname.slice(1) || null
      }
      if (parsed.hostname === "www.youtube.com" || parsed.hostname === "youtube.com") {
        const v = parsed.searchParams.get("v")
        if (v) return v
        // /embed/{id} 같은 형식도 대응
        const parts = parsed.pathname.split("/")
        const embedIndex = parts.findIndex((p) => p === "embed")
        if (embedIndex >= 0 && parts[embedIndex + 1]) {
          return parts[embedIndex + 1]
        }
      }
    } catch {
      return null
    }
    return null
  }

  const getYouTubeVideoIds = (content: string): string[] => {
    const urlRegex = /(https?:\/\/[^\s]+)/g
    const matches = content.match(urlRegex) ?? []
    const ids = matches
      .map((url) => extractYouTubeVideoId(url))
      .filter((id): id is string => !!id)

    // 중복 제거
    return Array.from(new Set(ids))
  }

  return (
    <div ref={chatRef} className={containerClasses} style={containerStyle}>
      <div className="flex items-center justify-between p-4 border-b border-border/50 glass-primary">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full icon-gradient flex items-center justify-center shadow-primary">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-foreground">ZEUS AI 학습 Agent</h3>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-secondary">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 p-4 overflow-y-auto" ref={scrollRef}>
        <div className="space-y-4">
          {/* 상단 가이드 영역 */}
          <div className="text-[11px] text-muted-foreground bg-secondary/40 border border-border/60 rounded-lg p-3 leading-relaxed">
            <p className="font-semibold text-foreground mb-1">
              AI 학습 Agent에게 <span className="underline">교재 전체 범위에 대해 질문</span>할 수 있습니다.
            </p>
            <p className="font-medium text-foreground mb-1">학습 Agent 사용 가이드</p>
            <ul className="list-disc list-inside space-y-1">
              <li>어려운 개념이나 막히는 부분이 있다면 언제든지 학습 Agent에게 질문하세요.</li>
              <li>Agent는 사용자의 이해도가 부족하다고 판단되면 이해를 돕는 유튜브 영상 등 추가 학습 자료를 추천합니다.</li>
              <li>충분히 이해했다고 판단되면 관련 개념을 복습할 수 있도록 간단한 퀴즈를 제시합니다.</li>
              <li>현재 챕터뿐만 아니라 교재 전체 범위에 대한 요약, 개념 정리, 학습 전략도 자유롭게 요청할 수 있습니다.</li>
            </ul>
          </div>
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
                <div className="whitespace-pre-wrap">{renderMessageContent(message.content)}</div>
                {/* 유튜브 링크가 포함된 경우, 임베드 플레이어 표시 (assistant 메세지 한정) */}
                {message.role === "assistant" && getYouTubeVideoIds(message.content).length > 0 && (
                  <div className="mt-3 space-y-2">
                    {getYouTubeVideoIds(message.content).map((videoId) => (
                      <div
                        key={videoId}
                        className="rounded-lg overflow-hidden border border-border bg-black/90"
                      >
                        <div className="relative pt-[56.25%]">
                          <iframe
                            className="absolute inset-0 w-full h-full"
                            src={`https://www.youtube.com/embed/${videoId}`}
                            title="YouTube video player"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
      </div>

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
            className="flex-1 bg-background focus:ring-primary/30 rounded-full"
          />
          <Button
            type="submit"
            size="icon"
            disabled={isLoading || !input.trim()}
            className="btn-gradient border-0 disabled:opacity-50 shadow-primary hover-lift rounded-full"
          >
            <Send className="h-4 w-4 text-white" />
          </Button>
        </form>
      </div>

      {/* Resize Handle (플로팅 모드에서만 표시) */}
      {!embedded && (
        <div
          onMouseDown={handleResizeStart}
          className={cn(
            "absolute top-2 left-2 w-6 h-6 rounded-full bg-primary/10 hover:bg-primary/20 flex items-center justify-center cursor-nw-resize transition-colors group",
            isResizing && "bg-primary/30",
          )}
          title="드래그하여 크기 조절"
        >
          <Maximize2 className="h-3 w-3 text-primary group-hover:scale-110 transition-transform" />
        </div>
      )}
    </div>
  )
}
