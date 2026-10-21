import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
const manifest = JSON.parse(readFileSync(new URL("../public/manifest.json", import.meta.url), "utf8"));
assert.ok(typeof manifest.name === "string" && manifest.name.length > 0 && manifest.name.length <= 45, "Manifest name must contain 1-45 characters");
assert.ok(typeof manifest.description === "string" && manifest.description.length <= 128, "Manifest description must not exceed 128 characters");
assert.equal(manifest.manifest_version, 1);
assert.match(manifest.version, /^\d+\.\d+\.\d+$/);
assert.equal(manifest.version, JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")).version);
console.log(`Manifest ${manifest.version} valid (${manifest.description.length}/128 description characters)`);
