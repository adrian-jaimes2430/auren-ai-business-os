import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Pricing } from "@/components/site/Pricing";

export const Route = createFileRoute("/pricing")({
  component: PricingPage,
  head: () => ({
    meta: [
      { title: "Precios — AUREN AI" },
      { name: "description", content: "Planes Starter, Pro y Enterprise. Mensual o anual." },
    ],
  }),
});

function PricingPage() {
  return (
    <>
      <Navbar />
      <main className="pt-32">
        <div className="text-center max-w-2xl mx-auto px-6">
          <div className="text-xs text-primary uppercase tracking-widest">Precios</div>
          <h1 className="mt-3 font-display text-5xl md:text-6xl font-semibold">
            Elige tu <span className="text-gradient-primary">plan</span>
          </h1>
          <p className="mt-4 text-muted-foreground">Sin permanencia. Cancela cuando quieras.</p>
        </div>
        <Pricing heading={false} />
      </main>
      <Footer />
    </>
  );
}
