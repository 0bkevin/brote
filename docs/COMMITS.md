# Historial de commits de Brote

Estos commits ya existen en la rama `main`. Están ordenados desde la estructura inicial hasta las auditorías, las correcciones y la interfaz web compacta. Cada entrada explica el cambio y su propósito.

Para ver el historial completo en el repositorio:

```sh
git log --reverse --oneline
git show <hash>
```

## 1. `f391f28` — chore: bootstrap the React and TypeScript web workspace

Set up Vite, reproducible npm dependencies, a runnable entry point, and build/test scripts for the hackathon app.

## 2. `92e9645` — refactor: define wallet contracts and separate practice from SOL

Establish profile, goal, transaction and store types shared by parallel modules. Format fictitious Brotes separately from real SOL.

## 3. `bbf730c` — feat: enforce practice balances, approvals and savings rules

Implement immutable integer-cent balances, once-only expense approval, savings goals, paused wallets and validated local profiles. Reject crypto ledger mutations.

## 4. `7cc76c8` — test: protect practice money invariants and saved-state validation

Cover non-negative funds, exact amounts, approval replay protection, savings, unique rewards, pause guards and corrupted persisted data.

## 5. `3dbc590` — feat: persist the practice journey in the browser

Expose a React store backed by validated localStorage, with safe in-memory fallback and synchronous state mutation errors.

## 6. `bf2181f` — feat: introduce the illustrated family identity

Add original SVG profile companions, a leaf logo and a friendly growing plant illustration without third-party game assets.

## 7. `a032135` — style: establish the family dashboard design system

Create the desktop web shell, calm palette, readable cards, wallet layouts and reduced-motion/accessibility styling.

## 8. `15bca20` — feat: add keyboard-accessible dialogs

Trap focus, restore focus on close, handle Escape and keep dialog content scrollable while locking the background.

## 9. `d07a1a6` — feat: create profiles and manage supervised practice wallets

Add profiles with adult sharing agreement, fake-money allocation, categorized expenses, savings goals and guardian spending rules.

## 10. `1a0d93b` — feat: turn financial learning into three playable adventures

Introduce shopping, phishing and emergency-budget games with feedback, XP, badges and one-time practice rewards.

## 11. `c4307a4` — feat: derive stable Solana profile seeds and exact lamports

Keep derivation within the 32-byte seed limit and parse SOL amounts without losing lamport precision. Encode transaction signatures for recovery links.

## 12. `8eff414` — feat: connect mainnet guardian accounts and sign supervised SOL transfers

Verify the cluster fingerprint, derive zero-data System accounts, read RPC balances/history and prepare guardian-signed account creation, deposits and TransferWithSeed withdrawals.

## 13. `a8865d0` — test: verify deterministic accounts and guardian withdrawal authority

Check seed stability, precise lamports, base signer instruction keys and signature encoding without sending funds.

## 14. `1c88b7b` — feat: expose verified Solana balances and transaction receipts

Add wallet connection and read-only exploration, account actions, honest unknown/error states and Explorer links for confirmed or uncertain transactions.

## 15. `ebdcc75` — feat: preserve profile identities through backup and restore

Export stable profile IDs and the guardian public address. Validate imports and download the current journey before replacing local data.

## 16. `654276e` — feat: connect the family dashboard, learner spaces and activity review

Integrate modules, role demo views, derived weekly summaries, guardian review, CSV export, preferences and profile recovery.

## 17. `34ad8b7` — docs: explain the Solana custody model and integration limits

Document seeded System accounts, guardian-only authorization, RPC verification, error behavior and the absence of private-key storage or a custom program.

## 18. `f03ee5a` — docs: define the brand and roadmap beyond the prototype

Capture naming alternatives and distinguish shipped scope, hackathon validation, production identity/consent/recovery and future Visa exploration.

## 19. `d94a69c` — docs: prepare a timed pitch and honest hackathon submission

Map the product to judging criteria and plan a three-minute demo, with explicit placeholders for team bios, recordings and actual transaction proof.

## 20. `380168a` — docs: document setup, verified scope and static Site hosting

Explain how to run/test the app, prototype boundaries and dependency findings. Retain the registered Site ID and declare dist as static output.

## 21. `17863fd` — build: support static app routes and browser-compatible Solana assets

Add a real /app entry for static hosting, resolve browser Buffer imports and split Solana assets into cacheable chunks.

## 22. `bbc89df` — style: give Brote a vivid game-inspired visual identity

Replace the sage palette with purple, blue, lime and coral. Add a dark sidebar, bold rounded type, stronger actions and a quieter simple-mode presentation.

## 23. `11edea2` — feat: refresh the Brote mascot and collectible profile companions

Introduce original cel-shaded SVG artwork, vivid animal avatars, a modern sprout mark, standalone logo and favicon. Use unique SVG gradient IDs.

## 24. `5b69fd6` — feat: add step-by-step learning and optional spoken questions

Make missions more vivid while preserving rewards. Simple mode shows one quiz question at a time, prevents incomplete submissions and offers explicit spoken prompts.

