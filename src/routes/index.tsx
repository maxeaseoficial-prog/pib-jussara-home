import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { ChurchIntro } from "@/components/ChurchIntro";
import { Leadership } from "@/components/Leadership";
import { UpcomingEvents } from "@/components/UpcomingEvents";
import { Mission } from "@/components/Mission";
import { Transmissions } from "@/components/Transmissions";
import { Community } from "@/components/Community";
import { VisitUs } from "@/components/VisitUs";
import { FinalCTA } from "@/components/FinalCTA";
import { Footer } from "@/components/Footer";

const title = "PIB Jussara — Primeira Igreja Batista de Jussara - GO";
const description =
  "Uma igreja para viver a fé, construir comunhão e transformar vidas. Conheça a Primeira Igreja Batista de Jussara - GO: cultos, programação e transmissões.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <ChurchIntro />
        <Leadership />
        <UpcomingEvents />
        <Mission />
        <Transmissions />
        <Community />
        <VisitUs />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
