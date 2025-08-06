import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLanguage } from "@/contexts/language-context";
import {
  MessageCircle,
  Send,
  X,
  Bot,
  User,
  Minimize2,
  Maximize2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
}

interface ChatWidgetProps {
  className?: string;
}

export function ChatWidget({ className }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content:
        "مرحباً! أنا مساعد ليرات للتحديثات المباشرة، مصمم لتقديم أحداث التقويم الاقتصادي والأخبار المباشرة والأسعار في الوقت الفعلي. كيف يمكنني مساعدتك اليوم؟",
      role: "assistant",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { language, dir } = useLanguage();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      role: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: inputValue,
          language: language,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response || "عذراً، حدث خطأ في الاستجابة.",
        role: "assistant",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content:
          language === "ar"
            ? "عذراً، حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى."
            : "Sorry, there was a connection error. Please try again.",
        role: "assistant",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const translations = {
    ar: {
      title: "المساعد الذكي",
      placeholder: "اكتب رسالتك هنا...",
      send: "إرسال",
    },
    en: {
      title: "AI Assistant",
      placeholder: "Type your message here...",
      send: "Send",
    },
  };

  const t = translations[language as keyof typeof translations];

  if (!isOpen) {
    return (
      <div
        className={cn(
          "fixed bottom-4 z-50",
          dir === "rtl" ? "left-4 sm:left-6" : "right-4 sm:right-6",
          className,
        )}
      >
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className="h-12 w-12 sm:h-14 sm:w-14 rounded-full neumorphic-button transition-all duration-300"
          style={{
            background: 'var(--neumorphic-gradient)',
            color: 'var(--foreground)'
          }}
        >
          <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6" />
        </Button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "fixed bottom-4 z-50 w-[calc(100vw-2rem)] max-w-80 sm:w-80 md:w-96",
        dir === "rtl" ? "left-4 sm:left-6" : "right-4 sm:right-6",
        className,
      )}
    >
      <Card className="neumorphic-card bg-background/95 backdrop-blur-sm border-border/50">
        <CardHeader
          className="flex flex-row items-center justify-between space-y-0 pb-2 text-primary-foreground rounded-t-lg"
          style={{
            backgroundImage:
              "url(https://cdn.builder.io/api/v1/image/assets%2F165a7c0d273f4448b5890b3ec14b12af%2F2014a4c719b44f12afb18f1028726b99)",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
            backgroundSize: "cover",
          }}
        >
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Bot className="h-4 w-4" />
            {t.title}
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(!isMinimized)}
              className="h-6 w-6 p-0 neumorphic-button-small"
            >
              {isMinimized ? (
                <Maximize2 className="h-3 w-3 text-white drop-shadow-lg" />
              ) : (
                <Minimize2 className="h-3 w-3 text-white drop-shadow-lg" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="h-6 w-6 p-0 hover:bg-primary-foreground/20 bg-black/30 backdrop-blur-sm border border-white/20"
            >
              <X className="h-3 w-3 text-white drop-shadow-lg" />
            </Button>
          </div>
        </CardHeader>

        {!isMinimized && (
          <CardContent className="p-0">
            <ScrollArea className="h-64 sm:h-80 p-3 sm:p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex gap-3 max-w-[85%]",
                      message.role === "user"
                        ? dir === "rtl"
                          ? "ml-auto flex-row-reverse"
                          : "ml-auto"
                        : dir === "rtl"
                          ? "mr-auto flex-row-reverse"
                          : "mr-auto",
                    )}
                  >
                    <div
                      className={cn(
                        "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {message.role === "user" ? (
                        <User className="h-4 w-4" />
                      ) : (
                        <Bot className="h-4 w-4" />
                      )}
                    </div>
                    <div
                      className={cn(
                        "rounded-lg p-3 text-sm break-words",
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {message.timestamp.toLocaleTimeString(
                          language === "ar" ? "ar-SA" : "en-US",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}
                      </p>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div
                    className={cn(
                      "flex gap-3 max-w-[85%]",
                      dir === "rtl" ? "mr-auto flex-row-reverse" : "mr-auto",
                    )}
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div className="rounded-lg p-3 text-sm bg-muted text-muted-foreground">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            <div className="p-3 sm:p-4 border-t border-border/50 bg-muted/30">
              <div className="flex gap-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={t.placeholder}
                  disabled={isLoading}
                  className="flex-1 border-border/50 bg-background/50"
                  dir={dir}
                />
                <Button
                  onClick={sendMessage}
                  disabled={!inputValue.trim() || isLoading}
                  size="sm"
                  className="px-3"
                  style={{ backgroundColor: "rgba(173, 251, 70, 1)" }}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
