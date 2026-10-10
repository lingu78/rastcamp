# App Review – "Notes for review" (klistra in i App Store Connect → App Review Information)

**Sign-in required:** No (uncheck "Sign-in required"). **Contact:** Linus (🔑 namn, telefon, e-post).

---

Rastcamp is a free utility for motorhome and caravan travellers in Sweden, Norway, Finland and
Denmark. It answers one question fast: where is the nearest motorhome stop, campsite, dump
station (grey water / cassette), water point, rest area or LPG?

No account, no sign-in, no ads, no in-app purchases, no analytics or tracking SDKs.

How to review:

1. Open the app. Allow location when asked (or deny – the app works either way: the map then
   starts over Scandinavia and distances are measured from the map centre).
2. Map tab: tap the "Tömning"/"Dump station" chip to filter; tap a cluster to zoom; tap a
   marker to open the place sheet with details and the actions Navigate (opens Apple Maps),
   Save favourite, Share and Report an error (opens OpenStreetMap in Safari).
3. Nearby tab: the 100 nearest places of the selected categories with distance and direction;
   search by name at the top.
4. Favourites tab: places you saved, stored only on the device.
5. More tab: language (Swedish / Norwegian / English), data version, "Check for new data",
   licences and privacy policy.
6. Turn on Airplane Mode and relaunch: the list, search, details and favourites keep working
   because all ~13,000 places are stored in the app.

About guideline 4.2 (minimum functionality): Rastcamp is a native app, not a wrapped
website. It renders a native vector map (MapLibre), ships its own offline database of
~13,000 places compiled from OpenStreetMap, does nearest-place search and text search
on-device, keeps favourites locally and updates its database in the background with
checksum verification. None of this depends on a web view.

Location: used only on the device to sort places by distance and centre the map
("When In Use" only, no background location). Nothing is sent to us or any third party.

Data © OpenStreetMap contributors (ODbL). Map © OpenMapTiles, served by OpenFreeMap.
