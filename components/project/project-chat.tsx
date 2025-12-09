"use client";

import type React from "react";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Send, TrainFront, User, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { createClient } from "@/lib/supabase/client";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface ProjectChatProps {
  projectId: string;
}

export function ProjectChat({ projectId }: ProjectChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userEmail, setUserEmail] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load user email
    const loadUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setUserEmail(user.email);
      }
    };
    loadUser();

    // Load chat history
    const loadMessages = async () => {
      const response = await fetch(`/api/projects/${projectId}/chat`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    };
    loadMessages();
  }, [projectId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  if (!input.trim() || isLoading) return

  const userMessage: Message = {
    id: Date.now().toString(),
    role: "user",
    content: input.trim(),
  }

  setMessages((prev) => [...prev, userMessage])
  setInput("")
  setIsLoading(true)

  try {
    const response = await fetch(`/api/projects/${projectId}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: input.trim() }),
    })

    // Check content type
    const contentType = response.headers.get("content-type")
    
    if (contentType && contentType.includes("application/json")) {
      // Handle JSON response (local answer or error)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to send message")
      }
      
      if (data.local || data.fallback || data.gemini) {
        // Non-streaming response
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.message || "No response content",
        }
        setMessages((prev) => [...prev, assistantMessage])
      } else {
        // Should be streaming but got JSON
        console.warn("Expected stream but got JSON:", data)
      }
    } else {
      // Handle streaming response
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "",
      }

      setMessages((prev) => [...prev, assistantMessage])

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value)
          assistantMessage.content += chunk
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantMessage.id ? { ...m, content: assistantMessage.content } : m)),
          )
        }
      }
    }
  } catch (error) {
    console.error("Chat error:", error)
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
      },
    ])
  } finally {
    setIsLoading(false)
  }
}

  return (
    <Card className="flex h-[600px] flex-col overflow-hidden">
      <CardContent className="flex flex-1 flex-col p-4 overflow-hidden">
        {/* Messages */}
        <div className="flex-1 space-y-4 overflow-y-auto overflow-x-hidden pb-4 scrollbar-hide">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <TrainFront className="h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">Project Assistant</h3>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                Ask questions about your project, request changes to the README,
                or get help understanding your code.
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {message.role === "assistant" && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <TrainFront className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[80%] rounded-lg px-4 py-2 wrap-break-word",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  {message.role === "assistant" ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none overflow-hidden">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-sm wrap-break-word">{message.content}</p>
                  )}
                </div>
                {message.role === "user" && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                    <span className="text-xs font-medium truncate px-1">
                      {userEmail ? userEmail.charAt(0).toUpperCase() : <User className="h-4 w-4" />}
                    </span>
                  </div>
                )}
              </div>
            ))
          )}
          {isLoading && messages[messages.length - 1]?.role === "user" && (
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <TrainFront className="h-4 w-4 text-primary" />
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-muted px-4 py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Thinking...</span>
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
            placeholder="Ask about your project..."
            rows={1}
            className="min-h-11 resize-none"
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
            disabled={!input.trim() || isLoading}
          >
            <Send className="h-4 w-4" />
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}