# assets/data

Optional JSON feeds consumed by `assets/js/data.js` / the Developer Dashboard.
Kept out of the service-worker core precache; add any new JSON here and extend `sw.js`
runtime caching if you want offline access to it.