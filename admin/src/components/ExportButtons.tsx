import { useState } from "react";
import { Button, Stack } from "@mui/material";
import GridOnIcon from "@mui/icons-material/GridOn";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import { getToken } from "../apollo";
import { useAlert } from "./dialog";

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:3001/graphql").replace(/\/graphql\/?$/, "");

type Params = Record<string, string | number | null | undefined>;

function buildQuery(params: Params, format: string): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined && value !== "") {
      qs.set(key, String(value));
    }
  }
  qs.set("format", format);
  return qs.toString();
}

interface Props {
  /** Report name the server understands: orders | expenses | raw-items | dashboard. */
  report: string;
  /** Filters forwarded to the server so the export matches the on-screen view. */
  params?: Params;
  size?: "small" | "medium";
}

/** "Export to Excel / PDF" pair. The file is generated server-side from full
 *  data (no pagination cap); we download it via fetch + blob so the JWT travels
 *  in the Authorization header instead of the URL. */
export default function ExportButtons({ report, params = {}, size = "small" }: Readonly<Props>) {
  const notify = useAlert();
  const [busy, setBusy] = useState<"" | "xlsx" | "pdf">("");

  async function download(format: "xlsx" | "pdf") {
    setBusy(format);
    try {
      const res = await fetch(`${API_BASE}/export/${report}?${buildQuery(params, format)}`, {
        headers: { authorization: `Bearer ${getToken() ?? ""}` },
      });
      if (!res.ok) {
        throw new Error(await res.text());
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${report}-${new Date().toISOString().slice(0, 10)}.${format}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (e: unknown) {
      await notify({ title: "Export failed", message: e instanceof Error ? e.message : "Could not generate the export." });
    } finally {
      setBusy("");
    }
  }

  return (
    <Stack direction="row" spacing={1}>
      <Button size={size} variant="outlined" startIcon={<GridOnIcon />} onClick={() => download("xlsx")} disabled={busy !== ""}>
        {busy === "xlsx" ? "…" : "Excel"}
      </Button>
      <Button size={size} variant="outlined" startIcon={<PictureAsPdfIcon />} onClick={() => download("pdf")} disabled={busy !== ""}>
        {busy === "pdf" ? "…" : "PDF"}
      </Button>
    </Stack>
  );
}
