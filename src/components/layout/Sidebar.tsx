import { NavLink } from "react-router-dom";
import { Icon } from "@/components/ui/Icon";
import { ROUTES, APP_VERSION } from "@/utils/constants";
import { useConnectionStore } from "@/stores/useConnectionStore";
import { useAccountStore } from "@/stores/useAccountStore";

const navItems = [
  { to: ROUTES.DASHBOARD, icon: "dashboard", label: "Dashboard" },
  { to: ROUTES.HISTORY, icon: "history", label: "History" },
  { to: ROUTES.PROJECTS, icon: "folder_open", label: "Projects" },
  { to: ROUTES.USAGE, icon: "bar_chart", label: "Usage & Limits" },
  { to: ROUTES.MCP, icon: "hub", label: "MCP Servers" },
  { to: ROUTES.SKILLS, icon: "auto_fix_high", label: "Skills" },
];

export function Sidebar() {
  const { orgId, disconnect } = useConnectionStore();
  const account = useAccountStore((s) => s.account);

  return (
    <aside
      className="w-60 shrink-0 flex flex-col justify-between h-full backdrop-blur-xl border-r"
      style={{
        background: "var(--sidebar-bg)",
        borderColor: "var(--border)",
      }}
    >
      <div className="p-5">
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-7">
          <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0">
            <img
              src="/rex-logo.png"
              alt="Rex"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <h1
              className="font-semibold text-base text-foreground leading-tight"
              style={{ letterSpacing: "-0.3px" }}
            >
              Rex
            </h1>
            <span className="text-[10px] text-muted" style={{ letterSpacing: "0.04em" }}>
              Claude Code Dashboard
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px mb-5" style={{ background: "var(--border)" }} />

        {/* Navigation */}
        <nav className="space-y-0.5">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === ROUTES.DASHBOARD}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? "bg-[#0071e3]/10 text-[#0071e3] font-medium"
                    : "text-muted hover:text-foreground hover:bg-foreground/[0.04] font-normal"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    name={item.icon}
                    size="sm"
                    className={isActive ? "text-[#0071e3]" : ""}
                  />
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="p-4">
        <div className="h-px mb-3" style={{ background: "var(--border)" }} />

        <NavLink
          to={ROUTES.SETTINGS}
          className={({ isActive }) =>
            `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors mb-3 ${
              isActive
                ? "bg-[#0071e3]/10 text-[#0071e3] font-medium"
                : "text-muted hover:text-foreground hover:bg-foreground/[0.04] font-normal"
            }`
          }
        >
          <Icon name="settings" size="sm" />
          Settings
        </NavLink>

        {/* Account card */}
        <div
          className="px-3 py-2.5 rounded-lg flex items-center gap-2.5 cursor-pointer transition-colors hover:bg-foreground/[0.04]"
        >
          <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 bg-[#0071e3]/15">
            <Icon name="person" size="sm" className="text-[#0071e3]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-medium text-foreground truncate" style={{ letterSpacing: "-0.15px" }}>
              {account?.displayName || (orgId ? `${orgId.substring(0, 16)}...` : "Connected")}
            </p>
            {account?.emailAddress ? (
              <p className="text-[11px] text-muted truncate">{account.emailAddress}</p>
            ) : (
              <button
                onClick={() => disconnect()}
                className="text-[11px] text-muted hover:text-[#ff3b30] transition-colors cursor-pointer"
              >
                Disconnect
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-[10px] text-muted-subtle mt-3" style={{ letterSpacing: "0.04em" }}>
          v{APP_VERSION}
        </p>
      </div>
    </aside>
  );
}