## 25. `1870bb9` — feat: introduce a compelling game-inspired Brote landing page

Explain the shared learning journey with original illustrations, three steps, playable mission teasers, inclusive messaging and working app links.

## 26. `63f92cb` — feat: connect the landing, app routes and persistent simple mode

Route the product landing and web app separately. Support direct learning/Solana links, save the simple-mode preference and show the active demo profile.

## 27. `11e10ca` — fix: explain mainnet RPC fallback without exposing technical payloads

Keep the verified PublicNode fallback visible in plain language while avoiding raw JSON identifiers in the user flow.

## 28. `a408799` — docs: align the product story with the final brand and broad audience

Retain Brote, document the energetic identity and simple mode, and update the roadmap for young children, adult beginners and senior learners.

## 29. `18ef9ad` — fix: preserve landing CTA contrast on vivid sections

Keep the demo link and arrow dark on light buttons inside purple sections, correcting the issue observed during visual QA.

## 30. `8b58c60` — docs: capture browser verification and submission links

Record automated checks, tested practice flows, real mainnet reads, screenshots and honest remaining signing/usability limits. Include the product and logo targets for the submission.

## 31. `e499590` — docs: index the complete implementation commit history

Documenta cada hito real de implementación con su hash, propósito y comandos para inspeccionar los cambios.

## 32. `3aafb4c` — docs: add an interactive product and roadmap overview

Añade un resumen interactivo del producto, capturas, roadmap e historial para revisar la entrega.

## 33. `46d6a3e` — fix(learning): stop quiz narration when its context closes

Detiene la voz del quiz al cerrar, cambiar de pregunta o salir del perfil. Desconecta callbacks y comprueba la cancelación con un stub.

## 34. `5236f67` — fix(wallets): bind consent to identity and complete goals at their exact target

Vuelve a pedir consentimiento al editar identidad y permite ahorrar el último centavo de una meta; se prueba 1,99 de 2 antes de completar.

## 35. `91df8fd` — fix(ledger): preserve exact cents and record purchase review dates

Convierte decimales a centavos exactos, valida movimientos positivos y registra la fecha de resolución de cada gasto.

## 36. `59df3f1` — fix(a11y): isolate dialogs from background navigation

Aísla el fondo de los diálogos, filtra controles visibles habilitados y devuelve el foco al cerrar. Se comprueba Tab, Shift+Tab y Escape en Chrome.

## 37. `d0699ae` — fix(solana): journal signed operations and retry identical transactions

Guarda firmas y bytes antes de enviar, bloquea resultados inciertos y reintenta la misma transacción. Valida identidad, firmas y estados terminales sin perder pendientes.

## 38. `f3edd5a` — fix(storage): serialize durable writes and preserve recovery identities

Coordina un único escritor entre pestañas, guarda antes de confirmar y conserva registros dañados. Las copias retienen identidades, responsables y operaciones firmadas.

## 39. `92d1515` — fix(solana): guard wallet sessions, verified reads and operation handoff

Protege sesiones y perfiles durante la firma, sincroniza el journal al cambiar de pestaña y conserva lecturas conocidas al usar el RPC de respaldo.

## 40. `823c7a1` — fix(export): escape spreadsheet formulas behind leading whitespace

Neutraliza fórmulas en CSV incluso después de espacios, tabulaciones o saltos. Comprueba comillas, Unicode y documentos exportados.

## 41. `73ad4fc` — fix(recovery): carry pending signatures and cancel stale restores

Exporta las firmas pertinentes y valida la derivación al restaurar. Detiene restauraciones canceladas o desactualizadas y conserva originales recuperables.

## 42. `47cf807` — fix(app): expose persistence state and clarify guardian actions

Muestra los estados de persistencia, limita los avisos de aprobación a responsables y usa fechas de resolución en el historial. La landing deja libre el bloqueo de edición.

## 43. `a01b0b3` — style(web): remove decorative card borders and compact the responsive layout

Elimina contornos y franjas de las tarjetas, compacta la barra de escritorio a 62 px y ajusta formularios, juegos, landing y Solana en pantallas estrechas.

## 44. `234ee32` — feat(navigation): move mobile controls into a full-height side sheet

Sustituye las barras móviles por un header y un panel lateral desde la derecha, a toda la altura. Reutiliza las acciones de escritorio y conserva el manejo de foco.

## 45. `27e36eb` — style(mobile): size compact controls and icons around 34px

Reduce el header móvil a 48 px y los controles a unos 34 px. Mantiene texto legible y altura flexible para contenidos con varias líneas.

## 46. `030244a` — docs(quality): record independent audits and responsive browser evidence

Registra la auditoría por función, las 53 pruebas y los recorridos de navegador. Incluye capturas y límites explícitos de firma real y dispositivos físicos.

## Actualización de este índice

El commit `docs: extend the complete change history after audits and mobile refinements` añade esta versión del índice y actualiza el resumen interactivo. Su hash se consulta con `git log` para evitar una referencia al propio hash dentro de su contenido. El historial conserva los commits separados y no se ha reescrito en un único commit.
