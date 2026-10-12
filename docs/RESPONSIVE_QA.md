# Responsive visual review

Reviewed on October 12, 2026 using Chrome viewport emulation, screenshots, DOM measurements, and independent GPT-6 and Luna source reviews. The interface remains in Spanish.

## Coverage

The landing, dashboard, wallets, learning, activity, and preferences were inspected at all ten presets:

| Phone | Tablet | Laptop / desktop |
|---|---|---|
| 320 × 780 | 768 × 1024 | 1024 × 900 |
| 375 × 812 | 820 × 1180 | 1280 × 800 |
| 390 × 844 | | 1440 × 900 |
| 430 × 932 | | 1920 × 1080 |

Additional checks covered:

- Solana watch controls in normal and simple modes at every preset. The loaded read-only account view was checked at 320, 768, 820, 1024, and 1440px.
- Guardian and learner home layouts in simple mode at every preset.
- Profile creation for children and adults, assignment, savings, practice spending, goals, guardian rules, help, and reset confirmation. Forms were opened and closed without submitting new transactions or replacing data.
- All three games at phone, tablet, and desktop widths, including simple quiz and emergency layouts. Dialog headings remain outside the scrolling game body.
- Full-height right-side navigation at 320 and 390px, plus its scrollable content at 568 × 320. Desktop sidebar options remain reachable at 844 × 390.

## Findings and corrections

| Finding | Correction | Verified result |
|---|---|---|
| The Solana button measured 62px beside a 45px input. Inputs incorrectly inherited label-wrapper margins. | Remove the misplaced classes and share an explicit control height. | Input and button both measure 44px on desktop, 48px in desktop simple mode, and 34px on mobile. |
| Savings fields and amount presets were inconsistent with compact controls; preset text wrapped. | Include savings inputs in compact sizing, shorten the placeholder, and keep presets on one line. | Mobile inputs, saving actions, and all four presets measure 34px. |
| Approval buttons squeezed the purchase description at 320px. | Place review actions below the transaction text on narrow screens. | The purchase description and amount remain visible; approval actions stay accessible. |
| Three learning cards were too narrow at 1024px and clipped their footer actions. | Use two columns at medium desktop widths and allow footer wrapping. | Rewards and mission actions fit their cards without horizontal overflow. |
| Game budgets wrapped amounts and dialog bodies wasted available height. | Keep amounts together and let a single body use the available dialog height. | Budget values stay readable; long missions scroll beneath a persistent heading. |
| Mobile emergency controls competed with their labels. | Keep icon and label together, with the stepper on a second row. | Labels and 34px stepper buttons fit at 320px in normal and simple modes. |
| Short desktop windows left sidebar options below the viewport. | Allow the sidebar to scroll independently. | Preferences, simple mode, and help remain reachable in landscape. |
| Simple-mode home panels widened a 320px page to 339px. | Allow grid cards to shrink below their intrinsic content width. | Guardian and learner home pages fit every tested preset. |
| Landing game cards measured 307px inside a 292px narrow grid; card outlines were too heavy. | Use shrinkable grid tracks, remove card borders, and soften shadows. | Cards fit the 320px page with matching side margins. |
| Mobile landing actions were larger than app controls. | Use 34px actions and a 56px landing header. | Mobile calls to action remain compact and their labels fit. |

## Evidence

[Aligned Solana controls on desktop](assets/solana-aligned-desktop.png) · [Compact amount form](assets/assignment-compact-320.png) · [Mobile activity](assets/activity-compact-320.png) · [Emergency game](assets/emergency-aligned-320.png) · [Learning at 1024px](assets/learning-medium-desktop.png)

## Validation and limits

- All 53 regression tests pass; the TypeScript/Vite production build and `git diff --check` pass.
- Independent final reviews found no unresolved actionable responsive regressions. The final inspected local browser console had no errors or warnings.
- A read-only mainnet query of the public System Program address returned one lamport through the verified PublicNode fallback. The derived example profile had no created account.
- These are browser viewport checks, not physical-device or user-research results. Real wallet signing, funded account creation, deposits, and withdrawals were not performed in this visual pass.
- Single-line mobile controls use 34px. Multiline choices retain enough height for their text, and long public addresses scroll within their input rather than widening the page.
