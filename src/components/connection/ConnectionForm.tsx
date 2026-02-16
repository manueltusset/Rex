import { useState, useEffect } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Spinner } from "@/components/ui/Spinner";
import { useConnectionStore } from "@/stores/useConnectionStore";
import { usePlatform } from "@/hooks/usePlatform";

interface ConnectionFormProps {
  onSuccess: () => void;
}

function getCredentialHint(isMac: boolean, isLinux: boolean): string {
  if (isMac) {
    return 'Run: security find-generic-password -s "Claude Code-credentials" -w';
  }
  if (isLinux) {
    return "Extract accessToken from ~/.claude/.credentials.json";
  }
  return "Extract accessToken from %USERPROFILE%\\.claude\\.credentials.json";
}

export function ConnectionForm({ onSuccess }: ConnectionFormProps) {
  const { connect, autoConnect, isLoading, error } = useConnectionStore();
  const { isMac, isLinux } = usePlatform();
  const [token, setToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [autoDetecting, setAutoDetecting] = useState(true);
  const [autoFailed, setAutoFailed] = useState(false);

  // Tenta auto-detectar o token ao montar
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const success = await autoConnect();
      if (cancelled) return;
      if (success) {
        onSuccess();
      } else {
        setAutoDetecting(false);
        setAutoFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) return;
    try {
      await connect("", token.trim());
      onSuccess();
    } catch {
      // Erro ja tratado no store
    }
  };

  if (autoDetecting) {
    return (
      <div className="flex flex-col items-center gap-4 py-6">
        <Spinner />
        <p className="text-sm text-muted">
          Detecting Claude Code credentials...
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {autoFailed && (
        <div className="flex items-start gap-3 p-3 bg-warning/10 rounded-lg border border-warning/20">
          <Icon name="info" className="text-warning mt-0.5" />
          <p className="text-xs text-foreground-secondary leading-relaxed">
            Could not auto-detect credentials.{" "}
            <span className="text-foreground font-mono text-[11px]">
              {getCredentialHint(isMac, isLinux)}
            </span>
          </p>
        </div>
      )}

      <Input
        label="OAuth Token"
        type={showToken ? "text" : "password"}
        value={token}
        onChange={(e) => setToken(e.target.value)}
        icon={<Icon name="key" />}
        helpText='OAuth token from Claude Code CLI (starts with "sk-ant-"). Not a browser session key.'
        error={error ?? undefined}
        endAdornment={
          <button
            type="button"
            onClick={() => setShowToken(!showToken)}
            className="text-muted hover:text-foreground-secondary cursor-pointer"
          >
            <Icon name={showToken ? "visibility" : "visibility_off"} />
          </button>
        }
      />

      <Button
        type="submit"
        disabled={isLoading || !token.trim()}
        className="w-full py-3"
      >
        {isLoading ? (
          <Spinner size="sm" />
        ) : (
          <>
            <Icon name="link" />
            Connect
          </>
        )}
      </Button>

      <div className="flex items-start gap-3 p-3 bg-surface rounded-lg border border-border">
        <Icon name="lock" className="text-primary mt-0.5" />
        <p className="text-xs text-muted leading-relaxed">
          Your credentials are stored locally on your device using Tauri's
          secure storage system. They are never sent to external servers.
        </p>
      </div>
    </form>
  );
}
