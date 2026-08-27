import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // AVIF d’abord, WebP en repli : la photo est le poids principal du site.
    formats: ["image/avif", "image/webp"],
    // Paliers resserrés autour des largeurs réellement utilisées, pour éviter
    // de servir du 1920 à un écran de 1366.
    deviceSizes: [360, 480, 640, 828, 1080, 1366, 1600, 1920, 2560],
    imageSizes: [56, 72, 96, 128, 192, 256, 384],
    // Next 16 n’accepte que les qualités déclarées ici ; les autres retombent
    // silencieusement sur 75. 50 sert aux bandeaux entièrement recouverts
    // d’un dégradé, 68 au hero, 75 aux photos de plats.
    qualities: [50, 68, 75],
    // Le restaurant peut remplacer une photo depuis le back-office : un cache
    // d'un an ferait ressortir l'ancienne image pendant des mois. Une minute
    // suffit à ne pas réencoder à chaque visite, et Next continue de servir
    // la version en cache pendant qu'il régénère la suivante.
    minimumCacheTTL: 60,
    // Les vignettes du bar à salade portent un `?v=` (date du fichier) pour
    // qu'une photo remplacée s'affiche sans attendre l'expiration du cache.
    // Sans cette autorisation, Next refuse toute image locale avec paramètre.
    localPatterns: [{ pathname: "/img/**", search: "" }, { pathname: "/img/**" }],
  },

  // Empêche l’envoi de l’en-tête `X-Powered-By`.
  poweredByHeader: false,

  async rewrites() {
    return {
      // `beforeFiles` : ces règles passent AVANT le service de fichiers
      // statiques. C’est indispensable pour les emplacements remplaçables —
      // le fichier d’origine existe dans `public/`, et Next le servirait
      // sans jamais voir la photo enregistrée depuis le back-office.
      //
      // Le périmètre est volontairement restreint : seuls les 57
      // emplacements que le restaurant peut changer y passent. Les 208
      // photos de plats et les logos de transport gardent le service
      // statique, sans détour par une fonction.
      beforeFiles: [
        {
          source:
            "/img/:nom(hero\\.jpg|composer-home\\.jpg|ingredients\\.jpg|salade-.+|salle-.+|dessert-.+|boisson-.+)",
          destination: "/api/media/:nom",
        },
        { source: "/img/ingredients/:nom", destination: "/api/media/ingredients/:nom" },
      ],
      afterFiles: [],
      fallback: [],
    };
  },

  async headers() {
    return [
      // ⚠️ Next applique TOUTES les règles qui correspondent, et la
      // dernière l'emporte sur une même clé. La règle générale vient donc en
      // premier, les exceptions ensuite — l'inverse annulait le cache long
      // des photos de plats.
      //
      // Tout ce qui est remplaçable depuis le back-office : `immutable`
      // interdirait au navigateur de revérifier, et une photo changée à midi
      // resterait invisible. `stale-while-revalidate` garde l'affichage
      // instantané tout en laissant arriver la nouvelle version.
      {
        source: "/img/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=60, stale-while-revalidate=604800",
          },
        ],
      },
      // Les 208 photos de plats et les logos de transport ne changent
      // jamais : cache d'un an, sans réserve.
      {
        source: "/img/plats/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/img/transports/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default nextConfig;
