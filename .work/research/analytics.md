# analytics

## summary
Recommendation: hosted GoatCounter. It's the only option that meets every requirement: free, works with no backend, cookieless, supports custom events, reports referrers and countries, and exports data. It also has a public-dashboard option.

How the others fall short:
- **Cloudflare Web Analytics**: free and cookieless, but its own FAQ says custom events are "Not yet" supported.
- **Plausible**: no free cloud plan, only a 30-day trial. Custom properties need the Business tier. The self-hosted Community Edition needs a server running ClickHouse, which GitHub Pages can't provide.
- **Umami Cloud Hobby**: the best fallback. It's free, cookieless and has a richer event API. But its limits (100K events/month, 1 vs 3 websites, 6-month retention) come only from search snippets. Each stored event property is also billed as an extra event.
- **Simple Analytics**: 30-day history on the free plan. Whether events work on the free plan is unverified.
- **Counter.dev**: its tracker has no event API at all. It keeps a sessionStorage flag, and its own README says consent may be needed.
- **GA4**: sets `_ga` and `_ga_<id>` cookies, so it isn't cookieless.

GitHub Pages has no analytics for the site itself. Repo Insights > Traffic covers only the repository on github.com: clones, visitors over 14 days, referrers and popular content.

Integration details specific to the color-space.io code:
- **Dossier opens aren't counted automatically.** The site opens dossiers with `history.replaceState` (openModal, around web/index.html:2588). count.js doesn't see that, and it prefers `<link rel=canonical>`, which stays `/` on the index page. So user-initiated opens need an explicit `count({path:'/'+slug})`.
- **Download hooks.** The LUT and ICC downloads go through two helpers: `dl()` at web/index.html:4138 and `save()` at web/index.html:5176. Wrapping those covers both file types.
- **Not built yet.** No embed-copy UI or tour-stepping code exists in web/ yet.
- **Tests won't pollute stats.** count.js already skips localhost and `navigator.webdriver`, so `npm test` and Playwright runs aren't counted.

All findings, with a verification label on every fact, are in analytics.json. The raw vendor sources are saved in research/analytics-src/.

## recommendation
Use hosted GoatCounter. Add it to the page head with the pinned v5 script and its SRI hash:
<script data-goatcounter="https://ACCOUNT.goatcounter.com/count" async src="https://gc.zgo.at/count.v5.js" crossorigin="anonymous" integrity="sha384-atnOLvQb9t+jTSipvd75X2yginT4PjVbqDdlJAmxMm+wYElFmeR6EmLP5bYeoRVQ"></script>
ACCOUNT is a placeholder for the subdomain picked at signup.

Send every custom event through one small helper:
export const track=(name,title)=>{ try{ window.goatcounter?.count?.({ path:String(name).replace(/^\/+/,''), title:title||String(name), event:true }) }catch{} }

Suggested event names (no user file names sent): lut-download/<from>-<to>, icc-download/<space>-<kind>, image-drop, embed-copy/<space>, tour-step/<n>-<space>, code-lang/<lang>.

Hook points:
- Wrap the download helpers `dl()` (web/index.html:4138) and `save()` (web/index.html:5176).
- Image drop: the window drop listener (web/index.html:1837) and irow2.ondrop (web/index.html:4118).
- Language pick: the #cseg code-tab buttons.
- For user-initiated dossier opens, call window.goatcounter?.count?.({path:'/'+slug, title:document.title}). Don't call it on the first load of a /<space> page, which is already counted.

Things to settle before relying on the numbers:
- Each event counts people (one per 8-hour session), not clicks. To count every click, switch to the unversioned count.js and pass no_session:true.
- Expect about a third of traffic to be lost to adblockers, by GoatCounter's own estimate.
- Keep Google Search Console for search queries.
- Fallback if GoatCounter's terms change: Umami Cloud Hobby with umami.track(name, data). Note that each event property is billed as an extra event.

## files
['<session-scratch>/research/analytics.json', '<session-scratch>/research/analytics-src/']

