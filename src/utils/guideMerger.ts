/**
 * Client-side guide PDF merger.
 *
 * Student guides  – publicly accessible PNGs (CORS: *).
 *                   Fetched directly from the browser, embedded as image pages.
 *
 * Teacher guides  – PDFs behind Google login.
 *                   Fetched via the Drive API using a GIS OAuth token
 *                   (scope: drive.readonly).  Requires VITE_GOOGLE_CLIENT_ID.
 */
import { PDFDocument } from "pdf-lib";

const DRIVE_DOWNLOAD = "https://drive.usercontent.google.com/download";
const DRIVE_API = "https://www.googleapis.com/drive/v3/files";

// ─── helpers ─────────────────────────────────────────────────────────────────

function extractFileId(url: string): string | null {
  const m = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  return m ? m[1] : null;
}

/** Sniff the actual file type from magic bytes — content-type can lie. */
function sniffType(bytes: ArrayBuffer): "pdf" | "png" | "jpeg" | "unknown" {
  const b = new Uint8Array(bytes, 0, Math.min(8, bytes.byteLength));
  if (b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46) return "pdf"; // %PDF
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "png"; // \x89PNG
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "jpeg";
  return "unknown";
}

/** Embed a single fetched file into the merged PDF doc. */
async function appendFileToPdf(
  doc: PDFDocument,
  bytes: ArrayBuffer,
  contentType: string
): Promise<{ ok: boolean; reason?: string }> {
  // Trust magic bytes over content-type header (Drive sometimes lies)
  const sniffed = sniffType(bytes);
  const ct = contentType.toLowerCase();
  const kind = sniffed !== "unknown" ? sniffed
    : ct.includes("pdf") ? "pdf"
    : ct.includes("png") ? "png"
    : ct.includes("jpeg") || ct.includes("jpg") ? "jpeg"
    : "unknown";

  if (kind === "unknown") {
    return { ok: false, reason: `unknown content (ct=${contentType}, ${bytes.byteLength}b)` };
  }

  try {
    if (kind === "pdf") {
      const donor = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const pages = await doc.copyPagesFrom(donor, donor.getPageIndices());
      pages.forEach((p) => doc.addPage(p));
      return { ok: true };
    }
    if (kind === "png") {
      const img = await doc.embedPng(bytes);
      const { width, height } = img.scale(1);
      const page = doc.addPage([width, height]);
      page.drawImage(img, { x: 0, y: 0, width, height });
      return { ok: true };
    }
    if (kind === "jpeg") {
      const img = await doc.embedJpg(bytes);
      const { width, height } = img.scale(1);
      const page = doc.addPage([width, height]);
      page.drawImage(img, { x: 0, y: 0, width, height });
      return { ok: true };
    }
  } catch (err: any) {
    return { ok: false, reason: `embed ${kind} failed: ${err?.message ?? err}` };
  }
  return { ok: false, reason: "unreachable" };
}

/** Result of a merge: page count + per-file outcomes for diagnostics. */
export interface MergeResult {
  pdfBytes: Uint8Array;
  pageCount: number;
  attempted: number;
  succeeded: number;
  failures: { fileId: string; reason: string }[];
}

// ─── student guides (public PNGs, CORS: *) ───────────────────────────────────

/** Try to fetch a Drive file from the browser. Tries each known CORS-friendly
 *  endpoint until one returns recognisable bytes. */
async function fetchDriveFileBrowser(
  fileId: string
): Promise<{ bytes: ArrayBuffer; contentType: string } | { error: string }> {
  const endpoints = [
    `${DRIVE_DOWNLOAD}?id=${fileId}`,
    `https://lh3.googleusercontent.com/d/${fileId}`,
    `https://drive.google.com/uc?export=download&id=${fileId}`,
  ];

  let lastErr = "no response";
  for (const url of endpoints) {
    try {
      const resp = await fetch(url, { redirect: "follow", mode: "cors" });
      if (!resp.ok) { lastErr = `HTTP ${resp.status} at ${url}`; continue; }
      const bytes = await resp.arrayBuffer();
      const ct = resp.headers.get("content-type") ?? "";
      const sniffed = sniffType(bytes);
      // If we recognise the bytes (PDF / PNG / JPEG), accept this response.
      if (sniffed !== "unknown") return { bytes, contentType: ct };
      lastErr = `unrecognised bytes from ${url} (ct=${ct}, ${bytes.byteLength}b)`;
    } catch (err: any) {
      lastErr = `fetch threw at ${url}: ${err?.message ?? err}`;
    }
  }
  return { error: lastErr };
}

export async function mergeStudentGuides(urls: string[]): Promise<MergeResult> {
  return mergePublicGuides(urls);
}

// ─── teacher guides (public "Anyone with the link" Drive files) ──────────────
// Same approach as student guides — files must be shared as
// "Anyone with the link can view" for the browser fetch to succeed.

export async function mergeTeacherGuides(urls: string[]): Promise<MergeResult> {
  return mergePublicGuides(urls);
}

// ─── shared merge for any publicly-accessible Drive files ────────────────────

async function mergePublicGuides(urls: string[]): Promise<MergeResult> {
  const doc = await PDFDocument.create();
  const seen = new Set<string>();
  const failures: { fileId: string; reason: string }[] = [];
  let attempted = 0;
  let succeeded = 0;

  for (const url of urls) {
    if (seen.has(url)) continue;
    seen.add(url);
    const fileId = extractFileId(url);
    if (!fileId) { failures.push({ fileId: url, reason: "no fileId in url" }); continue; }
    attempted++;

    const result = await fetchDriveFileBrowser(fileId);
    if ("error" in result) {
      failures.push({ fileId, reason: result.error });
      console.warn("guideMerger:", fileId, "→", result.error);
      continue;
    }

    const append = await appendFileToPdf(doc, result.bytes, result.contentType);
    if (append.ok) {
      succeeded++;
    } else {
      failures.push({ fileId, reason: append.reason ?? "append failed" });
      console.warn("guideMerger:", fileId, "→", append.reason);
    }
  }

  const pdfBytes = await doc.save();
  return { pdfBytes, pageCount: doc.getPageCount(), attempted, succeeded, failures };
}
