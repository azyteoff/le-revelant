import { NextResponse } from "next/server";
import { priceOrder, orderReference, OrderError } from "@/lib/order";
import { enregistrerCommande, type Commande } from "@/lib/commandes";
import { restaurant, SITE_URL } from "@/lib/restaurant";

export const runtime = "nodejs";

/**
 * Création de la commande.
 *
 * Deux modes, un seul contrat côté client :
 *
 *  · STRIPE_SECRET_KEY défini → une session Stripe Checkout est créée et le
 *    client est redirigé dessus. Apple Pay et Google Pay apparaissent
 *    automatiquement sur les appareils compatibles (Stripe les active avec
 *    `automatic_payment_methods`) ; aucun code spécifique n’est nécessaire.
 *    Le domaine doit être enregistré dans Stripe > Settings > Payment methods
 *    pour qu’Apple Pay s’affiche en production.
 *
 *  · Sinon → mode démonstration : la commande est validée, tarifée et une
 *    référence est rendue, sans encaissement. Le site reste testable de bout
 *    en bout sans clé.
 *
 * Dans les deux cas les prix sont recalculés ici à partir du catalogue :
 * ce que le navigateur envoie n’influence jamais le montant.
 */

type Body = {
  lines?: unknown;
  customer?: { firstName?: string; lastName?: string; email?: string; phone?: string };
  pickup?: string;
  /** « aujourdhui » ou « demain » : conditionne la remise précommande. */
  retrait?: string;
  notes?: string;
};

const clean = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);

export async function POST(request: Request) {
  let body: Body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête illisible." }, { status: 400 });
  }

  const firstName = clean(body.customer?.firstName, 60);
  const email = clean(body.customer?.email, 160);
  const phone = clean(body.customer?.phone, 30);
  const pickup = clean(body.pickup, 20);
  const notes = clean(body.notes, 400);

  if (firstName.length < 2) {
    return NextResponse.json({ error: "Indiquez votre prénom." }, { status: 400 });
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(email)) {
    return NextResponse.json({ error: "Adresse e-mail invalide." }, { status: 400 });
  }
  if (!/^[0-9+\s().-]{9,}$/.test(phone)) {
    return NextResponse.json({ error: "Numéro de téléphone invalide." }, { status: 400 });
  }

  const retrait = body.retrait === "demain" ? ("demain" as const) : ("aujourdhui" as const);

  let order;
  try {
    order = await priceOrder(body.lines, retrait);
  } catch (err) {
    const message = err instanceof OrderError ? err.message : "Commande invalide.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const reference = orderReference();
  const key = process.env.STRIPE_SECRET_KEY;

  // La commande est consignée au journal du jour : c'est ce que le back-office
  // affiche à la cuisine. L'écriture ne bloque jamais le client.
  const journal: Commande = {
    reference,
    recuLe: new Date().toISOString(),
    jourRetrait: retrait,
    creneau: pickup,
    client: { prenom: firstName, email, telephone: phone },
    notes,
    lignes: order.lines.map((l) => ({
      nom: l.name,
      description: l.description,
      quantite: l.qty,
      prixUnitaire: l.unitPrice,
    })),
    sousTotal: order.subtotal,
    remise: order.discount,
    total: order.total,
    paiement: key ? "en ligne" : "démonstration",
    etat: "recue",
  };
  await enregistrerCommande(journal);

  if (!key) {
    return NextResponse.json({
      mode: "demo" as const,
      reference,
      total: order.total,
      discount: order.discount,
    });
  }

  // Stripe est appelé via son API REST : pas de SDK à embarquer, pas de
  // dépendance à mettre à jour, et le bundle serveur reste minuscule.
  const form = new URLSearchParams();
  form.set("mode", "payment");
  form.set("customer_email", email);
  form.set("client_reference_id", reference);
  form.set("success_url", `${SITE_URL}/commander/confirmation?ref=${reference}`);
  form.set("cancel_url", `${SITE_URL}/commander?annule=1`);
  form.set("automatic_tax[enabled]", "false");
  form.set("metadata[reference]", reference);
  form.set("metadata[pickup]", pickup);
  form.set("metadata[jour]", retrait === "demain" ? "lendemain" : "jour même");
  form.set("metadata[phone]", phone);
  form.set("metadata[firstName]", firstName);
  if (notes) form.set("metadata[notes]", notes);

  order.lines.forEach((line, i) => {
    form.set(`line_items[${i}][quantity]`, String(line.qty));
    form.set(`line_items[${i}][price_data][currency]`, "eur");
    form.set(`line_items[${i}][price_data][unit_amount]`, String(Math.round(line.unitPrice * 100)));
    form.set(`line_items[${i}][price_data][product_data][name]`, line.name);
    if (line.description) {
      form.set(
        `line_items[${i}][price_data][product_data][description]`,
        line.description.slice(0, 500)
      );
    }
  });

  if (order.discount > 0) {
    form.set("discounts[0][coupon]", process.env.STRIPE_EARLYBIRD_COUPON ?? "");
  }

  try {
    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form,
    });

    const session = (await res.json()) as { url?: string; error?: { message?: string } };
    if (!res.ok || !session.url) {
      console.error("Stripe", session.error?.message ?? res.status);
      return NextResponse.json(
        { error: `Le paiement est momentanément indisponible. Appelez-nous au ${restaurant.phone}.` },
        { status: 502 }
      );
    }

    return NextResponse.json({ mode: "stripe" as const, url: session.url, reference });
  } catch {
    return NextResponse.json(
      { error: `Le paiement est momentanément indisponible. Appelez-nous au ${restaurant.phone}.` },
      { status: 502 }
    );
  }
}
