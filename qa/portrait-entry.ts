import { startPortrait } from "../src/portrait";
if (location.search.includes("motion-preview")) document.body.classList.add("motion-preview");
startPortrait(url => url.endsWith("/amber.svg") ? "/qa/amber.svg" : "/qa/blue.svg");
