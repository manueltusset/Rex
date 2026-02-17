import { NavLink } from "react-router-dom";
import { Icon } from "@/components/ui/Icon";
import { ROUTES, APP_VERSION } from "@/utils/constants";
import { useConnectionStore } from "@/stores/useConnectionStore";

const navItems = [
  { to: ROUTES.DASHBOARD, icon: "dashboard", label: "Dashboard" },
  { to: ROUTES.HISTORY, icon: "history", label: "History" },
  { to: ROUTES.PROJECTS, icon: "folder_open", label: "Projects" },
  { to: ROUTES.USAGE, icon: "bar_chart", label: "Usage & Limits" },
  { to: ROUTES.MCP, icon: "hub", label: "MCP Servers" },
];

export function Sidebar() {
  const { orgId, disconnect } = useConnectionStore();

  return (
    <aside className="w-64 shrink-0 bg-sidebar border-r border-border-subtle flex flex-col justify-between h-full backdrop-blur-sm">
      <div className="p-6">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-dark/20 to-primary/10 flex items-center justify-center border border-primary/20 shadow-[0_0_15px_rgba(16,185,129,0.15)] overflow-hidden p-1">
            <img
              src="/rex-logo.png"
              alt="Rex"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <h1 className="font-bold text-xl tracking-tight text-foreground leading-none font-display">
              Rex
            </h1>
            <span className="text-[10px] text-muted-subtle font-medium tracking-[0.2em] uppercase mt-0.5 block">
              Companion
            </span>
          </div>
        </div>

        {/* Navegacao */}
        <nav className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === ROUTES.DASHBOARD}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all ${
                  isActive
                    ? "bg-primary/10 border border-primary/20 text-primary"
                    : "text-muted hover:text-foreground hover:bg-foreground/5"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    name={item.icon}
                    size="sm"
                    className={
                      isActive
                        ? "text-primary"
                        : "group-hover:text-primary transition-colors"
                    }
                  />
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="p-4 border-t border-border-subtle">
        <NavLink
          to={ROUTES.SETTINGS}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all mb-4 group ${
              isActive
                ? "bg-primary/10 text-primary"
                : "text-muted hover:text-foreground hover:bg-foreground/5"
            }`
          }
        >
          <Icon name="settings" size="sm" />
          Settings
        </NavLink>

        <div className="glass-panel p-3 rounded-lg flex items-center gap-3 hover:border-primary/30 transition-colors cursor-pointer group">
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-primary-dark/40 flex items-center justify-center ring-1 ring-border">
              <Icon name="person" size="sm" className="text-primary-light" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-bg rounded-full flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
              {orgId ? `${orgId.substring(0, 16)}...` : "Connected"}
            </p>
            <button
              onClick={() => disconnect()}
              className="text-[10px] text-muted-subtle hover:text-danger transition-colors cursor-pointer uppercase tracking-wide"
            >
              Disconnect
            </button>
          </div>
        </div>

        <p className="mt-4 text-center text-[10px] text-muted-subtle font-mono">
          Rex v{APP_VERSION}
        </p>
      </div>
    </aside>
  );
}
