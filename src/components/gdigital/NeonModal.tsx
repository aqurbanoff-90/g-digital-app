import { X } from "lucide-react";
import type { ReactNode } from "react";

export function NeonModal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 px-4 pb-6 backdrop-blur-sm">
      <div className="neu-surface gd-fade-in w-full max-w-[430px] rounded-3xl p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть"
            className="neu-inset gd-press flex h-8 w-8 items-center justify-center rounded-xl text-white/70"
          >
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function NeonField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] tracking-widest text-white/50">{label}</span>
      {children}
    </label>
  );
}

export const neonInputClass =
  "neu-inset w-full rounded-xl bg-transparent px-3 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:ring-1 focus:ring-violet-400/60";

export const neonSubmitClass =
  "gd-press neon-violet mt-4 w-full rounded-2xl bg-violet-600/80 py-3 text-sm font-semibold text-white";
