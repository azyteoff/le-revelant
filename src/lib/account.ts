"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { useCart, type CartLine } from "./cart";

/**
 * Session client.
 *
 * Point clé de la refonte : la session et le panier vivent dans deux
 * stores distincts, persistés séparément. Se connecter, se déconnecter ou
 * créer un compte ne remet jamais `lines` à zéro — c’est exactement le bug
 * du site actuel (« je compose ma salade, je me connecte, je perds tout »).
 *
 * À la connexion, un éventuel panier serveur est *fusionné* dans le panier
 * local via `cart.merge()` : le client ne perd rien de ce qu’il vient de faire.
 *
 * Le back-end réel (Stripe Customer + base) branchera `fetchRemoteCart` sur
 * une vraie route ; la signature ne change pas.
 */

export type Customer = {
  email: string;
  firstName: string;
  phone?: string;
};

type AccountState = {
  customer: Customer | null;
  signIn: (customer: Customer) => Promise<void>;
  signOut: () => void;
};

/** Emplacement du panier serveur simulé, par e-mail. */
const remoteKey = (email: string) => `revelant.remote-cart.${email.toLowerCase()}`;

function fetchRemoteCart(email: string): CartLine[] {
  try {
    const raw = localStorage.getItem(remoteKey(email));
    return raw ? (JSON.parse(raw) as CartLine[]) : [];
  } catch {
    return [];
  }
}

export function pushRemoteCart(email: string, lines: CartLine[]) {
  try {
    localStorage.setItem(remoteKey(email), JSON.stringify(lines));
  } catch {
    /* quota / navigation privée : le panier local reste la source de vérité */
  }
}

export const useAccount = create<AccountState>()(
  persist(
    (set) => ({
      customer: null,

      signIn: async (customer) => {
        const remote = fetchRemoteCart(customer.email);
        set({ customer });
        // Fusion, jamais remplacement.
        if (remote.length) useCart.getState().merge(remote);
        pushRemoteCart(customer.email, useCart.getState().lines);
      },

      signOut: () => {
        const { customer } = useAccount.getState();
        if (customer) pushRemoteCart(customer.email, useCart.getState().lines);
        // On ne touche pas au panier : le visiteur redevient un invité
        // avec sa commande intacte.
        set({ customer: null });
      },
    }),
    {
      name: "revelant.account.v1",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// Tant qu’un client est connecté, son panier est répliqué côté « serveur »
// à chaque modification : il le retrouve sur un autre appareil.
if (typeof window !== "undefined") {
  useCart.subscribe((state) => {
    const email = useAccount.getState().customer?.email;
    if (email) pushRemoteCart(email, state.lines);
  });
}
