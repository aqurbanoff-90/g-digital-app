import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Delete } from "lucide-react";
import { GLogo } from "@/components/gdigital/GLogo";
import { CosmosBg } from "@/components/gdigital/CosmosBg";
import { useFinance } from "@/lib/finance-store";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Вход — G-Digital" },
      { name: "description", content: "Вход в G-Digital — умное управление личными финансами." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { auth, updateAuth, hydrated } = useFinance();
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    if (hydrated && auth.isAuthenticated) {
      navigate({ to: "/accounts" });
    }
  }, [hydrated, auth.isAuthenticated, navigate]);

  const handlePress = (num: string) => {
    if (pin.length < 4 && !error) {
      const newPin = pin + num;
      setPin(newPin);

      if (newPin.length === 4) {
        if (newPin === auth.pin) {
          updateAuth({ isAuthenticated: true });
          setTimeout(() => navigate({ to: "/accounts" }), 200);
        } else {
          setError(true);
          setTimeout(() => {
            setPin("");
            setError(false);
          }, 600);
        }
      }
    }
  };

  const handleDelete = () => {
    if (pin.length > 0 && !error) {
      setPin((p) => p.slice(0, -1));
    }
  };

  return (
    <main
      suppressHydrationWarning
      className="gd-cosmos relative min-h-screen overflow-hidden font-sans text-white"
    >
      <CosmosBg />
      <div className="relative z-10 mx-auto flex min-h-screen max-w-[430px] flex-col items-center px-7 pt-14 pb-6">
        <div className="gd-fade-in flex flex-col items-center">
          <GLogo size={128} />
          <h1 className="mt-5 text-2xl font-semibold tracking-tight [text-shadow:0_0_18px_rgba(139,92,246,0.6)]">
            G-Digital
          </h1>
          <p className="mt-1 text-xs tracking-[0.28em] text-white/60">SMART FINANCIAL MANAGEMENT</p>
        </div>

        <div
          className="mt-12 flex w-full flex-col items-center gap-8 gd-fade-in"
          style={{ animationDelay: "160ms" }}
        >
          <div
            className={`flex gap-4 transition-transform ${error ? "animate-shake text-red-500" : ""}`}
          >
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`h-4 w-4 rounded-full transition-all duration-300 ${
                  i < pin.length
                    ? error
                      ? "bg-red-500 [box-shadow:0_0_12px_rgba(239,68,68,0.8)]"
                      : "bg-violet-400 [box-shadow:0_0_12px_rgba(167,139,250,0.8)]"
                    : "bg-white/10"
                }`}
              />
            ))}
          </div>

          <div className="grid grid-cols-3 gap-x-6 gap-y-4 max-w-[280px] w-full mt-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                onClick={() => handlePress(num.toString())}
                className="neu-surface gd-press flex h-[72px] w-[72px] items-center justify-center rounded-full text-3xl font-light text-white/90 hover:text-white mx-auto"
              >
                {num}
              </button>
            ))}
            <div className="h-[72px] w-[72px]" />
            <button
              onClick={() => handlePress("0")}
              className="neu-surface gd-press flex h-[72px] w-[72px] items-center justify-center rounded-full text-3xl font-light text-white/90 hover:text-white mx-auto"
            >
              0
            </button>
            <button
              onClick={handleDelete}
              className="gd-press flex h-[72px] w-[72px] items-center justify-center rounded-full text-white/60 hover:text-white mx-auto"
            >
              <Delete size={28} />
            </button>
          </div>
        </div>

        <div className="mt-auto pt-10 text-center text-[11px] text-white/50">
          <p className="tracking-[0.18em]">Designed &amp; Developed by GURBANOV</p>
          <p className="mt-1 text-white/40">Version 1.0</p>
        </div>
      </div>
    </main>
  );
}
