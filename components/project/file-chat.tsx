"use client";

import type React from "react";
import { Code as CodeIcon } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Send,
  Bot,
  User,
  Loader2,
  Shield,
  Zap,
  MessageSquare,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface FileChatProps {
  projectId: string;
  filePath: string;
  fileContent: string | null;
}

const SUGGESTED_QUESTIONS = [
  "Review this code for best practices",
  "Are there any security issues?",
  "How can I make this more modular?",
  "Add comments to explain complex parts",
  "Suggest performance improvements",
  "Check for potential bugs",
  "Is this code testable?",
  "Refactor suggestions",
];

export function FileChat({ projectId, filePath, fileContent }: FileChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [apiLimitReached, setApiLimitReached] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || apiLimitReached || !fileContent) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch(`/api/projects/${projectId}/chat/file`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input.trim(),
          filePath,
          fileContent,
        }),
      });

      // Check content type
      const contentType = response.headers.get("content-type");

      if (contentType && contentType.includes("application/json")) {
        // JSON response (error or non-streaming)
        const data = await response.json();

        if (!response.ok) {
          if (
            data.error?.includes("API limit") ||
            data.error?.includes("temporarily unavailable")
          ) {
            setApiLimitReached(true);
          }
          throw new Error(data.error || "Failed to analyze file");
        }

        if (data.message) {
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: data.message,
          };
          setMessages((prev) => [...prev, assistantMessage]);
        }
      } else {
        // Streaming response
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "",
        };

        setMessages((prev) => [...prev, assistantMessage]);

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value);
            assistantMessage.content += chunk;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMessage.id
                  ? { ...m, content: assistantMessage.content }
                  : m
              )
            );
          }
        }
      }
    } catch (error) {
      console.error("File chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content:
            "Sorry, I couldn't analyze the file. Please try again or use the general project chat.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickQuestion = (question: string) => {
    setInput(question);
  };

  const filename = filePath.split("/").pop() || filePath;

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <CodeIcon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          <span className="truncate">
            Analysis: <span className="hidden sm:inline">Code</span> {filename}
          </span>
        </CardTitle>
        <div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground sm:gap-2">
          <div className="flex items-center gap-1">
            <Shield className="h-3 w-3" />
            <span className="hidden sm:inline">Security</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1">
            <Zap className="h-3 w-3" />
            <span className="hidden sm:inline">Performance</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1">
            <MessageSquare className="h-3 w-3" />
            <span className="hidden sm:inline">Best Practices</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col p-3 sm:p-4">
        {apiLimitReached && (
          <div className="mb-3 rounded-lg bg-amber-50 p-2 sm:mb-4 sm:p-3 dark:bg-amber-900/20">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-amber-600 dark:text-amber-400" />
              <span className="text-xs sm:text-sm font-medium text-amber-800 dark:text-amber-300">
                AI service limit reached. Try again tomorrow.
              </span>
            </div>
          </div>
        )}

        {/* Suggested Questions */}
        {messages.length === 0 && (
          <div className="mb-3 sm:mb-4">
            <p className="mb-2 text-xs sm:text-sm text-muted-foreground">
              Quick questions:
            </p>
            <div className="flex flex-wrap gap-1 sm:gap-2">
              {SUGGESTED_QUESTIONS.map((question, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickQuestion(question)}
                  className="h-auto px-2 text-xs"
                >
                  <span className="hidden sm:inline">{question}</span>
                  <span className="sm:hidden">Q{index + 1}</span>
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 space-y-3 overflow-auto pb-3 sm:space-y-4 sm:pb-4">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center p-2">
              <CodeIcon className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground" />
              <h3 className="mt-3 text-base sm:text-lg font-medium">Code Analysis</h3>
              <p className="mt-1 max-w-sm text-xs sm:text-sm text-muted-foreground">
                Ask me to review this file for security, performance, best
                practices, or suggest improvements.
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-2 sm:gap-3",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {message.role === "assistant" && (
                  <div className="flex h-6 w-6 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Bot className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[85%] rounded-lg px-3 py-1.5 sm:max-w-[80%] sm:px-4 sm:py-2",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  {message.role === "assistant" ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-xs sm:text-sm">{message.content}</p>
                  )}
                </div>
                {message.role === "user" && (
                  <div className="flex h-6 w-6 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                    <User className="h-3 w-3 sm:h-4 sm:w-4" />
                  </div>
                )}
              </div>
            ))
          )}
          {isLoading && messages[messages.length - 1]?.role === "user" && (
            <div className="flex gap-2 sm:gap-3">
              <div className="flex h-6 w-6 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Bot className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-1.5 sm:px-4 sm:py-2">
                <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                <span className="text-xs sm:text-sm">Analyzing code...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Ask about ${filename}`}
            rows={2}
            className="min-h-[50px] resize-none text-sm sm:min-h-[60px]"
            disabled={apiLimitReached || !fileContent}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <Button
            type="submit"
            size="icon"
            className="h-auto w-10 self-end sm:w-auto"
            disabled={
              !input.trim() || isLoading || apiLimitReached || !fileContent
            }
          >
            <Send className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}