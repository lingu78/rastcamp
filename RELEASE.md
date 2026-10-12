# Release-guide – Rastcamp

> **Android är pausad** (Linus 2026-10-12): steg 3 (Google Play Console) och steg 5 (Android-testare)
> görs inte nu. iOS (steg 1, 2, 4, 6) gäller.

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

## Steg 4 – Apple Developer Program (🔑, 99 USD/år)

Kontrollerat mot Apples och Expos dokumentation och eas-cli 24.12 (2026-10-10). Bakgrund: den
_första_ iOS-signeringen (certifikat + provisioning-profil) kan inte skapas i GitHub Actions –
eas-cli kräver en interaktiv körning en gång. Därefter sköts byggen och uppladdning i Actions.

1. Gå med som _Individual_: <https://developer.apple.com/programs/enroll/> (enklast i appen
   _Apple Developer_ på iPhone; Apple-ID med tvåfaktorsautentisering, juridiskt namn – det
   visas som säljare i App Store).
2. **App Store Connect** (<https://appstoreconnect.apple.com>), som Account Holder:
   1. _Business_ → _Agreements_: godkänn eventuella uppdaterade avtal (gratisappar behöver
      bara Apple Developer Program License Agreement – inget Paid Apps-avtal, ingen bank/skatt).
   2. _Business_ → _Agreements_ → _Compliance_ → **Digital Services Act** → _Complete
      Compliance Requirements_ → trader-status. Gratis, utan reklam/köp/företag: normalt
      **"This is not a trader account"** (ditt beslut; Apples hobbyexempel). Krävs för att få
      skicka in appar.
   3. _Users and Access_ → _Integrations_ → _App Store Connect API_ → **Request Access** →
      godkänn villkoren → _Submit_ (Apple granskar; behövs för API-nyckeln i steg 3.3).
3. **En gång på din dator** (Windows/Mac/Linux, ingen Mac krävs; Node.js 22.18+ från
   <https://nodejs.org> och git):
   ```bash
   git clone https://github.com/lingu78/rastcamp.git
   cd rastcamp
   npm ci
   npx eas-cli@latest login
   npx eas-cli@latest credentials:configure-build -p ios -e production
   ```
   1. `login`: ditt Expo-konto.
   2. `configure-build`: svara **Yes** på inloggning hos Apple → Apple-ID, lösenord,
      2FA-kod → **Yes** på att låta EAS skapa certifikat och profil. EAS registrerar
      bundle-ID:t `no.rastcamp.app` och sparar certifikat + profil (krypterat) hos Expo.
      Lösenordet skickas inte till Expo.
   3. Sedan, i samma terminal: `npx eas-cli@latest credentials -p ios` → _production_ →
      **App Store Connect: Manage your API Key** → **Set up your project to use an API Key
      for EAS Submit** → **Add a new key** → låt EAS skapa den → roll **ADMIN**.
   4. Om steg 3.3 felar för att API-åtkomsten (2.3) inte är godkänd än: vänta på Apples
      mejl och kör bara steg 3.3 igen.
4. **App Store Connect** → _Apps_ → **+** → _New App_: plattform **iOS**, namn `Rastcamp`,
   primärt språk **Swedish**, bundle-ID **no.rastcamp.app** (finns i listan efter steg 3),
   SKU `rastcamp`, _Full Access_ → _Create_. (Upptaget namn? Säg till.)
5. Skicka till Claude Code appens **Apple ID** – siffrorna under _App Information_ →
   _General Information_ (inte ditt inloggnings-Apple-ID). Det läggs i `eas.json`
   (`ascAppId`, inte hemligt); därefter bygger och laddar Actions upp till **TestFlight**.
6. Installera _TestFlight_ på iPhonen; du är intern testare som Account Holder (ingen
   granskning för interna testare).

Underhåll: certifikatet gäller ett år – när det går ut körs steg 3 igen. Medlemskap och nya
avtal måste förnyas/godkännas i tid, annars stoppas uppladdningar.

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
