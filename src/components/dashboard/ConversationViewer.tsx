import { useState, useRef, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
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

// --- Tipos para blocos estruturados ---

interface MessageBlock {
  type: "text" | "tool_use" | "thinking" | "tool_result";
  content: string;
  toolName?: string;
  toolId?: string;
}

interface ParsedMessage {
  role: "user" | "assistant";
  blocks: MessageBlock[];
  timestamp: string;
}

// --- Parsing ---

function parseBlocks(message: Record<string, unknown>): MessageBlock[] {
  const content = message.content;

  if (typeof content === "string") {
    return content.trim() ? [{ type: "text", content }] : [];
  }

  if (!Array.isArray(content)) return [];

  const blocks: MessageBlock[] = [];
  for (const item of content as Array<Record<string, unknown>>) {
    const itemType = item.type as string;

    if (itemType === "text" && typeof item.text === "string") {
      if (item.text.trim()) {
        blocks.push({ type: "text", content: item.text });
      }
    } else if (itemType === "tool_use") {
      const input = item.input ? JSON.stringify(item.input, null, 2) : "";
      blocks.push({
        type: "tool_use",
        content: input,
        toolName: (item.name as string) || "Unknown Tool",
        toolId: item.id as string,
      });
    } else if (itemType === "thinking" && typeof item.thinking === "string") {
      if (item.thinking.trim()) {
        blocks.push({ type: "thinking", content: item.thinking });
      }
    } else if (itemType === "tool_result") {
      const inner = item.content;
      let text = "";
      if (typeof inner === "string") {
        text = inner;
      } else if (Array.isArray(inner)) {
        text = (inner as Array<Record<string, unknown>>)
          .filter((b) => b.type === "text" && typeof b.text === "string")
          .map((b) => b.text as string)
          .join("\n");
      }
      if (text.trim()) {
        blocks.push({
          type: "tool_result",
          content: text,
          toolId: item.tool_use_id as string,
        });
      }
    }
  }

  return blocks;
}

function parseMessages(entries: SessionEntry[]): ParsedMessage[] {
  return entries
    .filter((e) => e.type === "user" || e.type === "assistant")
    .map((e) => ({
      role: e.type as "user" | "assistant",
      blocks: parseBlocks(e.message),
      timestamp: e.timestamp,
    }))
    .filter((m) => {
      if (m.blocks.length === 0) return false;
      // Esconder user messages que so tem tool_result (respostas de ferramentas, nao input real)
      if (m.role === "user" && m.blocks.every((b) => b.type === "tool_result")) return false;
      return true;
    });
}

// --- Componentes auxiliares ---

function CopyButton({ text, className = "" }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className={`p-1 rounded text-muted-subtle hover:text-foreground hover:bg-foreground/10 transition-colors cursor-pointer ${className}`}
      title="Copy"
    >
      <Icon name={copied ? "check" : "content_copy"} className="text-[14px]" />
    </button>
  );
}

