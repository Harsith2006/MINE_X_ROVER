// AuraBackground — "Champagne Glass" atmospheric backdrop.
// Background only: no text, no demo content. Real content goes in {children},
// which renders in a relative z-1 wrapper above the absolute layers.
//
// Blend architecture (must stay intact):
// - The container is TRANSPARENT — never give it a background.
// - The base color (#faf8f2) lives on <body data-theme="light"> (see index.css).
// - Layers composite against the body background via mix-blend-mode.
// - When `active` is false (dark mode) only children render — no layers, no cost.
export default function AuraBackground({ active, children }) {
  if (!active) return <>{children}</>;

  return (
    <div className="aura-bg">
      <div className="aura-layer-1" aria-hidden="true" />
      <div className="aura-layer-2" aria-hidden="true" />
      <div className="aura-layer-3" aria-hidden="true" />
      <div className="aura-layer-4" aria-hidden="true" />
      <div className="aura-content">{children}</div>
    </div>
  );
}
