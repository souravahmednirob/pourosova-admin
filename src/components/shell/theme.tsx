"use client";
import { useEffect } from "react";
import { useUI } from "@/store/ui";

/** Keeps the <html class="dark"> in sync with the persisted theme. */
export function ThemeSync() {
  const theme = useUI((s) => s.theme);
  const setTheme = useUI((s) => s.setTheme);
  useEffect(() => {
    if (!localStorage.getItem("kp-ration-ui") && window.matchMedia("(prefers-color-scheme: dark)").matches) setTheme("dark");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.style.colorScheme = theme;
  }, [theme]);
  return null;
}

/** Inline script run before paint to avoid a theme flash. */
export const themeInitScript = `(function(){try{var s=JSON.parse(localStorage.getItem('kp-ration-ui')||'{}');var t=s&&s.state&&s.state.theme;if(!t){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}if(t==='dark'){document.documentElement.classList.add('dark')}document.documentElement.style.colorScheme=t}catch(e){}})();`;
