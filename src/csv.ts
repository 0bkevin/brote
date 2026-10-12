/** Quoting alone does not stop spreadsheet formula parsing. */
export function csvCell(value: string): string {
  const literal = /^[\s\u0000-\u001f]*[=+@-]/.test(value) || /^[\t\r\n]/.test(value)
    ? "'" + value : value;
  return `"${literal.replaceAll('"', '""')}"`;
}

export function csvDocument(rows: string[][]): string {
  return "\uFEFF" + rows.map(row => row.map(csvCell).join(",")).join("\r\n");
}
