# Release-guide – Rastcamp

Allt som kräver **konton, inloggning, betalning eller identitet (🔑)** görs av Linus. Allt annat
(byggen, uppladdning, texter, svar på avslag) sköts av Claude Code via GitHub Actions.
Uppskattad tid för Linus totalt: 2–4 timmar, utspritt.

> Molnmiljön där appen byggs når inte expo.dev/play.google.com/appstoreconnect, därför körs
> EAS-kommandon i GitHub Actions (`.github/workflows/eas.yml`) med `EXPO_TOKEN` som secret.

---

## Steg 1 – GitHub (🔑, ca 10 min)

GitHub Pages behövs för integritetspolicyn och den öppna datan (ODbL). **Pages fungerar inte på
privata repon med GitHubs gratisplan.**

1. Välj ett av:
   - **Rekommenderat:** gör repot publikt – <https://github.com/lingu78/rastcamp/settings> →
     _Danger Zone_ → **Change visibility → Public**. (Inga hemligheter finns i repot; koden är
     ändå "alla rättigheter förbehållna" – se DECISIONS.md.)
   - eller uppgradera till GitHub Pro (<https://github.com/settings/billing>).
2. Slå ihop arbetsgrenen till `main` (pull request från `claude/vibrant-meitner-czwl6o`).
3. Kör datapipelinen en gång: _Actions → Data → Run workflow_ (branch `main`). Den skapar grenen `gh-pages`.
4. <https://github.com/lingu78/rastcamp/settings/pages> → _Build and deployment_ → **Deploy from a branch** → `gh-pages` / `/ (root)` → **Save**.
5. Kontaktadress: <https://github.com/lingu78/rastcamp/settings/variables/actions> → **New repository variable** → namn `CONTACT_EMAIL`, värde t.ex. `rastcamp@…`. Kör _Data_ igen så publiceras integritetspolicyn på <https://lingu78.github.io/rastcamp/privacy/>.

## Steg 2 – Expo (🔑, gratis, ca 5 min)

1. Skapa konto: <https://expo.dev/signup>.
2. Skapa token: <https://expo.dev/settings/access-tokens> → **Create token** (namn `github-actions`).
3. Lägg in den som GitHub-secret: <https://github.com/lingu78/rastcamp/settings/secrets/actions> → **New repository secret** → `EXPO_TOKEN`.
4. Säg till Claude Code → kör `eas init` i Actions (skapar projektet, lägger `projectId` i app.json) och första Android-bygget.

## Steg 3 – Google Play Console (🔑, 25 USD engångsavgift, 1–3 dagar för verifiering)

1. Registrera: <https://play.google.com/console/signup>. Välj **Personal** (enskild person) –
   då gäller kravet på 12 testare i 14 dagar. (_Organization_ kräver D-U-N-S-nummer och företag
   men slipper testkravet.)
2. Betala 25 USD och genomför **identitetsverifieringen** (legitimation, ibland telefonnummer/adress).
3. EU-krav (DSA): ange **trader-status** i kontoinställningarna. En privatperson som ger ut en
   gratisapp utan kommersiellt syfte anger normalt _non-trader_ – det avgör du.
4. **Create app**: namn `Rastcamp`, standardspråk **Svenska (sv-SE)**, typ _App_, _Free_, godkänn deklarationerna.
5. Service account för automatisk uppladdning (EAS Submit):
   1. Play Console → **Settings → Developer account → API access** (eller följ <https://expo.fyi/creating-google-service-account>).
   2. Länka/skapa ett Google Cloud-projekt → **Create new service account** → i Google Cloud: _IAM → Service accounts → Create_ (namn `eas-submit`), ingen roll behövs där → **Keys → Add key → JSON** → spara filen.
   3. Tillbaka i Play Console → _Users and permissions_ → **Invite new users** → service-kontots e-post → behörighet **Admin (all permissions)** för appen Rastcamp (minst: _Release to testing tracks_, _Manage testing tracks_) → **Invite**.
   4. Ladda upp JSON-filen till EAS: <https://expo.dev> → projektet _rastcamp_ → **Credentials → Android → no.rastcamp.app → Service credentials → Add a Google service account key**. Lägg **inte** filen i repot.
6. Säg till Claude Code → bygger `.aab` och laddar upp till **Internal testing**.

## Steg 4 – Apple Developer Program (🔑, 99 USD/år, 1–2 dagar för verifiering)

1. Gå med: <https://developer.apple.com/programs/enroll/> (som _Individual_), med Apple-ID som har tvåfaktorsautentisering. Betala årsavgiften.
2. App Store Connect → **Apps → + → New App**: plattform iOS, namn `Rastcamp`, primärt språk
   **Swedish**, bundle-ID **no.rastcamp.app** (finns det inte i listan: registrera det på
   <https://developer.apple.com/account/resources/identifiers/add/bundleId>), SKU `rastcamp`. Notera **Apple ID** (siffror) under _App Information_ → ge det till Claude Code (`ascAppId`).
3. **EU-krav (DSA):** App Store Connect → _Business_ → ange trader-status. Utan den tas appen bort i EU.
4. App Store Connect API-nyckel: <https://appstoreconnect.apple.com/access/integrations/api> → **Generate API Key** → namn `EAS`, roll **App Manager** → ladda ned `.p8` (går bara en gång) och notera _Key ID_ och _Issuer ID_. Ladda upp i EAS: <https://expo.dev> → projektet → **Credentials → iOS → App Store Connect API Keys**.
5. **En gång, i din egen terminal** (Windows/Mac/Linux, ingen Mac krävs) – skapar certifikat och provisioning-profil:
   ```bash
   git clone https://github.com/lingu78/rastcamp.git && cd rastcamp && npm ci
   npx eas-cli@latest login
   npx eas-cli@latest build --platform ios --profile production
   ```
   Svara **Yes** på att logga in på Apple och låta EAS hantera certifikat; ange Apple-ID, lösenord och 2FA-kod. Därefter kan alla iOS-byggen och uppladdningar köras automatiskt.
6. Säg till Claude Code → laddar upp till **TestFlight**.

## Steg 5 – Testare (🔑 rekrytering)

Se `store/testing/README.md`. Minst 12 (helst 15–20) Android-testare som är anmälda i 14 dagar i
följd. Claude Code förbereder inbjudan, Google-grupp-/opt-in-länkar och påminnelser.

## Steg 6 – Inskick (🔑 knapptryck)

- **Google Play** (efter 14 dagar): Dashboard → **Apply for production** (svar i
  `store/testing/production-access-answers.md`) → när det godkänts: _Production → Create release_ → **Send for review**.
- **App Store**: App Store Connect → appen → version 1.0 → välj bygget → **Add for Review → Submit**.

---

## Referens: vad Claude Code fyller i i butikerna

| Var                     | Underlag                                                |
| ----------------------- | ------------------------------------------------------- |
| Butikstexter            | `store/listing/{sv,nb,en}.md`                           |
| Skärmdumpar             | `store/screenshots/final/{android,ios}/{sv,nb,en}/`     |
| Ikon / feature graphic  | `store/assets/`                                         |
| Integritet              | `store/apple-privacy.md`, `store/google-data-safety.md` |
| Åldersgräns, kategorier | `store/age-rating.md`                                   |
| App Review              | `store/apple-review-notes.md`                           |
| Test                    | `store/testing/`                                        |

## Byggkommandon (för referens)

```bash
npx eas-cli@latest build --platform android --profile production   # .aab
npx eas-cli@latest build --platform ios --profile production       # .ipa
npx eas-cli@latest submit --platform android --latest              # → Internal testing
npx eas-cli@latest submit --platform ios --latest                  # → TestFlight
npm run data:update                                                 # före varje release
```
