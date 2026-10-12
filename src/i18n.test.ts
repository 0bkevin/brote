import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { formatMoney } from "./format";
import { getLanguage, setLanguage, t } from "./i18n-core";

let languageBeforeTest = getLanguage();
afterEach(() => {
  setLanguage(languageBeforeTest);
  languageBeforeTest = getLanguage();
});

test("language defaults to Spanish in a browser-free runtime", () => {
  assert.equal(languageBeforeTest, "es");
});

test("language selection switches translations and Spanish is the reset language", () => {
  setLanguage("es");
  assert.equal(getLanguage(), "es");
  assert.equal(t("Escribe el nombre de la persona."), "Escribe el nombre de la persona.");

  setLanguage("en");
  assert.equal(getLanguage(), "en");
  assert.equal(t("Escribe el nombre de la persona."), "Enter the person's name.");

  setLanguage("pt");
  assert.equal(getLanguage(), "pt");
  assert.equal(t("Escribe el nombre de la persona."), "Digite o nome da pessoa.");

  setLanguage("es");
  assert.equal(t("Escribe el nombre de la persona."), "Escribe el nombre de la persona.");
});

test("catalog lookup works from the Spanish source and from either translation", () => {
  const source = "No hay suficientes Brotes disponibles para este gasto.";
  setLanguage("en");
  assert.equal(t(source), "There aren't enough Brotes available for this expense.");
  assert.equal(t("There aren't enough Brotes available for this expense."), "There aren't enough Brotes available for this expense.");

  setLanguage("pt");
  assert.equal(t("There aren't enough Brotes available for this expense."), "Não há Brotes suficientes disponíveis para esta despesa.");
  assert.equal(t("Não há Brotes suficientes disponíveis para esta despesa."), "Não há Brotes suficientes disponíveis para esta despesa.");
});

test("placeholder translation interpolates caller values and embedded dynamic errors", () => {
  const detail = "RPC said [slot]. Try .* again (code 42).";
  setLanguage("en");
  assert.equal(
    t("La transacción fue firmada, pero el RPC no confirmó si se envió o ejecutó: {error}. Verifica el estado antes de reintentar.", { error: detail }),
    `The transaction was signed, but the RPC didn't confirm whether it was sent or executed: ${detail}. Check its status before trying again.`,
  );

  setLanguage("pt");
  assert.equal(
    t("RPC rechazado: el clúster no es Solana mainnet ({genesis}).", { genesis: "testnet (x.y)" }),
    "RPC rejeitado: o cluster não é a Solana mainnet (testnet (x.y)).",
  );

  assert.equal(
    t("{label} debe tener como máximo dos decimales y estar dentro del límite permitido.", { label: "El monto" }),
    "O valor deve ter no máximo duas casas decimais e estar dentro do limite permitido.",
  );
});

test("reverse matching escapes regex punctuation in translated templates", () => {
  setLanguage("pt");
  assert.equal(
    t("The transaction was signed, but the RPC didn't confirm whether it was sent or executed: RPC says [x].* (y). Check its status before trying again."),
    "A transação foi assinada, mas o RPC não confirmou se foi enviada ou executada: RPC says [x].* (y). Verifique o status antes de tentar novamente.",
  );
});

test("unknown messages fall back unchanged and caller names and addresses stay intact", () => {
  const unknown = "A new backend detail: {code}";
  setLanguage("pt");
  assert.equal(t(unknown, { code: "X-7" }), "A new backend detail: X-7");
  assert.equal(t("No se encontró la extensión {name}. Instálala y recarga la página.", { name: "My Phantom (work)" }), "A extensão My Phantom (work) não foi encontrada. Instale-a e recarregue a página.");

  const address = "8abc.def[ghi]";
  setLanguage("en");
  const confirm = t(`SOLANA MAINNET · SOL real

Crear cuenta para {name}
Dirección: {address}
Desde: {guardian}
Depósito inicial: {amount} SOL, más comisión de red.

La billetera del representante deberá firmar. ¿Continuar?`, {
    name: "Sam's (test)", address, guardian: "G1+guardian", amount: "0.123456789",
  });
  assert.match(confirm, /Create account for Sam's \(test\)/);
  assert.match(confirm, new RegExp(`Address: ${address.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));
  assert.match(confirm, /From: G1\+guardian/);
  assert.match(confirm, /Initial deposit: 0\.123456789 SOL/);

  const deposit = t(`SOLANA MAINNET · SOL real

Depositar {amount} SOL para {name}
Desde: {guardian}
Hacia: {address}
Más comisión de red pagada por el representante.

¿Continuar a la firma en tu billetera?`, {
    name: "Sam", address, guardian: "G1+guardian", amount: "2.5",
  });
  assert.equal(deposit, `SOLANA MAINNET · Real SOL

Deposit 2.5 SOL for Sam
From: G1+guardian
To: ${address}
Plus network fee paid by the guardian.

Continue to wallet signing?`);

  const withdrawal = t(`SOLANA MAINNET · SOL real

Retirar {amount} SOL de {name}
Desde: {address}
Hacia: {destination}
Firma: {guardian}
La comisión se paga desde la billetera del representante.

Verifica cuidadosamente el destino. ¿Continuar?`, {
    name: "Sam", address, destination: "Dest+1", guardian: "G1+guardian", amount: "0.5",
  });
  assert.equal(withdrawal, `SOLANA MAINNET · Real SOL

Withdraw 0.5 SOL from Sam
From: ${address}
To: Dest+1
Signer: G1+guardian
The fee is paid from the guardian's wallet.

Check the destination carefully. Continue?`);
});

test("money formatting uses the exact two supported display decimals per locale", () => {
  setLanguage("en");
  assert.equal(formatMoney(1234.5), "1,234.50 B");
  assert.equal(formatMoney(1.123456, "crypto"), "1.123456 SOL");

  setLanguage("es");
  assert.equal(formatMoney(1234.5), "1.234,50 B");
  assert.equal(formatMoney(1.123456, "crypto"), "1,123456 SOL");

  setLanguage("pt");
  assert.equal(formatMoney(1234.5), "1.234,50 B");
  assert.equal(formatMoney(1.123456, "crypto"), "1,123456 SOL");
});

test("generated ledger labels and incompatible account errors translate after locale changes", () => {
  setLanguage("en");
  assert.equal(t("Recompensa de misión"), "Mission reward");
  assert.equal(t("Recarga de práctica"), "Practice top-up");
  assert.equal(t("Ahorro para Libros de aventura"), "Savings for Adventure books");
  assert.equal(t("Ahorro para Sam's trip"), "Savings for Sam's trip");
  setLanguage("pt");
  assert.equal(t("Mission reward"), "Recompensa da missão");
  assert.equal(t("La cuenta existe, pero no es una cuenta de sistema vacía. Se bloquearon las operaciones."), "A conta existe, mas não é uma conta de sistema vazia. As operações foram bloqueadas.");
});
