import { useState, useEffect } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { Button } from "@/components/ui/Button";
import { Toggle } from "@/components/ui/Toggle";
import { Icon } from "@/components/ui/Icon";
import { usePlatform } from "@/hooks/usePlatform";
import { useConnectionStore } from "@/stores/useConnectionStore";

interface DirectoryPickerProps {
  onComplete: () => void;
}

export function DirectoryPicker({ onComplete }: DirectoryPickerProps) {
  const { isWindows, isWslAvailable, defaultClaudeDir } = usePlatform();
  const { setClaudeDir, setUseWsl } = useConnectionStore();
  const [dir, setDir] = useState("");
  const [wsl, setWsl] = useState(false);

  useEffect(() => {
    if (defaultClaudeDir) {
      setDir(defaultClaudeDir);
    }
  }, [defaultClaudeDir]);

  const handleBrowse = async () => {
    const selected = await open({
      directory: true,
      multiple: false,
      title: "Select .claude directory",
      defaultPath: dir || undefined,
    });
    if (selected) {
      setDir(selected);
    }
  };

  const handleConfirm = async () => {
    if (!dir.trim()) return;
    await setClaudeDir(dir.trim());
    if (isWindows) {
      await setUseWsl(wsl);
    }
    onComplete();
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-white mb-2">
          Claude Directory
        </h3>
        <p className="text-sm text-slate-400">
          Select where your{" "}
          <code className="bg-slate-800 px-1.5 py-0.5 rounded text-xs font-mono text-primary-light">
            .claude
          </code>{" "}
          directory is located.
        </p>
      </div>

      {/* Seletor de diretorio */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-300">
          Directory Path
        </label>
        <button
          type="button"
          onClick={handleBrowse}
          className="w-full flex items-center gap-3 px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg hover:border-primary/40 hover:bg-slate-800/80 transition-colors text-left cursor-pointer group"
        >
          <Icon
            name="folder_open"
            className="text-slate-400 group-hover:text-primary-light transition-colors"
          />
          <span
            className={`flex-1 truncate text-sm font-mono ${dir ? "text-white" : "text-slate-500"}`}
          >
            {dir || "Click to select directory..."}
          </span>
          <Icon
            name="chevron_right"
            size="sm"
            className="text-slate-500 group-hover:text-slate-300 transition-colors"
          />
        </button>
      </div>

      {isWindows && isWslAvailable && (
        <Toggle
          checked={wsl}
          onChange={setWsl}
          label="WSL Mode"
          description="Enable if Claude Code runs inside Windows Subsystem for Linux"
        />
      )}

      {isWindows && wsl && (
        <div className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg border border-slate-800">
          <Icon name="info" className="text-primary-light mt-0.5" />
          <p className="text-xs text-slate-400 leading-relaxed">
            In WSL mode, the path should be a Linux path (e.g.,
            /home/user/.claude). Resume will open sessions in a WSL terminal.
          </p>
        </div>
      )}

      <Button
        onClick={handleConfirm}
        disabled={!dir.trim()}
        className="w-full py-3"
      >
        <Icon name="check_circle" />
        Confirm Directory
      </Button>
    </div>
  );
}
