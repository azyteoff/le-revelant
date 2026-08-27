"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { SizeKey, FormuleKey } from "./catalog";

/* ------------------------------------------------------------------ */
/*  Modèle                                                             */
/* ------------------------------------------------------------------ */

export type LineKind = "salade" | "composee" | "plat" | "boisson" | "dessert";

export type CartLine = {
  /** Identité de la ligne : deux lignes identiques fusionnent. */
  id: string;
  kind: LineKind;
  name: string;
  /** Composition affichée sous le nom. */
  detail: string[];
  /** Format, pour les salades. */
  size?: SizeKey;
  /** Formule, pour les plats mijotés. */
  formule?: FormuleKey;
  /** Part de majoration comprise dans le prix unitaire (salades composées). */
  majoration?: number;
  unitPrice: number;
  qty: number;
  image: string;
};

export type NewLine = Omit<CartLine, "id" | "qty"> & { qty?: number };

/** Clé stable, indépendante de l’ordre des ingrédients. */
export const lineId = (l: Omit<CartLine, "id" | "qty">) =>
  [
    l.kind,
    l.name,
    l.size ?? "-",
    l.formule ?? "-",
    // Deux compositions identiques prises avant et après 11h48 n'ont pas le
    // même prix : elles doivent rester deux lignes distinctes.
    l.majoration ? "maj" : "-",
    [...l.detail].sort().join("|"),
  ].join("::");

/* ------------------------------------------------------------------ */
/*  Store                                                              */
/* ------------------------------------------------------------------ */

type CartState = {
  lines: CartLine[];
  /** Le drawer panier est-il ouvert. */
  open: boolean;
  /** Dernière ligne ajoutée — pilote le feedback visuel. */
  lastAdded: string | null;
  hydrated: boolean;

  add: (line: NewLine) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
  setOpen: (open: boolean) => void;
  /**
   * Fusionne un panier distant (récupéré après connexion) avec le panier
   * local sans jamais écraser ce que le client vient de composer.
   */
  merge: (incoming: CartLine[]) => void;
};

const STORAGE_KEY = "revelant.cart.v1";

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      open: false,
      lastAdded: null,
      hydrated: false,

      add: (line) => {
        const id = lineId(line);
        const qty = line.qty ?? 1;
        const lines = [...get().lines];
        const i = lines.findIndex((l) => l.id === id);
        if (i > -1) lines[i] = { ...lines[i], qty: lines[i].qty + qty };
        else lines.push({ ...line, id, qty });
        set({ lines, lastAdded: id });
        // Le halo de confirmation retombe tout seul.
        setTimeout(() => {
          if (get().lastAdded === id) set({ lastAdded: null });
        }, 1600);
      },

      remove: (id) => set({ lines: get().lines.filter((l) => l.id !== id) }),

      setQty: (id, qty) =>
        set({
          lines:
            qty <= 0
              ? get().lines.filter((l) => l.id !== id)
              : get().lines.map((l) => (l.id === id ? { ...l, qty } : l)),
        }),

      clear: () => set({ lines: [], lastAdded: null }),

      setOpen: (open) => set({ open }),

      merge: (incoming) => {
        const lines = [...get().lines];
        for (const remote of incoming) {
          const i = lines.findIndex((l) => l.id === remote.id);
          if (i > -1) lines[i] = { ...lines[i], qty: Math.max(lines[i].qty, remote.qty) };
          else lines.push(remote);
        }
        set({ lines });
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      // `open`, `lastAdded` et `hydrated` sont éphémères : non persistés.
      partialize: ({ lines }) => ({ lines }),
    }
  )
);

// Le premier rendu client doit être identique au rendu serveur : on n’affiche
// le contenu du panier qu’une fois la réhydratation localStorage terminée.
if (typeof window !== "undefined") {
  if (useCart.persist.hasHydrated()) useCart.setState({ hydrated: true });
  useCart.persist.onFinishHydration(() => useCart.setState({ hydrated: true }));
}

/* ------------------------------------------------------------------ */
/*  Sélecteurs                                                         */
/* ------------------------------------------------------------------ */

export const selectCount = (s: CartState) =>
  s.lines.reduce((n, l) => n + l.qty, 0);

export const selectSubtotal = (s: CartState) =>
  s.lines.reduce((n, l) => n + l.qty * l.unitPrice, 0);