function CollapsibleBlock({
  icon,
  label,
  children,
  defaultOpen = false,
}: {
  icon: string;
  label: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-border-subtle rounded-lg my-1.5 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-muted hover:bg-surface/50 transition-colors cursor-pointer"
      >
        <Icon name={icon} size="sm" />
        <span className="font-medium">{label}</span>
        <Icon
          name="expand_more"
          className={`ml-auto text-base transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      <div
        className={`grid transition-[grid-template-rows] duration-200 ease-out ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className="px-3 py-2 text-xs border-t border-border-subtle bg-surface/30">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

// Componentes custom para ReactMarkdown
const markdownComponents = {
  code({ className, children }: { className?: string; children?: React.ReactNode }) {
    const match = /language-(\w+)/.exec(className || "");
    if (!match) {
      return (
        <code className="bg-foreground/[0.06] px-1.5 py-0.5 rounded text-xs font-mono text-foreground border border-foreground/[0.04]">
          {children}
        </code>
      );
    }
    return (
      <div className="relative group my-2">
        <SyntaxHighlighter
          style={oneDark}
          language={match[1]}
          PreTag="div"
          customStyle={{ margin: 0, borderRadius: "0.5rem", fontSize: "12px" }}
        >
          {String(children).replace(/\n$/, "")}
        </SyntaxHighlighter>
        <CopyButton
          text={String(children).replace(/\n$/, "")}
          className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100"
        />
      </div>
    );
  },
  table({ children }: { children?: React.ReactNode }) {
    return (
      <div className="overflow-x-auto my-2">
        <table className="border-collapse border border-border text-xs w-full">{children}</table>
      </div>
    );
  },
  th({ children }: { children?: React.ReactNode }) {
    return <th className="border border-border bg-surface px-3 py-1.5 text-left font-medium">{children}</th>;
  },
  td({ children }: { children?: React.ReactNode }) {
    return <td className="border border-border px-3 py-1.5">{children}</td>;
  },
  a({ href, children }: { href?: string; children?: React.ReactNode }) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
        {children}
      </a>
    );
  },
  pre({ children }: { children?: React.ReactNode }) {
    return <>{children}</>;
  },
};

// Detecta blocos de HTML solto (fora de code fences) e envolve em ```html
function preprocessHtml(text: string): string {
  const lines = text.split("\n");
  const result: string[] = [];
  let inCodeFence = false;
  let inHtmlBlock = false;
  let htmlBuffer: string[] = [];

  const flushHtml = () => {
    if (htmlBuffer.length > 0) {
      // Remove linhas vazias no final do buffer
      while (htmlBuffer.length > 0 && htmlBuffer[htmlBuffer.length - 1].trim() === "") {
        htmlBuffer.pop();
      }
      if (htmlBuffer.length > 0) {
        result.push("```html", ...htmlBuffer, "```");
      }
      htmlBuffer = [];
      inHtmlBlock = false;
    }
  };

  // Detecta linhas que iniciam com tag HTML: <tag, </tag, <!DOCTYPE, <!-- -->
  const htmlTagRegex = /^\s*<(?:\/?[a-zA-Z][a-zA-Z0-9-]*[\s/>]|![a-zA-Z-])/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Controle de code fences existentes
    if (line.trim().startsWith("```")) {
      flushHtml();
      inCodeFence = !inCodeFence;
      result.push(line);
      continue;
    }

    if (inCodeFence) {
      result.push(line);
      continue;
    }

    if (inHtmlBlock) {
      // Dentro de bloco HTML: verifica se o bloco acabou
      // Sai quando: linha vazia + proxima linha nao-vazia sem nenhum < ou >
      if (line.trim() === "") {
        const nextNonEmpty = lines.slice(i + 1).find((l) => l.trim() !== "");
        if (!nextNonEmpty || (!nextNonEmpty.includes("<") && !nextNonEmpty.includes(">"))) {
          flushHtml();
          result.push(line);
          continue;
        }
      }
      htmlBuffer.push(line);
    } else if (htmlTagRegex.test(line)) {
      // Inicio de bloco HTML
      inHtmlBlock = true;
      htmlBuffer.push(line);
    } else {
      result.push(line);
    }
  }

  flushHtml();
  return result.join("\n");
}

function MarkdownContent({ text }: { text: string }) {
  const processed = preprocessHtml(text);
  return (
    <div className="markdown-content">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {processed}
      </ReactMarkdown>
    </div>
  );
}

function BlockRenderer({ block }: { block: MessageBlock }) {
  switch (block.type) {
    case "text":
      return <MarkdownContent text={block.content} />;
    case "tool_use":
      return (
        <CollapsibleBlock icon="build" label={block.toolName || "Tool"}>
          <pre className="whitespace-pre-wrap break-all font-mono text-[11px] text-muted max-h-60 overflow-y-auto">
            {block.content}
          </pre>
        </CollapsibleBlock>
      );
    case "thinking":
      return (
        <CollapsibleBlock icon="psychology" label="Thinking">
          <p className="whitespace-pre-wrap text-muted italic leading-relaxed">{block.content}</p>
        </CollapsibleBlock>
      );
    case "tool_result":
      return (
        <CollapsibleBlock icon="output" label="Tool Result">
          <pre className="whitespace-pre-wrap break-all font-mono text-[11px] text-muted max-h-60 overflow-y-auto">
            {block.content}
          </pre>
        </CollapsibleBlock>
      );
    default:
      return null;
  }
}

// --- Componente de busca ---

