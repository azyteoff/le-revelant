import { blobActif, peutEcrire } from "@/lib/stockage";

/**
 * Le bandeau qu'on espère ne jamais voir.
 *
 * Sur un hébergement sans disque inscriptible et sans stockage branché, le
 * back-office accepte les clics mais ne garde rien. Plutôt que de laisser le
 * restaurant s'en apercevoir en perdant une ardoise, on fait un vrai
 * aller-retour d'écriture au chargement et on le dit franchement.
 */
export async function Alerte() {
  if (await peutEcrire()) return null;

  return (
    <div className="border-b border-tomato/30 bg-tomato/8">
      <div className="mx-auto w-full max-w-5xl px-5 py-3 md:px-8">
        <p className="text-[0.875rem] leading-relaxed text-ink-2">
          <strong className="font-semibold text-tomato">
            Vos modifications ne seront pas conservées.
          </strong>{" "}
          {blobActif
            ? "Le stockage est branché mais refuse l’écriture. Vérifiez que le store Blob est bien connecté au projet."
            : "Cet hébergement ne permet pas d’écrire. Connectez un store Vercel Blob au projet pour que l’ardoise et les photos soient enregistrées."}
        </p>
      </div>
    </div>
  );
}
