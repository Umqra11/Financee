"use client";

import { useState, useRef, useEffect } from "react";
import {
    MessageCircle,
    Send,
    Loader2,
    Sparkles,
    X,
    Bot,
    ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatMessage {
    role: "user" | "assistant";
    content: string;
}

const QUICK_QUESTIONS = [
    { id: "top", text: "Bu ay en çok neye harcadım?" },
    { id: "savings", text: "Bana tasarruf önerisi ver" },
    { id: "budget", text: "Bütçe durumum nasıl?" },
    { id: "subs", text: "Aboneliklerimi değerlendir" },
    { id: "unnecessary", text: "Gereksiz harcamalarım neler?" },
];

export function AiChatPanel() {
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            role: "assistant",
            content:
                "Merhaba! 👋 Ben sizin kişisel finans danışmanınızım. Bana bu ayki harcamalarınız, bütçeniz veya tasarruf konularında sorular sorabilirsiniz. Aşağıdaki hızlı sorulara da tıklayabilirsiniz:",
        },
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isLoading]);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    // Mobilde body scroll'unu engelle
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
            document.body.style.touchAction = "none";
        } else {
            document.body.style.overflow = "";
            document.body.style.touchAction = "";
        }
        return () => {
            document.body.style.overflow = "";
            document.body.style.touchAction = "";
        };
    }, [isOpen]);

    const handleSend = async (text?: string) => {
        const messageText = (text || input).trim();
        if (!messageText || isLoading) return;

        const userMessage: ChatMessage = {
            role: "user",
            content: messageText,
        };
        const updatedMessages = [...messages, userMessage];
        setMessages(updatedMessages);
        setInput("");
        setIsLoading(true);

        try {
            const response = await fetch("/api/ai-chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages: updatedMessages }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(
                    errorData.error || "Bir hata oluştu."
                );
            }

            const data = await response.json();
            setMessages((prev) => [
                ...prev,
                { role: "assistant", content: data.message },
            ]);
        } catch (error: any) {
            setMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    content:
                        error.message ||
                        "Üzgünüm, şu anda yanıt veremiyorum. Lütfen tekrar deneyin.",
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <>
            {/* Floating Action Button */}
            <button
                onClick={() => setIsOpen(true)}
                className={cn(
                    "fixed bottom-20 right-4 md:bottom-8 md:right-8 z-40",
                    "flex items-center justify-center gap-2 px-5 py-3.5",
                    "rounded-2xl shadow-xl shadow-violet-500/20",
                    "bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600",
                    "text-white font-semibold text-sm",
                    "hover:shadow-violet-500/30 hover:-translate-y-0.5",
                    "active:translate-y-0 transition-all duration-300",
                    isOpen && "hidden"
                )}
            >
                <Sparkles className="w-4 h-4" />
                <span>AI Danışman</span>
            </button>

            {/* Chat Panel Overlay */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-zinc-950/50 backdrop-blur-sm"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Panel — mobilde tam ekran, desktop'ta sabit boyut */}
                    <div className="relative w-full h-dvh md:h-[600px] md:max-h-[85vh] md:max-w-md md:rounded-2xl bg-white dark:bg-zinc-900 md:shadow-2xl border-0 md:border border-zinc-200 dark:border-zinc-800 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-950/30 dark:to-indigo-950/30 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 text-white shadow-md">
                                    <Bot className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="font-bold text-zinc-900 dark:text-white text-sm">
                                        AI Finans Danışmanı
                                    </h2>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                        DeepSeek V4 • Çevrimiçi
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 overscroll-contain">
                            {messages.map((msg, i) => (
                                <div
                                    key={i}
                                    className={cn(
                                        "flex gap-3 max-w-[85%]",
                                        msg.role === "user"
                                            ? "ml-auto"
                                            : "mr-auto"
                                    )}
                                >
                                    {msg.role === "assistant" && (
                                        <div className="shrink-0 mt-1">
                                            <div className="p-1 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500">
                                                <Bot className="w-4 h-4 text-white" />
                                            </div>
                                        </div>
                                    )}

                                    <div
                                        className={cn(
                                            "rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap",
                                            msg.role === "user"
                                                ? "bg-gradient-to-r from-violet-500 to-indigo-500 text-white rounded-br-md"
                                                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-bl-md"
                                        )}
                                    >
                                        {msg.content}
                                    </div>
                                </div>
                            ))}

                            {isLoading && (
                                <div className="flex gap-3 max-w-[85%]">
                                    <div className="shrink-0 mt-1">
                                        <div className="p-1 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500">
                                            <Bot className="w-4 h-4 text-white" />
                                        </div>
                                    </div>
                                    <div className="rounded-2xl rounded-bl-md px-4 py-3 bg-zinc-100 dark:bg-zinc-800">
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                            <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                            <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* Quick Questions */}
                        <div className="px-4 py-2 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 shrink-0">
                            <div className="flex flex-wrap gap-1.5">
                                {QUICK_QUESTIONS.map((q) => (
                                    <button
                                        key={q.id}
                                        onClick={() => handleSend(q.text)}
                                        disabled={isLoading}
                                        className="inline-flex items-center gap-1 px-3 py-1.5 text-[11px] font-medium rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-violet-50 dark:hover:bg-violet-950/30 hover:border-violet-200 dark:hover:border-violet-800 hover:text-violet-600 dark:hover:text-violet-400 transition-colors disabled:opacity-50"
                                    >
                                        {q.text}
                                        <ChevronRight className="w-3 h-3" />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Input */}
                        <div className="px-4 py-3 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 shrink-0">
                            <div className="flex items-center gap-2 bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 focus-within:border-violet-400 dark:focus-within:border-violet-500 transition-colors">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={input}
                                    onChange={(e) =>
                                        setInput(e.target.value)
                                    }
                                    onKeyDown={handleKeyDown}
                                    placeholder="Finansal sorunuzu yazın..."
                                    disabled={isLoading}
                                    autoComplete="off"
                                    autoCorrect="off"
                                    spellCheck={false}
                                    className="flex-1 bg-transparent border-none outline-none text-sm py-2 text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 text-base md:text-sm"
                                />
                                <button
                                    onClick={() => handleSend()}
                                    disabled={isLoading || !input.trim()}
                                    className={cn(
                                        "p-1.5 rounded-lg transition-all",
                                        input.trim() && !isLoading
                                            ? "bg-violet-500 text-white hover:bg-violet-600"
                                            : "text-zinc-400"
                                    )}
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </div>
                            <p className="text-[10px] text-zinc-400 mt-2 text-center">
                                Verileriniz gizli kalır. DeepSeek V4 ile
                                çalışır.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}