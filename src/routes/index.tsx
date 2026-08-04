import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { GLogo } from "@/components/gdigital/GLogo";
import { CosmosBg } from "@/components/gdigital/CosmosBg";
import { useFinance } from "@/lib/finance-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "G-Digital - Smart Financial Management" },
      {
        name: "description",
        content:
          "G-Digital - умное управление личными финансами: контроль расходов и доходов",
      },
      { property: "og:title", content: "G-Digital - Smart Financial Management" },
      { property: "og:description", content: "Умное управление личными финансами" },
      {
        name: "apple-mobile-web-app-capable",
        content: "yes",
      },
      {
        name: "apple-mobile-web-app-status-bar-style",
        content: "black-translucent",
      },
      {
        name: "apple-mobile-web-app-title",
        content: "G-Digital",
      },
      {
        name: "theme-color",
        content: "#000000",
      },
    ],
    links: [
      { rel: "manifest", href: "/manifest.json" },
      { rel: "apple-touch-icon", href: "/icon-512.png" },
      { rel: "icon", href: "/icon-192.png" },
    ],
  }),
  component: Splash,
});

function Splash() {
  const navigate = useNavigate();
  const { isLoaded } = useFinance();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setReady(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (ready && isLoaded) {
      navigate({ to: "/dashboard" });
    }
  }, [ready, isLoaded, navigate]);

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-black">
      <CosmosBg />
      <div className="z-10 flex flex
