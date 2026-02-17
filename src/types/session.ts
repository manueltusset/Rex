export interface SessionMeta {
  id: string;
  project_path: string;
  project_display: string;
  summary: string;
  last_timestamp: string;
  message_count: number;
}

export interface SessionEntry {
  type: string;
  message: Record<string, unknown>;
  timestamp: string;
}

export interface SearchMatch {
  session: SessionMeta;
  matched_text: string;
  entry_type: string;
  match_count: number;
}

export interface PlatformInfo {
  os: string;
  is_wsl_available: boolean;
  default_claude_dir: string;
  wsl_distros: string[];
  wsl_distro: string | null;
  wsl_claude_dir: string | null;
}
