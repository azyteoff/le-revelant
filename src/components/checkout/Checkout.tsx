"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { useCart } from "@/lib/cart";
import { useAccount } from "@/lib/account";
import { computeTotals, prochainJourOuvre, pickupSlots, type Retrait } from "@/lib/pricing";
import { Dish } from "@/components/ui/Dish";
import { restaurant } from "@/lib/restaurant";
import { MAJORATION_COMPOSEE } from "@/lib/catalog";
import { cn, euro, listFr } from "@/lib/utils";

const field =
  "h-12 w-full rounded-md border border-ink/14 bg-cream px-4 text-[0.9375rem] " +
  "transition-colors duration-200 placeholder:text-ink-3/70 focus:border-olive focus:outline-none";

/**
 * Créneaux de retrait. Ils dépendent de l’heure courante, donc du client :
 * on les expose via `useSyncExternalStore` avec un instantané serveur vide,
 * ce qui évite toute divergence d’hydratation sans passer par un effet.
 */
const NO_SLOTS: string[] = [];
let slotCache: string[] | null = null;
const subscribeSlots = () => () => {};
const getSlots = () => (slotCache ??= pickupSlots());

/** Libellé du prochain jour de service, pour l'option « demain ». */
let demainCache: string | null = null;
const getDemain = () => (demainCache ??= prochainJourOuvre());

