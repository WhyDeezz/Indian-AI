import { cn } from "@/lib/utils.js";

const StateCard = ({ state, selected, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-xl border bg-panel p-4 transition-all",
        "hover:border-map-active hover:shadow-md",
        selected ? "border-map-active ring-2 ring-map-active/30" : "border-panel-border"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-lg">
            {state.emoji}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-live opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-live" />
              </span>
              <h3 className="font-semibold text-foreground truncate">{state.name}</h3>
              <span className="text-sm text-muted-foreground truncate">{state.native}</span>
              {state.isNew && (
                <span className="rounded-md bg-live px-1.5 py-0.5 text-[10px] font-semibold uppercase text-white">
                  New
                </span>
              )}
            </div>
            <p className="mt-1 text-sm font-medium text-map-active">{state.nickname}</p>
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
              {state.tags.map((t) => (
                <span key={t}>{t}</span>
              ))}
            </div>
          </div>
        </div>
        <div className="shrink-0 text-sm font-medium text-foreground/80">
          🌡️ {state.temp}°C
        </div>
      </div>
    </button>
  );
};

export default StateCard;