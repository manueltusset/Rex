import { useState, useCallback, useRef } from "react";
import { readSession } from "@/services/api";
import { useConnectionStore } from "@/stores/useConnectionStore";
import type { SessionEntry } from "@/types/session";

interface UseConversationReturn {
  entries: SessionEntry[];
  isLoading: boolean;
  error: string | null;
  load: (sessionId: string, projectPath: string) => Promise<void>;
  reset: () => void;
}

export function useConversation(): UseConversationReturn {
  const [entries, setEntries] = useState<SessionEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadId = useRef(0);

  const load = useCallback(async (sessionId: string, projectPath: string) => {
    const { claudeDir, useWsl, wslDistro } = useConnectionStore.getState();
    if (!claudeDir) return;

    // Re-encode: "Home/User/project" -> "Home-User-project"
    const encodedProject = projectPath.replace(/\//g, "-");
    const sessionPath = `${claudeDir}/projects/${encodedProject}/${sessionId}.jsonl`;

    const currentId = ++loadId.current;
    setIsLoading(true);
    setError(null);

    try {
      const result = await readSession(sessionPath, useWsl, wslDistro || undefined);
      // Ignora se outra chamada foi feita depois
      if (currentId !== loadId.current) return;
      setEntries(result);
    } catch (e) {
      if (currentId !== loadId.current) return;
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      if (currentId === loadId.current) {
        setIsLoading(false);
      }
    }
  }, []);

  const reset = useCallback(() => {
    loadId.current++;
    setEntries([]);
    setIsLoading(false);
    setError(null);
  }, []);

  return { entries, isLoading, error, load, reset };
}
