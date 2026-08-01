import { Component, type ReactNode } from "react";

export function SettingsErrorFallback({ error }: { error: Error }) {
  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <h2 className="text-xl font-black text-slate-900">เกิดข้อผิดพลาด</h2>
      <p className="mt-2 text-sm text-slate-600 break-words">{error?.message || "Unknown error"}</p>
      <button
        onClick={() => window.location.reload()}
        className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
      >
        รีโหลดหน้า
      </button>
    </div>
  );
}

export class SettingsBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error) { console.error("[admin.settings]", error); }
  render() {
    if (this.state.error) return <SettingsErrorFallback error={this.state.error} />;
    return this.props.children;
  }
}
