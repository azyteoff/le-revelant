import { createHmac, timingSafeEqual, randomBytes } from "node:crypto";

/**
 * Session du back-office.
 *
 * Un seul compte, un seul mot de passe — c'est un restaurant, pas une
 * entreprise. Le mot de passe vit dans `ADMIN_PASSWORD` (fichier .env.local),
 * jamais dans le code.
 *
 * Le cookie ne contient pas le mot de passe : c'est un jeton « date
 * d'expiration + signature HMAC ». Sans le secret du serveur, il est
 * impossible d'en fabriquer un.
 *
 * Si `ADMIN_PASSWORD` n'est pas défini, le back-office est **fermé** et
 * l'explique. Un back-office ouvert par défaut serait une porte grande
 * ouverte sur la carte et les commandes.
 */

export { COOKIE_SESSION } from "./admin-cookie";

/** 12 heures : plus long qu'un service, plus court qu'un oubli. */
const DUREE_MS = 12 * 60 * 60 * 1000;

export const motDePasseConfigure = () => Boolean(process.env.ADMIN_PASSWORD?.trim());

/**
 * Secret de signature. On dérive du mot de passe si `ADMIN_SESSION_SECRET`
 * n'est pas fourni : changer le mot de passe invalide alors toutes les
 * sessions en cours, ce qui est le comportement attendu.
 */
function secret(): string {
  const explicite = process.env.ADMIN_SESSION_SECRET?.trim();
  if (explicite) return explicite;
  const mdp = process.env.ADMIN_PASSWORD?.trim();
  if (!mdp) throw new Error("ADMIN_PASSWORD manquant");
  return `derive:${mdp}`;
}

const signer = (charge: string) =>
  createHmac("sha256", secret()).update(charge).digest("base64url");

/** Comparaison à temps constant : ne fuit pas la position du premier écart. */
function egalConstant(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export function verifierMotDePasse(saisi: string): boolean {
  const attendu = process.env.ADMIN_PASSWORD?.trim();
  if (!attendu) return false;
  // Le padding évite que la seule longueur de la saisie renseigne l'attaquant.
  const taille = Math.max(attendu.length, saisi.length, 32);
  return egalConstant(saisi.padEnd(taille, "\0"), attendu.padEnd(taille, "\0"));
}

export function creerJeton(): string {
  const expire = Date.now() + DUREE_MS;
  const charge = `${expire}.${randomBytes(9).toString("base64url")}`;
  return `${charge}.${signer(charge)}`;
}

export function jetonValide(jeton: string | undefined): boolean {
  if (!jeton || !motDePasseConfigure()) return false;
  const bouts = jeton.split(".");
  if (bouts.length !== 3) return false;

  const [expire, sel, signature] = bouts;
  const charge = `${expire}.${sel}`;

  try {
    if (!egalConstant(signature, signer(charge))) return false;
  } catch {
    return false;
  }

  const echeance = Number(expire);
  return Number.isFinite(echeance) && echeance > Date.now();
}

/**
 * Options du cookie de session, calées sur la requête reçue.
 *
 * `secure` ne peut pas dépendre de `NODE_ENV` : `next start` est en mode
 * production même quand on teste depuis un téléphone sur le réseau local, en
 * http://192.168.x.x. Le navigateur refuse alors silencieusement un cookie
 * `Secure` — la connexion réussissait, puis la session n'existait plus, et on
 * retombait sur l'écran de mot de passe sans le moindre message.
 *
 * On regarde donc le protocole réellement employé. En HTTPS — le cas d'un site
 * publié, éventuellement derrière un reverse proxy qui annonce
 * `x-forwarded-proto` — le cookie reste `Secure`.
 */
export function optionsCookie(request: Request) {
  const declare = request.headers.get("x-forwarded-proto")?.split(",")[0].trim();
  const protocole = declare ?? new URL(request.url).protocol.replace(":", "");

  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure: protocole === "https",
    maxAge: DUREE_MS / 1000,
  };
}
