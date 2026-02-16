import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ConnectionForm } from "@/components/connection/ConnectionForm";
import { DirectoryPicker } from "@/components/connection/DirectoryPicker";
import { TitleBar } from "@/components/layout/TitleBar";
import { useConnectionStore } from "@/stores/useConnectionStore";
import { ROUTES, APP_VERSION } from "@/utils/constants";

type Step = "connect" | "directory";

export function ConnectionPage() {
  const navigate = useNavigate();
  const { isConnected, claudeDir } = useConnectionStore();
  const [step, setStep] = useState<Step>(
    isConnected && !claudeDir ? "directory" : "connect",
  );

  const handleConnectionSuccess = () => {
    setStep("directory");
  };

  const handleDirectoryComplete = () => {
    navigate(ROUTES.DASHBOARD, { replace: true });
  };

  return (
    <div className="h-screen flex flex-col bg-bg-dark overflow-hidden">
      <TitleBar />
      <div className="flex-1 flex items-center justify-center relative overflow-hidden">
        {/* Background decorativo */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary-light/10 rounded-full blur-[120px]" />
        </div>

        <div className="w-full max-w-md p-4 relative z-10">
          <div className="bg-card-dark rounded-xl border border-border-dark shadow-xl overflow-hidden">
            <div className="p-8 pb-6 text-center border-b border-slate-800/50">
              <div className="w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                <img
                  src="/rex-logo.png"
                  alt="Rex"
                  className="w-full h-full object-contain drop-shadow-lg hover:scale-105 transition-transform duration-300"
                />
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                {step === "connect"
                  ? "Connect to Claude Code"
                  : "Configure Directory"}
              </h1>
              <p className="text-slate-400 mt-2 text-sm">
                {step === "connect"
                  ? "Rex will detect your CLI credentials automatically."
                  : "Select where your Claude Code data is stored."}
              </p>
            </div>

            <div className="p-8">
              {step === "connect" ? (
                <ConnectionForm onSuccess={handleConnectionSuccess} />
              ) : (
                <DirectoryPicker onComplete={handleDirectoryComplete} />
              )}
            </div>

            <div className="px-8 pb-6 flex justify-center gap-2">
              <div
                className={`w-2 h-2 rounded-full transition-colors ${step === "connect" ? "bg-primary-light" : "bg-slate-700"}`}
              />
              <div
                className={`w-2 h-2 rounded-full transition-colors ${step === "directory" ? "bg-primary-light" : "bg-slate-700"}`}
              />
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-xs text-slate-600 font-mono">
              Rex Companion App v{APP_VERSION}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
