/** Cancel our utterance without leaving callbacks attached to a dismissed quiz. */
export function stopSpeech(
  synthesis: Pick<SpeechSynthesis, "cancel">,
  utterance: SpeechSynthesisUtterance | null,
): void {
  if (!utterance) return;
  utterance.onstart = null;
  utterance.onend = null;
  utterance.onerror = null;
  synthesis.cancel();
}
