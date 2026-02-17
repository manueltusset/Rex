import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { Spinner } from "@/components/ui/Spinner";
import { formatRelativeTime } from "@/utils/formatters";
import type { SessionEntry } from "@/types/session";

interface ConversationViewerProps {
  entries: SessionEntry[];
  isLoading: boolean;
  error: string | null;
}

const INITIAL_LIMIT = 500;

function extractText(message: Record<string, unknown>): string {
  const content = message.content;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return (content as Array<Record<string, unknown>>)
      .filter((item) => item.type === "text" && typeof item.text === "string")
      .map((item) => item.text as string)
      .join("\n");
  }
  return "";
}

export function ConversationViewer({
  entries,
  isLoading,
  error,
}: ConversationViewerProps) {
  const [limit, setLimit] = useState(INITIAL_LIMIT);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center gap-3 py-20 text-danger">
        <Icon name="error_outline" />
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  // Filtra apenas user/assistant com texto
  const messages = entries
    .filter((e) => e.type === "user" || e.type === "assistant")
    .map((e) => ({
      type: e.type as "user" | "assistant",
      text: extractText(e.message),
      timestamp: e.timestamp,
    }))
    .filter((m) => m.text.trim().length > 0);

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-subtle">
        <p className="text-sm">No messages in this session</p>
      </div>
    );
  }

  const visible = messages.slice(0, limit);
  const hasMore = messages.length > limit;

  return (
    <div className="flex flex-col gap-3 p-5">
      {visible.map((msg, i) => {
        const isUser = msg.type === "user";
        return (
          <div
            key={i}
            className={`flex flex-col min-w-0 ${isUser ? "items-end" : "items-start"} max-w-[85%] ${isUser ? "self-end" : "self-start"}`}
          >
            <span className="text-[10px] text-muted-subtle mb-1 px-1 font-mono">
              {isUser ? "You" : "Claude"}
              {msg.timestamp && (
                <span className="ml-2 opacity-60">
                  {formatRelativeTime(msg.timestamp)}
                </span>
              )}
            </span>
            <div
              className={`px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap break-all overflow-hidden max-w-full ${
                isUser
                  ? "bg-primary/10 border border-primary/20 rounded-xl rounded-br-sm text-foreground"
                  : "bg-surface border border-border-subtle rounded-xl rounded-bl-sm text-foreground-secondary"
              }`}
            >
              {msg.text}
            </div>
          </div>
        );
      })}

      {hasMore && (
        <button
          onClick={() => setLimit((l) => l + INITIAL_LIMIT)}
          className="self-center mt-2 px-4 py-2 text-xs font-medium text-primary hover:text-primary-light border border-primary/20 rounded-lg hover:bg-primary/5 transition-colors cursor-pointer"
        >
          Load more ({messages.length - limit} remaining)
        </button>
      )}
    </div>
  );
}
