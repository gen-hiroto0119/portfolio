/** Resolve the saved preference before first paint. */
export function getThemeInitScript(): string {
  return `(function(){try{var s=localStorage.getItem("theme");var t=s==="dark"||s==="system"?s:"light";var r=t==="system"?(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"):t;document.documentElement.dataset.theme=r;}catch(e){}})();`;
}
