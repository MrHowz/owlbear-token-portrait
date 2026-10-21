import { portraitFrom } from "./model";
const image = document.querySelector<HTMLImageElement>("#portrait")!;
function update() {
  image.hidden = true;
  image.removeAttribute("src");
  try {
    const portrait = portraitFrom(JSON.parse(decodeURIComponent(location.hash.slice(1))));
    if (portrait) { image.hidden = false; image.src = portrait.url; }
  } catch { /* Invalid data must never render as HTML. */ }
}
image.addEventListener("error", () => { image.hidden = true; });
window.addEventListener("hashchange", update);
update();
