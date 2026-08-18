// Meta (Facebook) public identifiers for the WhatsApp Embedded Signup flow.
// These are public by design (they travel in the browser popup URL).
// Env vars take precedence so you can point to a different Meta app per environment.
export const META_APP_ID =
  (import.meta.env.VITE_META_APP_ID as string | undefined) || "1060636930231776";

export const META_WA_CONFIG_ID =
  (import.meta.env.VITE_META_WA_CONFIG_ID as string | undefined) || "2287751918736681";

export const META_GRAPH_VERSION = "v20.0";
