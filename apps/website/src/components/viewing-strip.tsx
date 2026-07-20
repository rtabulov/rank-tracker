export function ViewingStrip({ displayName }: { displayName: string }) {
  return (
    <div
      aria-label="Viewing"
      className="mx-auto mb-4 flex w-full max-w-lg items-center justify-between gap-2 border border-hud-magenta/35 bg-card/60 px-3 py-2"
    >
      <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-hud-magenta">Viewing</p>
      <p className="font-heading text-sm tracking-[0.15em] text-foreground">{displayName}</p>
    </div>
  );
}