## facts
- [fetched-primary] GoatCounter hosted pricing: 'free for reasonable public usage. Running your personal website or small-to-medium business on it is fine, but sending millions of pageviews/day isn't.' Funded by donations. (https://raw.githubusercontent.com/arp242/goatcounter/master/tpl/help/terms.md and tpl/home.gohtml)
- [unverified] GoatCounter has a 100k pageviews/month free cap and commercial plans from $5/mo: Appears only on third-party review sites and contradicts the vendor's own text in the repo (Search snippets from analytics-alternatives.com, makerstack.co, privacytools.io)
- [fetched-primary] GoatCounter cookies and browser storage: Privacy policy: it doesn't store anything in the browser (cookies, localStorage, cache). In the code, count.js only reads the localStorage key 'skipgc', which is written when the owner opens #toggle-goatcounter to exclude their own visits. (tpl/help/privacy.md; public/count.js)
- [fetched-primary] GoatCounter event API: window.goatcounter.count({path:'name', title:'...', event:true}). The path doubles as the event name and cannot start with '/'. Clicks can also be tracked with data-goatcounter-click attributes. (tpl/help/events.md; tpl/help/js.md)
- [fetched-primary] GoatCounter visit deduplication: Visits are identified by hash(siteID, User-Agent, IP), kept in server memory for 8 hours; the IP and User-Agent are never written to disk. As a result, each event name counts people, not clicks. (tpl/help/sessions.md)
- [computed] SRI hash for the pinned count.v5.js: sha384-atnOLvQb9t+jTSipvd75X2yginT4PjVbqDdlJAmxMm+wYElFmeR6EmLP5bYeoRVQ. This matches openssl run on the repo's public/count.v5.js. The live file on gc.zgo.at could not be fetched (blocked by the proxy). (tpl/help/countjs-versions.md plus a local openssl hash)
- [computed] Option to count every click (no_session): Only the unversioned count.js supports it; count.v5.js has 0 occurrences (grep of public/count.js vs public/count.v5.js)
- [fetched-primary] What GoatCounter collects by default: Referrer, browser/OS, screen size, country, region (regions only for US, RU, CN) and sessions. Countries are stored as ISO 3166-2 codes such as US or US-TX. (settings.go; tpl/help/export.md)
- [fetched-primary] GoatCounter data export and dashboard sharing: CSV export (needs a setting turned on), JSON zip export and a REST API (/api/v0/export, /api/v0/stats/*, 4 requests/s). Dashboard visibility can be private, secret-link or public. (tpl/help/export.md, api.md; settings.go)
- [fetched-primary] Traffic lost to adblockers with GoatCounter: Most adblockers block goatcounter.com; the author estimates about a third of pageviews are missed. A custom domain doesn't help. (tpl/help/faq.md)
- [fetched-primary] Cloudflare Web Analytics custom events: 'Not yet, but we may add support for this in the future.' (https://raw.githubusercontent.com/cloudflare/cloudflare-docs/production/src/content/docs/web-analytics/faq.mdx)
- [fetched-primary] Cloudflare Web Analytics price and limits: Free. Up to 10 sites that aren't proxied through Cloudflare. Six months of history; data is unsampled for 7 days, then aggregated to about 10%. Reports country, referer, path, device, browser and OS. No query strings or UTM tags. Blocked by adblockers. (cloudflare-docs partial web-analytics-definition.mdx, limits.mdx, faq.mdx, data-metrics/dimensions.mdx)
- [fetched-primary] Plausible free plan: No free cloud plan; 30-day trial only. Billing counts both pageviews and custom events. Custom properties need the Business tier. The 15% open-source discount applies only to annual Business plans. (https://raw.githubusercontent.com/plausible/docs/master/docs/subscription-plans.md; plausible/analytics README)
- [fetched-primary] Plausible self-hosted Community Edition: Licensed AGPLv3. Needs a server running ClickHouse with at least 2 GB of RAM recommended. (plausible/analytics README; plausible/community-edition README)
- [search-snippet] Plausible Starter price: About $9/month for 10k pageviews (Third-party search snippets (seline.com, saaspricehub.io))
- [fetched-primary] Umami Cloud free tier and how usage is counted: The Hobby plan is free. Each pageview counts as 1 event, and each stored event-data property counts as another event. (https://raw.githubusercontent.com/umami-software/docs/master/content/docs/cloud/faq.mdx)
- [search-snippet] Umami Cloud Hobby limits: 100K events/month and 6-month retention. Website count conflicts: 1 (umami.is snippet) vs 3 (third-party snippet). (Search snippets from umami.is/pricing and productanalytics.tools)
- [fetched-primary] Umami cookies and event API: No cookies; requests are sent with credentials 'omit'. The only localStorage key is the opt-out 'umami.disabled'. Events: umami.track('name', {data}) or data-umami-event attributes; names are cut off after 50 characters. (umami-software/umami master src/tracker/index.ts; docs content/docs/faq.mdx, track-events.mdx)
- [fetched-primary] Counter.dev events and storage: No event API: the tracker only sends to /track and /trackpage. It sets a sessionStorage flag '_swa'. Its README says SaaS analytics may need consent under the ePrivacy Directive. Licensed AGPL. (https://raw.githubusercontent.com/ihucos/counter.dev/master/docs/script.js and README.md)
- [computed] Simple Analytics event API: sa_event('name') (namespace 'sa' + '_' + 'event') (simpleanalytics/scripts src/default.js and compile.js)
- [search-snippet] Simple Analytics free plan: Free forever, 5 websites, 30-day history. Whether events work on the free plan is unconfirmed. (Search snippet from simpleanalytics.com/pricing; third-party snippets)
- [search-snippet] GA4 cookies: _ga and _ga_<container-id>, each with a default expiry of 2 years (developers.google.com/analytics/devguides/collection/ga4/cookie-usage (search snippet))
- [fetched-primary] GitHub repo Insights traffic: Repository only: full clones, visitors over the past 14 days, referring sites and popular content. Needs push access. It does not cover the Pages site. (https://raw.githubusercontent.com/github/docs/main/content/repositories/viewing-activity-and-data-for-your-repository/viewing-traffic-to-a-repository.md; community discussions (snippets) for the Pages exclusion)
- [computed] color-space.io dossier navigation: Dossiers open in-page with history.replaceState, and the index page's canonical tag stays https://color-space.io/. count.js picks the canonical path, so dossier opens need an explicit count({path:'/'+slug}). (web/index.html around lines 7 and 2588; public/count.js get_path)
