// Keep this entry path for GitHub web uploads: uploading a ZIP does not remove
// the old panel.ts. Explicit .tsx prevents the resolver picking old DOM code.
export { startPanel } from "./panel.tsx";
