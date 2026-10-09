# Rastcamp datapipeline

Bygger appens offline-data (`pois.json.gz`) från OpenStreetMap via Geofabrik-extrakt för
Sverige, Norge, Finland och Danmark.

```
Geofabrik *.osm.pbf ──osmium tags-filter──▶ *-filtered.osm.pbf ──osmium export──▶ *.geojsonseq
        (MD5-verifierad)                                                              │
                                                                                      ▼
   out/pois.json.gz + manifest.json + report.json ◀── Node: kategorisera, centroid, whitelist,
                                                       vatten-regel, dedup 30 m, kontroller
```

## Köra lokalt

Krav: Node.js ≥ 22.18 (kör TypeScript direkt) och [osmium-tool](https://osmcode.org/osmium-tool/)
(`brew install osmium-tool` / `sudo apt install osmium-tool`). Inga npm-beroenden.

```bash
npm run data:build                    # laddar ner ~3 GB PBF till data-pipeline/work/ och bygger
npm run data:build -- --skip-download # återanvänd redan nedladdade PBF-filer
npm run data:build -- --countries denmark   # bara ett land (snabbtest; ger färre träffar)
npm run data:build -- --input min.osm.pbf   # valfri lokal fil (upprepbar)
```

Resultat i `data-pipeline/out/` (gitignorerad):

| Fil             | Innehåll                                                                             |
| --------------- | ------------------------------------------------------------------------------------ |
| `pois.json.gz`  | Det som publiceras och bäddas in i appen                                             |
| `pois.json`     | Samma, okomprimerad (för felsökning)                                                 |
| `manifest.json` | Version, datum, antal per kategori, storlek, SHA-256 (gzip och JSON)                 |
| `report.json`   | Antal per kategori × land, borttagna dubbletter, vanligaste OSM-nycklar per kategori |

Bygget **misslyckas** (exit 1) om någon kategori får 0 träffar, om gzip-filen är > 5 MB eller
om utdata inte klarar schemavalideringen.

## Automatik

`.github/workflows/data.yml`:

- **Månadsvis** (den 3:e, 04:23 UTC) och manuellt på `main`: bygger och publicerar till
  GitHub Pages (`gh-pages`-grenen) via `publish.sh`.
- Vid push som ändrar pipelinen: bygger på riktig data (artefakt + sammanfattning), publicerar inte.

Publicerad struktur: `data/manifest.json`, `data/pois.json.gz` samt
`data/archive/pois-<version>.json.gz` (24 senaste versionerna – ODbL, se DECISIONS.md).

## Kategorier och taggning

Se `src/categorize.ts` (regler) och DECISIONS.md §7 (motiveringar). Sammanfattning:

| Kategori                    | OSM                                                                                                                                                               |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `caravan_site` – Ställplats | `tourism=caravan_site`                                                                                                                                            |
| `camp_site` – Camping       | `tourism=camp_site`, utom `backcountry=yes`, `camp_site=basic/backcountry`, `motor_vehicle=no`, `caravans=no`+`motorhome=no` – om inte `motorhome`/`caravans=yes` |
| `dump_station` – Tömning    | `amenity=sanitary_dump_station`, eller `sanitary_dump_station=yes/customers/public` på annat objekt                                                               |
| `water` – Vatten            | `amenity=water_point`, `water_point=yes`; `amenity=drinking_water` endast med `caravans/motorhome=yes` eller ≤ 50 m från tömning                                  |
| `rest_area` – Rastplats     | `highway=rest_area`, `highway=services`                                                                                                                           |
| `lpg` – Gasol               | `amenity=fuel` + `fuel:lpg=yes`, `shop=gas`                                                                                                                       |

Alla kategorier: `access=private/no`, `disused=yes`, `abandoned=yes` och
`opening_hours=closed/off` utesluts. Ytor/relationer reduceras till ytans tyngdpunkt.
Samma kategori inom 30 m slås ihop (objektet med namn/flest taggar behålls, saknade taggar ärvs).

## Filformat (schema 1)

```jsonc
{
  "schema": 1,
  "version": "2026-10-02", // OSM-datadatum (UTC)
  "dataTimestamp": "2026-10-02T20:21:03Z",
  "generated": "2026-10-03T04:31:10.123Z",
  "attribution": "© OpenStreetMap contributors",
  "license": "ODbL-1.0",
  "categories": ["caravan_site", "camp_site", "dump_station", "water", "rest_area", "lpg"],
  "pois": [
    // [osm-id, kategoriindex, lat, lon, namn ("" = saknas), taggar (utelämnas om tomma)]
    ["n123", 0, 59.3, 18.0, "Hamnens ställplats", { "fee": "yes", "power_supply": "yes" }],
    ["w100", 1, 59.311, 18.011, "Sjöviks camping"],
  ],
}
```

Unik nyckel för en plats: `<osm-id>/<kategori>` (ett objekt kan ge flera platser, t.ex. en
camping med tömning). Typer och validering delas med appen: `src/schema.ts`, `src/validate.ts`.

## Licens

Datan är en härledd databas av OpenStreetMap och licensieras under
[ODbL 1.0](https://opendatacommons.org/licenses/odbl/1-0/). © OpenStreetMap contributors.