export function Checkout() {
  const router = useRouter();
  const lines = useCart((s) => s.lines);
  const hydrated = useCart((s) => s.hydrated);
  const setQty = useCart((s) => s.setQty);
  const remove = useCart((s) => s.remove);
  const clear = useCart((s) => s.clear);

  const customer = useAccount((s) => s.customer);
  const signIn = useAccount((s) => s.signIn);

  const [pickup, setPickup] = useState("");
  const [retrait, setRetrait] = useState<Retrait>("aujourdhui");
  const [showSignIn, setShowSignIn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totals = computeTotals(lines, retrait);
  const slots = useSyncExternalStore(subscribeSlots, getSlots, () => NO_SLOTS);
  const demain = useSyncExternalStore(subscribeSlots, getDemain, () => "");
  // Pour le lendemain, tout le service est ouvert à la réservation.
  const creneaux = retrait === "demain" ? pickupSlots(new Date(0)) : slots;
  const chosenPickup = creneaux.includes(pickup) ? pickup : creneaux[0] ?? "";

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // Formulaire non contrôlé : la validation HTML native fait le premier tri
    // et les champs se pré-remplissent tout seuls pour un client connecté.
    const data = new FormData(e.currentTarget);
    const firstName = String(data.get("firstName") ?? "");
    const email = String(data.get("email") ?? "");
    const phone = String(data.get("phone") ?? "");
    const notes = String(data.get("notes") ?? "");

    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lines: lines.map((l) => ({
            kind: l.kind,
            name: l.name,
            detail: l.detail,
            size: l.size,
            formule: l.formule,
            qty: l.qty,
          })),
          customer: { firstName, email, phone },
          pickup: chosenPickup,
          retrait,
          notes,
        }),
      });
      const payload = await res.json();

      if (!res.ok) {
        setError(payload.error ?? "La commande n’a pas pu être envoyée.");
        return;
      }

      if (payload.mode === "stripe") {
        window.location.href = payload.url;
        return;
      }

      // Mode démonstration : la commande est validée sans encaissement.
      const params = new URLSearchParams({
        ref: payload.reference,
        total: String(payload.total),
        pickup: chosenPickup,
        jour: retrait === "demain" ? demain : "aujourd’hui",
        prenom: firstName,
      });
      clear();
      router.push(`/commander/confirmation?${params}`);
    } catch {
      setError(`Connexion interrompue. Vous pouvez appeler le ${restaurant.phone}.`);
    } finally {
      setBusy(false);
    }
  }

  if (!hydrated) {
    return <div className="shell py-32 text-center text-sm text-ink-3">Chargement du panier…</div>;
  }

  if (lines.length === 0) {
    return (
      <div className="shell flex flex-col items-center gap-6 py-28 text-center md:py-36">
        <h1 className="fluid-section max-w-[14ch]">Votre panier est vide.</h1>
        <p className="max-w-[38ch] text-[1.0625rem] text-ink-3">
          Cinq recettes du jour et un bar à salade de 31 ingrédients vous attendent.
        </p>
        <Link
          href="/la-carte"
          className="mt-2 rounded-full bg-ink px-7 py-3.5 text-[0.9375rem] font-medium text-cream transition-colors hover:bg-olive-deep"
        >
          Voir la carte
        </Link>
      </div>
    );
  }

  return (
    <div className="shell grid gap-12 pb-24 pt-10 md:grid-cols-[1fr_23rem] md:gap-16 md:pb-32">
      {/* ---------------- Formulaire ---------------- */}
      <form id="checkout-form" onSubmit={submit} className="flex flex-col gap-10">
        <section>
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="font-[family-name:var(--font-display)] text-[1.75rem]">
              Vos coordonnées
            </h2>
            {customer ? (
              <p className="text-[0.8125rem] text-olive-deep">
                Connecté · {customer.email}
              </p>
            ) : (
              <button
                type="button"
                onClick={() => setShowSignIn((v) => !v)}
                className="text-[0.8125rem] text-ink-3 underline underline-offset-4 hover:text-ink"
              >
                J’ai déjà un compte
              </button>
            )}
          </div>

          <p className="mt-2 text-[0.875rem] text-ink-3">
            Trois informations suffisent : on vous prévient quand c’est prêt, et on
            sait à qui remettre la commande. Aucun mot de passe, aucun compte à créer.
          </p>

          {/* Dépliage sans hauteur connue : grid-template-rows 0fr → 1fr. */}
          <div className="expander" data-open={showSignIn && !customer}>
            <div>
              <SignInPanel
                disabled={!showSignIn || !!customer}
                onDone={(c) => {
                  void signIn(c);
                  setShowSignIn(false);
                }}
              />
            </div>
          </div>

          {/* `key` sur le compte : à la connexion, React remonte les champs
              et les valeurs par défaut du client sont reprises. */}
          <div key={customer?.email ?? "invite"} className="mt-6 grid gap-3 sm:grid-cols-2">
            <label className="sm:col-span-1">
              <span className="sr-only">Prénom</span>
              <input
                name="firstName"
                className={field}
                placeholder="Prénom"
                autoComplete="given-name"
                required
                minLength={2}
                defaultValue={customer?.firstName ?? ""}
              />
            </label>
            <label className="sm:col-span-1">
              <span className="sr-only">Téléphone</span>
              <input
                name="phone"
                className={field}
                placeholder="Téléphone"
                type="tel"
                autoComplete="tel"
                required
                // Les expressions `pattern` sont compilées avec le drapeau `v` :
                // parenthèses, point et tiret doivent y être échappés.
                pattern="[0-9+ \(\)\.\-]{9,}"
                defaultValue={customer?.phone ?? ""}
              />
            </label>
            <label className="sm:col-span-2">
              <span className="sr-only">E-mail</span>
              <input
                name="email"
                className={field}
                placeholder="E-mail"
                type="email"
                autoComplete="email"
                required
                defaultValue={customer?.email ?? ""}
              />
            </label>
          </div>
        </section>

        <section>
          <h2 className="font-[family-name:var(--font-display)] text-[1.75rem]">
            Quand passez-vous ?
          </h2>
          <p className="mt-2 text-[0.875rem] text-ink-3">
            Retrait au comptoir, {restaurant.street}, {restaurant.postalCode}{" "}
            {restaurant.city}.
          </p>

          {/* Jour de retrait : commander pour demain donne droit à la remise,
              c'est la « commande de la veille » du restaurant. */}
          <div className="mt-5 flex flex-wrap gap-2">
            {(
              [
                { cle: "aujourdhui" as const, label: "Aujourd’hui" },
                { cle: "demain" as const, label: demain || "Demain" },
              ] satisfies { cle: Retrait; label: string }[]
            ).map((choix) => (
              <button
                key={choix.cle}
                type="button"
                onClick={() => setRetrait(choix.cle)}
                aria-pressed={retrait === choix.cle}
                className={cn(
                  // Seule la première lettre : « Jeudi 6 août », pas « Jeudi 6 Août ».
                  "rounded-full border px-5 py-2.5 text-[0.875rem] first-letter:uppercase transition-colors duration-300",
                  retrait === choix.cle
                    ? "border-ink bg-ink text-cream"
                    : "border-ink/14 text-ink-2 hover:border-ink/35 hover:bg-ink/[0.04]"
                )}
              >
                {choix.label}
                {choix.cle === "demain" && (
                  <span
                    className={cn(
                      "ml-2 text-[0.6875rem] font-semibold",
                      retrait === "demain" ? "text-olive-soft" : "text-olive-deep"
                    )}
                  >
                    −10 %
                  </span>
                )}
              </button>
            ))}
          </div>

          <p className="mt-4 text-[0.8125rem] text-ink-3">Créneau souhaité</p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {creneaux.map((slot) => (
              <button
                key={slot}
                type="button"
                onClick={() => setPickup(slot)}
                aria-pressed={chosenPickup === slot}
                className={cn(
                  "rounded-full border px-4 py-2.5 text-[0.875rem] tabular-nums transition-colors duration-300",
                  chosenPickup === slot
                    ? "border-ink bg-ink text-cream"
                    : "border-ink/14 text-ink-2 hover:border-ink/35 hover:bg-ink/[0.04]"
                )}
              >
                {slot}
              </button>
            ))}
          </div>
        </section>

        <section>
          <h2 className="font-[family-name:var(--font-display)] text-[1.75rem]">
            Une précision ?
          </h2>
          <textarea
            name="notes"
            className="mt-4 min-h-24 w-full rounded-md border border-ink/14 bg-cream p-4 text-[0.9375rem] placeholder:text-ink-3/70 focus:border-olive focus:outline-none"
            placeholder="Sans oignons, sauce à part, allergie…"
            maxLength={400}
          />
        </section>

        {error && (
          <p role="alert" className="rounded-md bg-tomato/8 px-4 py-3 text-[0.875rem] text-tomato">
            {error}
          </p>
        )}

        <div className="md:hidden">
          <PayButton busy={busy} total={totals.total} />
        </div>
      </form>

      {/* ---------------- Récapitulatif ---------------- */}
      <aside className="md:sticky md:top-28 md:self-start">
        <div className="rounded-lg border border-ink/10 bg-cream-2/50 p-6">
          <h2 className="font-[family-name:var(--font-display)] text-[1.375rem]">
            Votre commande
          </h2>

          <ul className="mt-5 flex flex-col gap-4">
            {lines.map((line) => (
              <li key={line.id} className="flex gap-3.5">
                <div className="relative size-14 shrink-0 overflow-hidden rounded-md bg-cream">
                  <Dish slot={line.image} alt="" fill sizes="56px" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="truncate text-[0.875rem] font-medium">{line.name}</p>
                    <p className="shrink-0 text-[0.875rem] tabular-nums">
                      {euro(line.unitPrice * line.qty)}
                    </p>
                  </div>
                  {line.detail.length > 0 && (
                    <p className="mt-0.5 line-clamp-2 text-[0.6875rem] leading-relaxed text-ink-3">
                      {listFr(line.detail)}
                    </p>
                  )}
                  <div className="mt-1.5 flex items-center gap-3 text-xs">
                    <div className="flex items-center rounded-full border border-ink/12">
                      <button
                        type="button"
                        aria-label={`Retirer un ${line.name}`}
                        onClick={() => setQty(line.id, line.qty - 1)}
                        className="grid size-6 place-items-center text-ink-3 hover:text-ink"
                      >
                        −
                      </button>
                      <span className="w-4 text-center tabular-nums">{line.qty}</span>
                      <button
                        type="button"
                        aria-label={`Ajouter un ${line.name}`}
                        onClick={() => setQty(line.id, line.qty + 1)}
                        className="grid size-6 place-items-center text-ink-3 hover:text-ink"
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => remove(line.id)}
                      className="text-ink-3 underline-offset-4 hover:text-tomato hover:underline"
                    >
                      Retirer
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <dl className="mt-6 flex flex-col gap-1.5 border-t border-ink/10 pt-5 text-[0.875rem]">
            <div className="flex justify-between text-ink-3">
              <dt>Sous-total</dt>
              <dd className="tabular-nums">{euro(totals.subtotal)}</dd>
            </div>
            {totals.majoration > 0 && (
              <div className="flex justify-between text-ink-3">
                <dt>
                  Dont majoration après{" "}
                  {MAJORATION_COMPOSEE.heure.replace(":", "h")}
                </dt>
                <dd className="tabular-nums">{euro(totals.majoration)}</dd>
              </div>
            )}
            {totals.discount > 0 && (
              <div className="flex justify-between text-olive-deep">
                <dt>Précommande −10 %</dt>
                <dd className="tabular-nums">−{euro(totals.discount)}</dd>
              </div>
            )}
            <div className="mt-1.5 flex justify-between border-t border-ink/10 pt-3 text-[1.0625rem] font-medium">
              <dt>Total</dt>
              <dd className="tabular-nums">{euro(totals.total)}</dd>
            </div>
          </dl>

          {/* La remise fidélité passe par la caisse du restaurant : elle ne
              peut pas être vérifiée en ligne, on l'annonce sans l'appliquer. */}
          <p className="mt-4 rounded-md bg-olive-wash px-3.5 py-3 text-[0.75rem] leading-relaxed text-olive-deep">
            <strong className="font-semibold">5 % de plus, sur place.</strong> Demandez au
            comptoir la création de votre compte client sur notre caisse : la remise
            s’applique ensuite à chacun de vos passages.
          </p>

          <div className="mt-6 hidden md:block">
            {/* Hors du <form> : l’attribut `form` le rattache quand même,
                la validation HTML native reste active. */}
            <PayButton busy={busy} total={totals.total} form="checkout-form" />
          </div>

          <div className="mt-5 flex items-center justify-center gap-3 opacity-55">
            <WalletMarks />
          </div>
          <p className="mt-3 text-center text-[0.6875rem] leading-relaxed text-ink-3">
            Paiement sécurisé. Vous récupérez votre commande au comptoir.
          </p>
        </div>
      </aside>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function PayButton({
  busy,
  total,
  form,
}: {
  busy: boolean;
  total: number;
  form?: string;
}) {
  return (
    <button
      type="submit"
      form={form}
      disabled={busy}
      className={cn(
        "flex h-[3.5rem] w-full items-center justify-center gap-2 rounded-full bg-ink text-[0.9375rem] font-medium text-cream",
        "transition-colors duration-300 hover:bg-olive-deep disabled:opacity-60"
      )}
    >
      {busy ? "Un instant…" : `Payer ${euro(total)}`}
    </button>
  );
}

function WalletMarks() {
  return (
    <>
      <span className="text-[0.6875rem] font-medium tracking-tight"> Pay</span>
      <span aria-hidden className="h-3 w-px bg-ink/20" />
      <span className="text-[0.6875rem] font-medium tracking-tight">G Pay</span>
      <span aria-hidden className="h-3 w-px bg-ink/20" />
      <span className="text-[0.6875rem] font-medium tracking-tight">VISA</span>
      <span aria-hidden className="h-3 w-px bg-ink/20" />
      <span className="text-[0.6875rem] font-medium tracking-tight">MASTERCARD</span>
    </>
  );
}

/**
 * Connexion. Volontairement placée *dans* le tunnel, après que le panier
 * est constitué : c’est précisément le moment où l’ancien site perdait
 * la commande. Ici, se connecter ne fait que fusionner.
 */
function SignInPanel({
  onDone,
  disabled,
}: {
  onDone: (c: { email: string; firstName: string }) => void;
  disabled: boolean;
}) {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");

  return (
    // `inert` quand replié : les champs restent hors du parcours clavier.
    <div inert={disabled} className="mt-5 rounded-md border border-olive/25 bg-olive-wash/60 p-5">
      <p className="text-[0.875rem] leading-relaxed text-olive-deep">
        Connectez-vous : votre panier est conservé et fusionné avec vos commandes
        précédentes. Vous ne perdez rien.
      </p>
      <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
        <input
          className={field}
          placeholder="Prénom"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
        />
        <input
          className={field}
          placeholder="E-mail"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button
          type="button"
          disabled={!email.includes("@") || firstName.length < 2}
          onClick={() => onDone({ email, firstName })}
          className="h-12 rounded-md bg-olive-deep px-5 text-[0.875rem] font-medium text-cream disabled:opacity-40"
        >
          Se connecter
        </button>
      </div>
    </div>
  );
}