function SearchBar({
  value,
  onChange,
  resultCount,
}: {
  value: string;
  onChange: (v: string) => void;
  resultCount: number | null;
}) {
  return (
    <div className="sticky top-0 z-10 bg-bg/80 backdrop-blur-md border-b border-border-subtle px-5 py-2.5">
      <div className="relative group">
        <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-subtle text-base group-focus-within:text-primary transition-colors" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search in conversation..."
          className="w-full pl-9 pr-3 py-1.5 text-xs bg-surface/50 border border-border-subtle rounded-lg text-foreground placeholder:text-muted-subtle focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all font-mono"
        />
        {value && resultCount !== null && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-subtle font-mono">
            {resultCount} {resultCount === 1 ? "match" : "matches"}
          </span>
        )}
      </div>
    </div>
  );
}

// --- Componente principal ---

export function ConversationViewer({ entries, isLoading, error }: ConversationViewerProps) {
  const [limit, setLimit] = useState(INITIAL_LIMIT);
  const [search, setSearch] = useState("");
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 200);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const scrollToBottom = () => {
    containerRef.current?.scrollTo({ top: containerRef.current.scrollHeight, behavior: "smooth" });
  };

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

  const messages = parseMessages(entries);

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-subtle gap-3">
        <Icon name="chat_bubble_outline" className="text-[32px] opacity-40" />
        <p className="text-sm">No messages in this session</p>
      </div>
    );
  }

  // Filtrar por busca
  const searchLower = search.toLowerCase();
  const filtered = search
    ? messages.filter((m) =>
        m.blocks.some((b) => b.content.toLowerCase().includes(searchLower)),
      )
    : messages;

  const visible = filtered.slice(0, limit);
  const hasMore = filtered.length > limit;

  // Texto completo de uma mensagem (para copy)
  const getFullText = (msg: ParsedMessage) =>
    msg.blocks
      .filter((b) => b.type === "text")
      .map((b) => b.content)
      .join("\n");

  return (
    <div ref={containerRef} className="relative h-full overflow-y-auto">
      <SearchBar
        value={search}
        onChange={setSearch}
        resultCount={search ? filtered.length : null}
      />

      <div className="flex flex-col gap-3 p-5">
        {visible.map((msg, i) => {
          const isUser = msg.role === "user";
          const fullText = getFullText(msg);

          return (
            <div
              key={i}
              className={`flex flex-col min-w-0 ${isUser ? "items-end" : "items-start"} max-w-[85%] ${isUser ? "self-end" : "self-start"}`}
            >
              <div className="flex items-center gap-1.5 mb-1 px-1">
                <Icon
                  name={isUser ? "person" : "smart_toy"}
                  className={`text-xs ${isUser ? "text-primary/60" : "text-muted-subtle"}`}
                />
                <span className="text-[10px] text-muted-subtle font-mono font-medium">
                  {isUser ? "You" : "Claude"}
                </span>
                {msg.timestamp && (
                  <span className="text-[10px] text-muted-subtle/50 font-mono">
                    {formatRelativeTime(msg.timestamp)}
                  </span>
                )}
              </div>
              <div
                className={`group relative px-4 py-3 text-sm leading-relaxed overflow-hidden max-w-full ${
                  isUser
                    ? "bg-primary/[0.06] border border-primary/15 rounded-2xl rounded-br-sm text-foreground"
                    : "bg-surface/80 border border-border-subtle rounded-2xl rounded-bl-sm text-foreground-secondary"
                }`}
              >
                {msg.blocks.map((block, j) => <BlockRenderer key={j} block={block} />)}

                {fullText && (
                  <div className="flex justify-end mt-1 -mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <CopyButton text={fullText} />
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {hasMore && (
          <button
            onClick={() => setLimit((l) => l + INITIAL_LIMIT)}
            className="self-center mt-2 px-4 py-2 text-xs font-medium text-primary hover:text-primary-light border border-primary/20 rounded-lg hover:bg-primary/5 transition-colors cursor-pointer"
          >
            Load more ({filtered.length - limit} remaining)
          </button>
        )}
      </div>

      {showScrollBtn && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-4 right-4 p-2.5 bg-primary/90 text-white rounded-full shadow-elevation-3 hover:bg-primary hover:shadow-glow transition-all cursor-pointer z-20 backdrop-blur-sm border border-primary/30"
          title="Scroll to bottom"
        >
          <Icon name="keyboard_arrow_down" size="sm" />
        </button>
      )}
    </div>
  );
}
