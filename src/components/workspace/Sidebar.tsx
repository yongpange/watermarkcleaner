"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  FileText,
  StickyNote,
  Palette,
  Settings,
  ChevronRight,
  File,
  MessageCircle,
  CreditCard,
  HelpCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface SidebarProps {
  metadata?: {
    wordCount?: number;
    pageCount?: number;
    language?: string;
    detectedFormat?: string;
  };
  className?: string;
  onModeChange?: (mode: 'document' | 'chatbot' | 'flashcards' | 'quiz') => void;
  activeMode?: 'document' | 'chatbot' | 'flashcards' | 'quiz';
}

type TabType = "files" | "notes" | "styles" | "settings";

export default function Sidebar({ metadata: _metadata, className, onModeChange, activeMode = 'document' }: SidebarProps) {
  const t = useTranslations("workspace");
  const [activeTab, setActiveTab] = useState<TabType>("files");
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navButtons = [
    { id: "document" as const, icon: File, label: "Document" },
    { id: "chatbot" as const, icon: MessageCircle, label: "Chatbot" },
    { id: "flashcards" as const, icon: CreditCard, label: "Flashcards" },
    { id: "quiz" as const, icon: HelpCircle, label: "Quiz" },
  ];

  const handleModeClick = (mode: 'document' | 'chatbot' | 'flashcards' | 'quiz') => {
    if (mode === 'document' || mode === 'chatbot' || mode === 'flashcards') {
      onModeChange?.(mode);
    } else {
      toast.info("正在开发中，敬请期待");
    }
  };

  const tabs = [
    { id: "files" as TabType, icon: FileText, label: t("sidebar.files") },
    { id: "notes" as TabType, icon: StickyNote, label: t("sidebar.notes") },
    { id: "styles" as TabType, icon: Palette, label: t("sidebar.styles") },
    { id: "settings" as TabType, icon: Settings, label: t("sidebar.settings") },
  ];

  if (isCollapsed) {
    return (
      <div className={cn("w-12 border-r bg-muted/30", className)}>
        <div className="flex flex-col items-center py-4 gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(false)}
            className="w-8 h-8 p-0"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Separator />
          {navButtons.map((button) => (
            <Button
              key={button.id}
              variant={activeMode === button.id ? "secondary" : "ghost"}
              size="sm"
              onClick={() => handleModeClick(button.id)}
              className="w-8 h-8 p-0"
              title={button.label}
            >
              <button.icon className="w-4 h-4" />
            </Button>
          ))}
          <Separator />
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "secondary" : "ghost"}
              size="sm"
              onClick={() => {
                setActiveTab(tab.id);
                setIsCollapsed(false);
              }}
              className="w-8 h-8 p-0"
            >
              <tab.icon className="w-4 h-4" />
            </Button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("w-64 border-r bg-muted/30", className)}>
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h2 className="font-semibold text-sm">{tabs.find(t => t.id === activeTab)?.label}</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(true)}
          className="w-8 h-8 p-0"
        >
          <ChevronRight className="w-4 h-4 rotate-180" />
        </Button>
      </div>

      <div className="p-3 border-b bg-muted/20">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Quick Tools</h3>
        <div className="grid grid-cols-2 gap-2">
          {navButtons.map((button) => (
            <Button
              key={button.id}
              variant={activeMode === button.id ? "default" : "outline"}
              size="sm"
              onClick={() => handleModeClick(button.id)}
              className="flex flex-col items-center gap-1 h-auto py-2 px-1 hover:bg-primary/5 hover:border-primary/30 transition-colors"
            >
              <button.icon className="w-5 h-5 mb-1" />
              <span className="text-xs font-medium leading-tight">{button.label}</span>
            </Button>
          ))}
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-8rem)]">
        <div className="p-4">
          {activeTab === "files" && (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <p>Files feature coming soon...</p>
              </div>
            </div>
          )}

          {activeTab === "notes" && (
            <div className="text-sm text-muted-foreground">
              <p>Notes feature coming soon...</p>
            </div>
          )}

          {activeTab === "styles" && (
            <div className="text-sm text-muted-foreground">
              <p>Styling options coming soon...</p>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="text-sm text-muted-foreground">
              <p>Settings coming soon...</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

