import { Hero } from "@/components/home/Hero";
import { Recipes } from "@/components/home/Recipes";
import { PlatsDuJour } from "@/components/home/PlatsDuJour";
import {
  Manifesto,
  SaladBar,
  Repertoire,
  HowItWorks,
  Reviews,
  Place,
} from "@/components/home/Sections";

export default function Home() {
  return (
    <>
      <Hero />
      <Manifesto />
      {/* Salades et plats chauds se suivent immédiatement : c'est l'offre
          du midi, en deux temps de même importance. */}
      <Recipes />
      <PlatsDuJour />
      <SaladBar />
      <Repertoire />
      <HowItWorks />
      <Reviews />
      <Place />
    </>
  );
}
