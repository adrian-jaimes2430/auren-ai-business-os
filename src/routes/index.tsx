import { createFileRoute } from "@tanstack/react-router";
import "@/styles/story.css";
import { StoryNav } from "@/components/site/story/StoryNav";
import { StoryHero } from "@/components/site/story/StoryHero";
import { StoryFeatures } from "@/components/site/story/StoryFeatures";
import { StoryAI } from "@/components/site/story/StoryAI";
import { StoryIntegrations } from "@/components/site/story/StoryIntegrations";
import { StoryPricing } from "@/components/site/story/StoryPricing";
import { StoryCTA } from "@/components/site/story/StoryCTA";
import { StoryFooter } from "@/components/site/story/StoryFooter";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "AUREN AI — CRM + IA + Omnicanal" },
      {
        name: "description",
        content:
          "El sistema operativo comercial inteligente. CRM, IA, automatización y omnicanal en una sola plataforma.",
      },
      { property: "og:title", content: "AUREN AI — CRM + IA + Omnicanal" },
      {
        property: "og:description",
        content:
          "Unifica CRM, inteligencia artificial, automatización y todos tus canales en un solo sistema operativo comercial.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;700&display=swap",
      },
    ],
  }),
});

function Landing() {
  return (
    <div className="story-home">
      <StoryNav />
      <main>
        <StoryHero />
        <StoryFeatures />
        <StoryAI />
        <StoryIntegrations />
        <StoryPricing />
        <StoryCTA />
      </main>
      <StoryFooter />
    </div>
  );
}
