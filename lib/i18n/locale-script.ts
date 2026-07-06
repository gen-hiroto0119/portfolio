/** Inline script injected in `<head>` before paint to set `lang` without FOUC. */
export function getLocaleInitScript(): string {
  return `(function(){try{var l=localStorage.getItem("locale");document.documentElement.lang=l==="en"||l==="ja"?l:"ja";}catch(e){}})();`;
}
