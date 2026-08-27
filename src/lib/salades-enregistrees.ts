"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { allBuilderItems, groupeDe, type SizeKey } from "./catalog";

/**
 * Les salades que le client a enregistrées.
 *
 * Elles vivent dans le navigateur, comme le panier, et dans un store séparé
 * pour la même raison : se connecter, se déconnecter ou vider son panier ne
 * doit jamais faire disparaître ce qu'on a pris le temps de composer. Aucun
 * compte n'est demandé — on ne va pas exiger une inscription pour se
 * souvenir d'une salade.
 *
 * On n'enregistre jamais le prix : il se recalcule à chaque ajout au panier,
 * puis une dernière fois côté serveur. Une salade enregistrée en mars reste
 * donc juste en septembre, tarifs révisés compris.
 */

export type SaladeEnregistree = {
  id: string;
  nom: string;
  size: SizeKey;
  /** Les ingrédients à plat : le regroupement se refait à la relecture. */
  ingredients: string[];
  creeeLe: string;
};

/** Au-delà, la liste cesse d'être une aide et devient un fouillis. */
export const MAX_SALADES = 8;
export const MAX_NOM = 40;

type Etat = {
  salades: SaladeEnregistree[];
  hydrated: boolean;
  /**
   * Enregistre, ou remplace une salade du même nom. Renvoie l'identifiant,
   * ou `null` si la liste est pleine.
   */
  enregistrer: (salade: Omit<SaladeEnregistree, "id" | "creeeLe">) => string | null;
  renommer: (id: string, nom: string) => void;
  supprimer: (id: string) => void;
};

const CLE = "revelant.salades.v1";

const normaliser = (nom: string) => nom.trim().toLowerCase();

export const useSalades = create<Etat>()(
  persist(
    (set, get) => ({
      salades: [],
      hydrated: false,

      enregistrer: ({ nom, size, ingredients }) => {
        const propre = nom.trim().slice(0, MAX_NOM) || "Ma salade";
        const salades = [...get().salades];
        const existante = salades.findIndex((s) => normaliser(s.nom) === normaliser(propre));

        // Réenregistrer sous un nom déjà pris met la salade à jour plutôt
        // que d'en créer une deuxième, homonyme et indiscernable.
        if (existante > -1) {
          const id = salades[existante].id;
          salades[existante] = { ...salades[existante], nom: propre, size, ingredients };
          set({ salades });
          return id;
        }

        if (salades.length >= MAX_SALADES) return null;

        const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
        set({
          // La dernière enregistrée s'affiche en premier.
          salades: [{ id, nom: propre, size, ingredients, creeeLe: new Date().toISOString() }, ...salades],
        });
        return id;
      },

      renommer: (id, nom) =>
        set({
          salades: get().salades.map((s) =>
            s.id === id ? { ...s, nom: nom.trim().slice(0, MAX_NOM) || s.nom } : s
          ),
        }),

      supprimer: (id) => set({ salades: get().salades.filter((s) => s.id !== id) }),
    }),
    {
      name: CLE,
      storage: createJSONStorage(() => localStorage),
      partialize: ({ salades }) => ({ salades }),
      // Une salade enregistrée il y a six mois peut contenir un ingrédient
      // retiré de la carte depuis. On l'écarte à la relecture plutôt que de
      // laisser le composeur proposer quelque chose qui n'existe plus.
      merge: (persiste, courant) => {
        const brut = (persiste as { salades?: SaladeEnregistree[] } | undefined)?.salades ?? [];
        return {
          ...courant,
          salades: brut
            .map((s) => ({
              ...s,
              ingredients: (s.ingredients ?? []).filter((i) => allBuilderItems.includes(i)),
            }))
            .filter((s) => s.ingredients.length > 0),
        };
      },
    }
  )
);

// Même précaution que pour le panier : rien ne s'affiche avant la fin de la
// réhydratation, sinon le premier rendu client diffère de celui du serveur.
if (typeof window !== "undefined") {
  if (useSalades.persist.hasHydrated()) useSalades.setState({ hydrated: true });
  useSalades.persist.onFinishHydration(() => useSalades.setState({ hydrated: true }));
}

/* ------------------------------------------------------------------ */
/*  Utilitaires partagés avec le composeur                             */
/* ------------------------------------------------------------------ */

/** Reconstitue la sélection par groupe à partir de la liste à plat. */
export function regrouper(ingredients: string[]): Record<string, string[]> {
  const par: Record<string, string[]> = {};
  for (const nom of ingredients) {
    const groupe = groupeDe(nom);
    (par[groupe] ??= []).push(nom);
  }
  return par;
}

/**
 * Un nom proposé d'avance, pour qu'enregistrer ne demande qu'un seul geste :
  * « Quinoa & poulet pané ». Le client le remplace s'il préfère.
 */
export function nomPropose(picked: Record<string, string[]>): string {
  const base = picked.base?.[0];
  const proteine = picked.proteines?.[0];
  if (base && proteine) return `${base} & ${proteine.toLowerCase()}`.slice(0, MAX_NOM);
  return (base ?? proteine ?? "Ma salade").slice(0, MAX_NOM);
}
