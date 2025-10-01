import { ReactNode } from "react";

export default function StickySectionHeader({
  id,
  icon,
  title,
  actions,
}: {
  id?: string;
  icon?: ReactNode;
  title: string;
  actions?: ReactNode;
}) {
  return (
    <div
      id={id}
      className="sticky top-[calc(env(safe-area-inset-top)+8px)] z-40 md:static
                 -mx-4 px-4 py-2 backdrop-blur supports-[backdrop-filter]:bg-slate-900/60
                 bg-slate-900/90 md:bg-transparent border-b border-white/5 md:border-0"
      role="heading"
      aria-level={2}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-slate-200 font-semibold">{title}</span>
        </div>
        {actions}
      </div>
    </div>
  );
}