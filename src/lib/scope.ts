// Build scope of this deployment, set by npm run build:london / build:national.
// london: the app is a single page at '/' showing the London region map.
// national (default): landing lists regions, each region under /region/<id>/.
export const SCOPE = ((import.meta.env.PUBLIC_SCOPE as string) || "national") as
  | "london"
  | "national";
