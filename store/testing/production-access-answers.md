# Ansökan om produktionsåtkomst (Google Play) – förberedda svar

Play Console → Dashboard → **Apply for production** (visas när 12+ testare varit anmälda i 14
dagar). Frågorna kan formuleras lite olika; svaren nedan täcker det Google brukar fråga.
Fyll i siffrorna från Play Console (Testing → Closed testing → Testers / Statistics) innan du skickar.

## Del 1 – Om det slutna testet

**How easy was it to recruit testers for your app?**
→ _Neither difficult nor easy_ (eller det som stämmer).

**Describe the engagement you received from testers during your closed test.**

> {{N}} testers – mostly motorhome and caravan owners in Sweden and Norway recruited from friends,
> colleagues and motorhome communities – used the app for 14+ days, including on real trips.
> They tested the map with category filters, the nearby list, place details, "Navigate" hand-off
> to Google Maps, favourites, search, the three languages and – importantly – offline use in
> airplane mode and in areas without coverage.

**Provide a summary of the feedback you received from testers. Include how you collected the feedback.**

> Feedback came by email and Play's private feedback. Main points: {{SAMMANFATTNING – t.ex.
> "requests for more LPG locations", "a few places with outdated info", "wish for bigger text on
> chips"}}. We fixed {{X}} issues and shipped {{Y}} updates during the test (versions {{…}}).
> Data errors are fixed upstream in OpenStreetMap via the in-app "Report an error" link.

## Del 2 – Om appen

**Who is the intended audience of your app?**

> Adults travelling by motorhome or caravan in Sweden, Norway, Finland and Denmark who need to
> quickly find the nearest motorhome stop, campsite, dump station, water point, rest area or LPG.

**Describe how your app provides value to users.**

> It answers "where can I empty / fill water / sleep tonight?" in seconds. All ~13,000 places
> are stored on the phone, so the list, search and details work without mobile coverage – common
> in the Nordic mountains. It is free, with no account, no ads and no data collection.

**How many installs do you expect in your first year?**
→ _0–10K_ (eller det du tror).

## Del 3 – Produktionsberedskap

**What changes did you make to your app based on what you learned during your closed test?**

> {{Lista: buggfixar, UI-justeringar, datakvalitet – med versionsnummer}}

**How did you decide that your app is ready for production?**

> No crashes reported in Android vitals during the test, all testers could complete the main
> flows (find nearest dump station, open details, navigate) online and offline, the manual test
> plan (TESTPLAN.md) passes on several devices, and automated tests + an emulator smoke test run
> on every change.
