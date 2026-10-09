# Apple App Privacy ("Nutrition label") – underlag

**Svar i App Store Connect → App Privacy: "Data Not Collected".**

## Frågor och svar

| Fråga i App Store Connect                                       | Svar                                          |
| --------------------------------------------------------------- | --------------------------------------------- |
| Do you or your third-party partners collect data from this app? | **No, we do not collect data from this app**  |
| Privacy Policy URL                                              | `https://lingu78.github.io/rastcamp/privacy/` |
| User Privacy Choices URL (valfri)                               | lämnas tom                                    |

## Motivering (om Apple frågar)

Apples definition av "collect": data som skickas från enheten på ett sätt som låter utvecklaren
eller tredjepartspartner komma åt den längre än vad som krävs för att betjäna begäran i realtid.

| Data                               | Vad appen gör                                                                                                                                                                       | Insamlad? |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| Exakt/ungefärlig plats             | Används **endast i telefonen** för att räkna avstånd och centrera kartan. Skickas aldrig någonstans.                                                                                | Nej       |
| Favoriter, filter, språkval        | Sparas lokalt (AsyncStorage). Lämnar aldrig enheten.                                                                                                                                | Nej       |
| Kartbilder                         | Kartplattor hämtas från OpenFreeMap (öppen, gratis kartserver utan konto, nycklar eller cookies) för det område som visas. Ingen identifierare skickas; begäran besvaras i realtid. | Nej       |
| Datauppdatering                    | En gång per dygn hämtas `manifest.json` och ev. `pois.json.gz` från GitHub Pages. Inga parametrar eller identifierare skickas.                                                      | Nej       |
| Analys, kraschrapporter, reklam-ID | Finns inte. Inga tredjeparts-SDK:er för analys, krascher eller reklam.                                                                                                              | Nej       |
| Konto/inloggning                   | Finns inte.                                                                                                                                                                         | Nej       |

Spårning (ATT): appen spårar inte användare och visar ingen ATT-dialog. Ingen `NSUserTrackingUsageDescription`.

## Privacy manifest (PrivacyInfo.xcprivacy)

Expo/React Native-moduler deklarerar sina "required reason API"-användningar (t.ex.
`NSPrivacyAccessedAPICategoryUserDefaults`, `FileTimestamp`, `SystemBootTime`) i sina egna
privacy manifests som EAS Build slår ihop. Appen själv lägger inte till spårningsdomäner
(`NSPrivacyTracking = false`, inga `NSPrivacyTrackingDomains`, inga `NSPrivacyCollectedDataTypes`).
