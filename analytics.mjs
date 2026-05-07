const metrikaScriptUrl = "https://mc.yandex.ru/metrika/tag.js?id=109110294";

const metrikaMarkup = [
  "    <!-- Yandex.Metrika counter -->",
  '    <script type="text/javascript">',
  "      (function(m,e,t,r,i,k,a){",
  "          m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};",
  "          m[i].l=1*new Date();",
  "          for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}",
  "          k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)",
  `      })(window, document,'script','${metrikaScriptUrl}', 'ym');`,
  "",
  '      ym(109110294, \'init\', {ssr:true, webvisor:true, clickmap:true, ecommerce:"dataLayer", referrer: document.referrer, url: location.href, accurateTrackBounce:true, trackLinks:true});',
  "    </script>",
  '    <noscript><div><img src="https://mc.yandex.ru/watch/109110294" style="position:absolute; left:-9999px;" alt="" /></div></noscript>',
  "    <!-- /Yandex.Metrika counter -->"
].join("\n");

function hasMetrika(html) {
  return html.includes(metrikaScriptUrl)
    || html.includes("https://mc.yandex.ru/watch/109110294")
    || html.includes("ym(109110294");
}

export function injectYandexMetrika(html = "") {
  if (!html || hasMetrika(html)) return html;
  if (/<\/head>/i.test(html)) return html.replace(/<\/head>/i, `${metrikaMarkup}\n  </head>`);
  if (/<body[^>]*>/i.test(html)) return html.replace(/<body[^>]*>/i, (match) => `${match}\n${metrikaMarkup}`);
  return `${html}\n${metrikaMarkup}`;
}

