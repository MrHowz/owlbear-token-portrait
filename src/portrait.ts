import { portraitFrom } from "./model";

export function startPortrait(resolveUrl: (url: string) => string = url => url) {
  const image = document.querySelector<HTMLImageElement>("#portrait")!;
  function hide() { image.hidden = true; image.classList.remove("enter"); }
  image.addEventListener("load", () => {
    image.hidden = false;
    image.classList.add("enter");
  });
  image.addEventListener("error", hide);
  function update() {
    hide();
    image.removeAttribute("src");
    try {
      const portrait = portraitFrom(JSON.parse(decodeURIComponent(location.hash.slice(1))));
      if (portrait) image.src = resolveUrl(portrait.url);
    } catch { /* Invalid data must never render as HTML. */ }
  }
  window.addEventListener("hashchange", update);
  update();
}
