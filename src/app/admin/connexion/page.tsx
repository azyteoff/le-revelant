import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { FormulaireConnexion } from "./Formulaire";
import { sessionOuverte } from "@/lib/admin-garde";
import { motDePasseConfigure } from "@/lib/admin-session";
import { Leaf } from "@/components/ui/Logo";

export const metadata: Metadata = {
  title: "Connexion",
  robots: { index: false, follow: false },
};

export default async function ConnexionPage({
  searchParams,
}: {
  searchParams: Promise<{ suite?: string }>;
}) {
  if (await sessionOuverte()) redirect("/admin");

  const { suite } = await searchParams;
  const configure = motDePasseConfigure();

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream-2/50 px-5 py-16">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center">
          <Leaf className="size-7 text-olive" />
          <h1 className="mt-6 font-[family-name:var(--font-display)] text-[2rem]">
            Espace restaurant
          </h1>
          <p className="mt-2.5 text-[0.9375rem] text-ink-3">
            L’ardoise du jour et les commandes.
          </p>
        </div>

        {configure ? (
          <FormulaireConnexion suite={suite} />
        ) : (
          <div className="mt-8 rounded-lg border border-tomato/25 bg-tomato/5 p-6 text-[0.875rem] leading-relaxed text-ink-2">
            <p className="font-medium text-tomato">Back-office non configuré.</p>
            <p className="mt-3">
              Créez un fichier <code className="rounded bg-ink/8 px-1.5 py-0.5">.env.local</code> à
              la racine du projet, avec cette ligne :
            </p>
            <pre className="mt-3 overflow-x-auto rounded-md bg-ink px-3 py-2.5 text-[0.75rem] text-cream">
              ADMIN_PASSWORD=votre-mot-de-passe
            </pre>
            <p className="mt-3">Puis redémarrez le site.</p>
          </div>
        )}
      </div>
    </div>
  );
}
