import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { GLogo } from "@/components/gdigital/GLogo";
import { CosmosBg } from "@/components/gdigital/CosmosBg";
import { useFinance } from "@/lib/finance-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "G-Digital — Smart Financial Management" },
      {
        name: "description",
        content:
          "G-Digital — умное управление личными финансами: счета, кредиты, долги и расходы в одном приложении.",
      },
      { property: "og:title", content: "G-Digital — Smart Financial Management" },
      { property: "og:description", content: "Умное управление личными финансами." },
    ],
  }),
  component: Splash,
});

function Splash() {
  const navigate = useNavigate();
  const { auth, hydrated } = useFinance();
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleStart = () => {
    if (!hydrated || loading) return;
    setLoading(true);
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / 2200);
      setProgress(p);
      if (p < 1) raf = requestAnimationFrame(tick);
      else {
        if (auth.isAuthenticated) {
          navigate({ to: "/accounts" });
        } else {
          navigate({ to: "/login" });
        }
      }
    };
    raf = requestAnimationFrame(tick);
  };

  return (
    <main className="gd-cosmos relative min-h-screen overflow-hidden font-sans text-white">
      <CosmosBg />
      <div className="relative z-10 mx-auto flex min-h-screen max-w-[430px] flex-col items-center justify-center px-6">
        <div
          className={`gd-fade-in flex flex-col items-center transition-transform ${!loading ? "cursor-pointer hover:scale-105 active:scale-95" : ""}`}
          style={{ animationDelay: "80ms" }}
          onClick={handleStart}
        >
          <div className={!loading ? "animate-pulse-glow" : ""}>
            <GLogo size={160} />
          </div>
          <h1 className="mt-6 text-3xl font-semibold tracking-tight text-white/95 [text-shadow:0_0_24px_rgba(139,92,246,0.6)]">
            G-Digital
          </h1>
          {!loading && (
            <p className="mt-4 animate-pulse-glow text-[11px] uppercase tracking-widest text-violet-300">
              Нажмите на логотип, чтобы войти
            </p>
          )}
        </div>
        {loading && (
          <div className="absolute bottom-16 w-64 gd-fade-in" style={{ animationDelay: "100ms" }}>
            <div className="neu-inset h-2 w-full overflow-hidden rounded-full">
              <div
                className="h-full rounded-full bg-gradient-to-r from-pink-500 via-fuchsia-500 to-violet-500 [box-shadow:0_0_18px_rgba(236,72,153,0.7)]"
                style={{ width: `${progress * 100}%`, transition: "width 60ms linear" }}
              />
            </div>
            <p className="mt-3 text-center text-xs tracking-[0.3em] text-white/60">LOADING...</p>
          </div>
        )}
      </div>
    </main>
  );
}
