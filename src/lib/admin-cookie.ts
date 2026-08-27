/**
 * Nom du cookie de session, isolé volontairement.
 *
 * Le middleware s'exécute sur le runtime Edge, où `node:crypto` n'existe pas.
 * S'il importait cette constante depuis `admin-session.ts`, tout le module —
 * et donc `node:crypto` — serait tiré dans le bundle Edge et le site
 * planterait au démarrage. Ce fichier ne dépend de rien.
 */
export const COOKIE_SESSION = "revelant_admin";
