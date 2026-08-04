export function CosmosBg() {
  return (
    <>
      <div className="gd-stars" aria-hidden />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(600px 400px at 20% 15%, rgba(139,92,246,0.35), transparent 70%), radial-gradient(500px 400px at 85% 80%, rgba(236,72,153,0.25), transparent 70%)",
        }}
      />
    </>
  );
}
