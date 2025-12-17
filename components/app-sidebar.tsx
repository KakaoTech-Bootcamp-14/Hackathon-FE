"use client"

import { Book, Calendar, Plus, Home, ChevronRight, Zap } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import type { StudyPlan } from "@/app/page"

interface AppSidebarProps {
  studyPlans: StudyPlan[]
  onAddPdf: () => void
  onSelectPlan: (plan: StudyPlan) => void
  currentView: "home" | "pdf-detail"
  onNavigateHome: () => void
}

export function AppSidebar({ studyPlans, onAddPdf, onSelectPlan, currentView, onNavigateHome }: AppSidebarProps) {
  return (
    <Sidebar className="border-r border-border">
      <SidebarHeader className="border-b border-border p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Zap className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg">제우스AI</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={onNavigateHome} isActive={currentView === "home"} className="gap-3">
                  <Home className="h-4 w-4" />
                  <span>홈</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton className="gap-3">
                  <Calendar className="h-4 w-4" />
                  <span>캘린더</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center justify-between px-2">
            <span>내 학습 자료</span>
            <Button variant="ghost" size="icon" className="h-5 w-5" onClick={onAddPdf}>
              <Plus className="h-3 w-3" />
            </Button>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {studyPlans.map((plan) => (
                <SidebarMenuItem key={plan.id}>
                  <SidebarMenuButton
                    onClick={() => onSelectPlan(plan)}
                    className="flex-col items-start gap-1 h-auto py-3"
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-medium text-sm truncate flex items-center gap-1.5">
                        <Book className="h-3.5 w-3.5 text-muted-foreground" />
                        {plan.pdfName}
                      </span>
                      <ChevronRight className="h-3 w-3 text-muted-foreground" />
                    </div>
                    <div className="w-full space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>진도율</span>
                        <span>{plan.totalProgress}%</span>
                      </div>
                      <Progress value={plan.totalProgress} className="h-1" />
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border p-4">
        <Button onClick={onAddPdf} className="w-full gap-2">
          <Plus className="h-4 w-4" />
          PDF 추가
        </Button>
      </SidebarFooter>
    </Sidebar>
  )
}
