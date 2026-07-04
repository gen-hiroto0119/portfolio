/**
 * Inline script injected in `<head>` before paint to prevent theme FOUC.
 * Applies the light-theme StyleX class(es) only when the resolved theme is light.
 */
export function getThemeInitScript(lightThemeClassName: string): string {
  const classes = lightThemeClassName.split(" ").filter(Boolean);
  const classesJson = JSON.stringify(classes);

  return `(function(){try{var c=${classesJson};var s=localStorage.getItem("theme");var t=s==="light"||s==="dark"||s==="system"?s:"system";var r=t;if(t==="system"){r=window.matchMedia("(prefers-color-scheme: light)").matches?"light":"dark";}document.documentElement.dataset.theme=r;if(r==="light"){for(var i=0;i<c.length;i++){document.documentElement.classList.add(c[i]);}}}catch(e){}})();`;
}
