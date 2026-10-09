# Slutet test (Google Play) och TestFlight (iOS)

Nya **personliga** Play-utvecklarkonton måste köra ett **slutet test med minst 12 testare som är
anmälda (opted in) i 14 dagar i följd** innan man kan ansöka om produktionsåtkomst
(spec §12). Klockan räknas per testare från att de gått med; byter man ut testare börjar deras
14 dagar om. Rekommendation: bjud in **15–20** personer så att 12 säkert håller hela vägen.

| Fil                                        | Används när                                                      |
| ------------------------------------------ | ---------------------------------------------------------------- |
| `invite-sv.md`, `invite-nb.md`             | Dag 0 – inbjudan (mejl/sms/Facebookgrupp/husbilsforum)           |
| `tester-guide-sv.md`, `tester-guide-nb.md` | Länkas från inbjudan – hur man går med och vad man testar        |
| `reminders.md`                             | Dag 7 och dag 12 – påminnelser                                   |
| `production-access-answers.md`             | Dag 14+ – svar på Googles frågor i ansökan om produktionsåtkomst |
| `testflight.md`                            | iOS – text för TestFlight (beta-beskrivning, "What to test")     |

## Tidslinje

| Dag | Händelse                                                                                          |
| --- | ------------------------------------------------------------------------------------------------- |
| 0   | Closed testing-spåret publicerat. Inbjudan skickas. Logga datum i `PROGRESS.md`.                  |
| 1–3 | Följ upp tills ≥ 12 (helst 15+) har gått med (Play Console → Testing → Closed testing → Testers). |
| 7   | Påminnelse 1. Släpp gärna en uppdatering med rättningar (visar Google att appen utvecklas).       |
| 12  | Påminnelse 2 – "håll kvar appen två dagar till".                                                  |
| 14  | Kontrollera i Play Console att 12+ varit anmälda i 14 dagar → ansök om produktion.                |
