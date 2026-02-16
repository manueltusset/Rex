import { useState, useEffect, useCallback } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { isMacOS } from "@/lib/platform";

const appWindow = getCurrentWindow();

function handleTitleBarMouseDown(e: React.MouseEvent) {
  if ((e.target as HTMLElement).closest("button")) return;
  if (e.buttons === 1) {
    e.preventDefault();
    appWindow.startDragging();
  }
}

function WindowControlsLinux({
  maximized,
  onMinimize,
  onMaximize,
  onClose,
}: {
  maximized: boolean;
  onMinimize: () => void;
  onMaximize: () => void;
  onClose: () => void;
}) {
  return (
    <div className="flex items-center h-full">
      <button
        onClick={onMinimize}
        className="w-12 h-full flex items-center justify-center text-slate-400 hover:bg-slate-700/50 transition-colors"
        title="Minimize"
      >
        <svg width="10" height="1" viewBox="0 0 10 1" fill="currentColor">
          <rect width="10" height="1" />
        </svg>
      </button>
      <button
        onClick={onMaximize}
        className="w-12 h-full flex items-center justify-center text-slate-400 hover:bg-slate-700/50 transition-colors"
        title={maximized ? "Restore" : "Maximize"}
      >
        {maximized ? (
          <svg
            width="10"
            height="10"
            viewBox="0 0 10 10"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
          >
            <rect x="2" y="0" width="8" height="8" rx="0.5" />
            <rect x="0" y="2" width="8" height="8" rx="0.5" />
          </svg>
        ) : (
          <svg
            width="10"
            height="10"
            viewBox="0 0 10 10"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
          >
            <rect x="0.5" y="0.5" width="9" height="9" rx="0.5" />
          </svg>
        )}
      </button>
      <button
        onClick={onClose}
        className="w-12 h-full flex items-center justify-center text-slate-400 hover:bg-red-500 hover:text-white transition-colors"
        title="Close"
      >
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
        >
          <line x1="0" y1="0" x2="10" y2="10" />
          <line x1="10" y1="0" x2="0" y2="10" />
        </svg>
      </button>
    </div>
  );
}

// macOS: titlebar nativo overlay com traffic lights nativos
export function TitleBar() {
  if (isMacOS()) {
    return (
      <div
        className="h-8 shrink-0"
        onMouseDown={(e) => {
          if (e.buttons === 1) {
            e.preventDefault();
            appWindow.startDragging();
          }
        }}
        onDoubleClick={() => appWindow.toggleMaximize()}
      />
    );
  }

  return <CustomTitleBar />;
}

// Windows/Linux: titlebar customizado com controles de janela
function CustomTitleBar() {
  const [maximized, setMaximized] = useState(false);

  useEffect(() => {
    appWindow.isMaximized().then(setMaximized);

    const unlisten = appWindow.onResized(() => {
      appWindow.isMaximized().then(setMaximized);
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  const handleMinimize = useCallback(() => appWindow.minimize(), []);
  const handleMaximize = useCallback(() => appWindow.toggleMaximize(), []);
  const handleClose = useCallback(() => appWindow.close(), []);

  return (
    <div
      onMouseDown={handleTitleBarMouseDown}
      onDoubleClick={(e) => {
        if (!(e.target as HTMLElement).closest("button")) handleMaximize();
      }}
      className="h-8 flex items-center shrink-0 select-none flex-row-reverse"
    >
      <WindowControlsLinux
        maximized={maximized}
        onMinimize={handleMinimize}
        onMaximize={handleMaximize}
        onClose={handleClose}
      />
      <div className="flex-1 h-full" />
    </div>
  );
}
