import { THEME_STORAGE_KEY } from '@/lib/theme';

/** Runs before paint to avoid theme flash; respects saved preference only. */
export function ThemeScript() {
  const code = `(function(){try{var k='${THEME_STORAGE_KEY}';var s=localStorage.getItem(k);var d=s!=='light';if(s==='dark')d=true;if(s==='light')d=false;var r=document.documentElement;r.classList.toggle('dark',d);r.classList.toggle('light',!d);r.style.colorScheme=d?'dark':'light';}catch(e){}})();`;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
