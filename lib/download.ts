import { Platform, Share } from "react-native";

function csvCell(value: unknown) {
  const text = value == null ? "" : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

type CsvRows = Record<string, unknown>[] | unknown[][];

export async function downloadCsv(
  filenameOrRows: string | CsvRows,
  rowsOrFilename: CsvRows | string,
  columns?: string[]
) {
  const filename = typeof filenameOrRows === "string"
    ? filenameOrRows
    : String(rowsOrFilename);
  const rows = Array.isArray(filenameOrRows)
    ? filenameOrRows
    : (rowsOrFilename as CsvRows);
  const records = Array.isArray(rows) ? rows : [];
  const headers =
    columns ??
    (records[0] && !Array.isArray(records[0])
      ? Object.keys(records[0] as Record<string, unknown>)
      : []);
  const lines = [
    headers.map(csvCell).join(","),
    ...records.map((row) =>
      (Array.isArray(row)
        ? row
        : headers.map((header) =>
            (row as Record<string, unknown>)[header]
          )
      )
        .map(csvCell)
        .join(",")
    ),
  ].filter(Boolean);
  const csv = `\uFEFF${lines.join("\n")}`;

  if (Platform.OS === "web") {
    const web = globalThis as any;
    const blob = new web.Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = web.URL.createObjectURL(blob);
    const anchor = web.document.createElement("a");
    anchor.href = url;
    anchor.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
    anchor.click();
    web.URL.revokeObjectURL(url);
    return;
  }

  await Share.share({ title: filename, message: csv });
}
