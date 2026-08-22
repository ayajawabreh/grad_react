/** Download tabular data without adding a spreadsheet dependency. */
export function downloadCsv(
  rows: Record<string, string | number | boolean | null | undefined>[],
  filename: string
) {
  if (!rows.length) return;

  const headers = Object.keys(rows[0]);
  const escape = (value: unknown) => {
    const text = String(value ?? "");
    return `"${text.replace(/"/g, '""')}"`;
  };
  const csv = [headers.map(escape).join(","), ...rows.map((row) =>
    headers.map((header) => escape(row[header])).join(",")
  )].join("\r\n");
  const url = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
