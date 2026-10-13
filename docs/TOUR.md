# Guided walkthrough

Brote uses [Driver.js](https://driverjs.com/) (MIT) for an optional six-step tour: the circle, practice wallets and goals, games, activity, Solana, and preferences. A small first-visit invitation offers **Take a quick tour** or **Skip tour**. Nothing opens automatically. The tour can always be restarted from **About Brote**, including the mobile menu.

The tour supports English, Spanish and Brazilian Portuguese, with copy tailored to guardians and learners. Back, Next, Skip and Escape are available; completion or dismissal returns to the previous page, money mode, scroll position and a usable focus target. The versioned `brote-guided-tour-v1` browser preference prevents repeated invitations. Blocked storage still remembers the choice for the current app session.

The guide navigates views without creating profiles, changing balances, connecting a wallet or signing transactions. Background controls are inert while it runs. Driver waits for React-rendered targets; navigation is guarded against repeated clicks, and backdrop taps are ignored to prevent an accidental tap during a transition from dismissing the guide. Skip and Escape remain available. Cleanup restores the previous inert state and cancels pending transitions. A cross-tab language change closes the active tour rather than leaving mixed-language instructions.

The popovers use Brote's typography, purple accents, soft shadows and 34px controls. They respect reduced motion and adapt to narrow screens; short viewports allow the popover to scroll.

## Verification

- Invitation dismissal persists across reloads; replay remains available.
- All six steps, Back, completion and Escape work on desktop.
- All six Portuguese steps fit a 320 × 780 viewport with 34px controls and no horizontal overflow.
- The Spanish learner tour preserves the selected learner and returns to the learning page after a mid-transition skip.
- Rendering a previously pending target after dismissal does not resurrect the tour or leave the app inert.
- A double-click on Next advances one step and leaves exactly one popover open.
- The regression suite (103 tests), TypeScript/Vite production build and whitespace checks pass.
