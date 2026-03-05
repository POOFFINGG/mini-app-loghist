import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Send, Headphones, Loader2 } from "lucide-react";
import { getSupportMessages, sendSupportMessage, markSupportRead, type SupportMessage } from "@/lib/api";
import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";

interface Props {
  onBack: () => void;
}

function formatTime(iso: string) {
  try { return format(parseISO(iso), "HH:mm", { locale: ru }); } catch { return ""; }
}

export function SupportChat({ onBack }: Props) {
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchMessages = useCallback(async () => {
    try {
      const msgs = await getSupportMessages();
      setMessages(msgs);
    } catch {}
  }, []);

  useEffect(() => {
    fetchMessages().finally(() => setLoading(false));
    markSupportRead().catch(() => {});
    pollRef.current = setInterval(fetchMessages, 4000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setText("");
    try {
      await sendSupportMessage(trimmed);
      await fetchMessages();
    } catch {
      setText(trimmed);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] animate-in slide-in-from-right-4 duration-300">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 shrink-0">
        <Button variant="ghost" size="icon" onClick={onBack} className="-ml-2">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="w-9 h-9 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
          <Headphones className="w-5 h-5 text-green-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm leading-tight">Служба поддержки</p>
          <p className="text-xs text-green-600 font-medium">Онлайн</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center gap-2">
            <Headphones className="w-10 h-10 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">Напишите нам — мы ответим в ближайшее время</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "operator" && (
                <div className="w-7 h-7 rounded-full bg-green-500/10 flex items-center justify-center shrink-0 mr-2 mt-auto">
                  <Headphones className="w-4 h-4 text-green-600" />
                </div>
              )}
              <div
                className={`max-w-[78%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-card border border-border/60 text-foreground rounded-bl-sm"
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.text}</p>
                <p className={`text-[10px] mt-1 ${msg.role === "user" ? "text-primary-foreground/60 text-right" : "text-muted-foreground"}`}>
                  {formatTime(msg.created_at)}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex items-end gap-2 pt-3 shrink-0 border-t border-border/50 mt-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Написать сообщение..."
          rows={1}
          className="flex-1 resize-none rounded-2xl border border-border/60 bg-card px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 max-h-28 overflow-y-auto"
          style={{ minHeight: "42px" }}
          onInput={(e) => {
            const el = e.currentTarget;
            el.style.height = "42px";
            el.style.height = `${Math.min(el.scrollHeight, 112)}px`;
          }}
        />
        <Button
          size="icon"
          className="rounded-full w-10 h-10 shrink-0"
          onClick={handleSend}
          disabled={!text.trim() || sending}
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
}
