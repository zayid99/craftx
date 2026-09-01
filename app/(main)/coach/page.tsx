"use client";

import { useState, useRef, useEffect } from "react";
import UpgradePrompt from "@/components/dashboard/upgrade-prompt";

type Message = {
  role: "user" | "assistant";
  content: string;
};

interface UpgradeInfo {
  plan: "free" | "creator" | "creator_pro";
  message: string;
  currentUsage: number | null;
  limit: number | null;
}

export default function CoachPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [upgradeInfo, setUpgradeInfo] = useState<UpgradeInfo | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    setError("");
    setUpgradeInfo(null);
    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/coach/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.upgradeRequired) {
          setUpgradeInfo({
            plan: data.plan,
            message: data.error,
            currentUsage: data.currentUsage ?? null,
            limit: data.limit ?? null,
          });
        } else {
          setError(data.error || "Something went wrong. Please try again.");
        }
        return;
      }

      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch {
      setError("CraftX is temporarily busy. Please try again in a moment.");
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-12 flex flex-col h-[85vh]">
      <h1 className="text-3xl font-semibold mb-2">Creator Coach</h1>
      <p className="text-gray-500 mb-6">
        Ask about your content strategy, ideas, scripts, or what to do next.
      </p>

      <div className="flex-1 overflow-y-auto border rounded-xl p-4 space-y-4 mb-4">
        {messages.length === 0 && (
          <p className="text-sm text-gray-400">
            Try asking: "What should I post next?" or "Review my recent scripts."
          </p>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 text-sm whitespace-pre-wrap ${
                m.role === "user"
                  ? "bg-black text-white"
                  : "bg-gray-100 text-gray-900"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-500 rounded-lg px-4 py-2 text-sm">
              Thinking...
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {error && <p className="text-red-600 text-sm mb-2">{error}</p>}

      {upgradeInfo && (
        <div className="mb-4">
          <UpgradePrompt
            plan={upgradeInfo.plan}
            message={upgradeInfo.message}
            currentUsage={upgradeInfo.currentUsage}
            limit={upgradeInfo.limit}
          />
        </div>
      )}

      <div className="flex gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          className="flex-1 border rounded-lg px-3 py-2 resize-none"
          placeholder="Ask your Creator Coach..."
        />
        <button
          onClick={handleSend}
          disabled={loading}
          className="bg-black text-white px-5 py-2.5 rounded-lg disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
}