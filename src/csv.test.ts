import test from "node:test";
import assert from "node:assert/strict";
import { csvCell, csvDocument } from "./csv";

test("CSV exports formula-looking text as a literal even after whitespace", () => {
  for (const prefix of ["", " ", "\t", "\r", "\n", " \t\r\n"]) {
    for (const marker of ["=", "+", "-", "@"]) {
      const value = prefix + marker + "1+1";
      assert.equal(csvCell(value), `"'${value}"`);
    }
  }
  assert.equal(csvCell('Libros, "fantásticos"'), '"Libros, ""fantásticos"""');
  assert.equal(csvDocument([["Fecha", "Persona"], ["2026-10-12", "Sofía"]]), '\uFEFF"Fecha","Persona"\r\n"2026-10-12","Sofía"');
});
