# Google Play – Data safety – underlag

**Resultat i butiken: "No data collected" och "No data shared with third parties".**

Play Console → App content → Data safety. Svara så här:

## Data collection and security

| Fråga                                                                                    | Svar                                     |
| ---------------------------------------------------------------------------------------- | ---------------------------------------- |
| Does your app collect or share any of the required user data types?                      | **No**                                   |
| (följer automatiskt) Is all of the user data collected by your app encrypted in transit? | Ej tillämpligt – ingen data samlas in    |
| Do you provide a way for users to request that their data is deleted?                    | Ej tillämpligt – inga konton, ingen data |

> Om formuläret ändå kräver svar på kryptering: **Yes** (all nätverkstrafik går över HTTPS).

## Motivering per datatyp (Googles definitioner)

- **Location (approximate/precise):** Appen läser positionen med `ACCESS_FINE_LOCATION`/`ACCESS_COARSE_LOCATION` men använder den **bara på enheten** (avstånd, centrera kartan). Den skickas aldrig från telefonen → _inte "collected"_ enligt Googles definition (överföring från enheten krävs).
- **App activity, App info and performance, Device or other IDs:** Inga analys-, krasch- eller reklambibliotek. Inget annons-ID används (`com.google.android.gms.permission.AD_ID` finns inte i manifestet).
- **Personal info, Financial info, Messages, Photos, Files, Contacts, Calendar, Health, Web browsing:** Används inte.
- **Kartbilder och datauppdatering:** Hämtning av kartplattor (OpenFreeMap) och datafil (GitHub Pages) skickar inga användardata eller identifierare utöver det som krävs för att över huvud taget göra en webbförfrågan; inget lagras av oss.

## Övriga avsnitt i "App content"

| Avsnitt              | Svar                                                                                            |
| -------------------- | ----------------------------------------------------------------------------------------------- |
| Privacy policy       | `https://lingu78.github.io/rastcamp/privacy/`                                                   |
| Ads                  | **No, my app does not contain ads**                                                             |
| App access           | **All functionality is available without special access** (inget konto)                         |
| Content rating       | Se `age-rating.md` (IARC)                                                                       |
| Target audience      | **18 och äldre** (vuxna husbilsägare; appen riktar sig inte till barn – undviker Families-krav) |
| News app             | No                                                                                              |
| Government app       | No                                                                                              |
| Financial features   | No financial features                                                                           |
| Health               | No health features                                                                              |
| Data safety          | Enligt ovan                                                                                     |
| Location permissions | Bara förgrund (ingen `ACCESS_BACKGROUND_LOCATION`) → ingen deklaration för bakgrundsplats krävs |
