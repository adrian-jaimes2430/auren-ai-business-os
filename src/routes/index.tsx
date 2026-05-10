import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Hero } from "@/components/site/Hero";
import { Features } from "@/components/site/Features";
import { AISection } from "@/components/site/AISection";
import { Integrations } from "@/components/site/Integrations";
import { Pricing } from "@/components/site/Pricing";
import { CTA } from "@/components/site/CTA";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "AUREN AI — CRM + IA + Omnicanal" },
      { name: "description", content: "El sistema operativo comercial inteligente. CRM, IA, automatización y omnicanal en una sola plataforma." },
    ],
  }),
});

function Landing() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Features />
        <AISection />
        <Integrations />
        <Pricing />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
