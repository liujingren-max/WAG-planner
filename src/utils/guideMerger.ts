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

/** Embed a single fetched file into the merged PDF doc. */
async function appendFileToPdf(
  doc: PDFDocument,
  bytes: ArrayBuffer,
  contentType: string
): Promise<boolean> {
  try {
    const ct = contentType.toLowerCase();
    if (ct.includes("pdf")) {
      const donor = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const pages = await doc.copyPagesFrom(donor, donor.getPageIndices());
      pages.forEach((p) => doc.addPage(p));
      return true;
    }
    if (ct.includes("png")) {
      const img = await doc.embedPng(bytes);
      const { width, height } = img.scale(1);
      const page = doc.addPage([width, height]);
      page.drawImage(img, { x: 0, y: 0, width, height });
      return true;
    }
    if (ct.includes("jpeg") || ct.includes("jpg")) {
      const img = await doc.embedJpg(bytes);
      const { width, height } = img.scale(1);
      const page = doc.addPage([width, height]);
      page.drawImage(img, { x: 0, y: 0, width, height });
      return true;
    }
    console.warn("guideMerger: unsupported content-type", contentType);
  } catch (err) {
    console.error("guideMerger: failed to append file", err);
  }
  return false;
}

// ─── student guides (public PNGs, CORS: *) ───────────────────────────────────

export async function mergeStudentGuides(urls: string[]): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const seen = new Set<string>();

  for (const url of urls) {
    if (seen.has(url)) continue;
    seen.add(url);
    const fileId = extractFileId(url);
    if (!fileId) continue;

    try {
      const resp = await fetch(`${DRIVE_DOWNLOAD}?id=${fileId}`);
      if (!resp.ok) { console.warn("guideMerger: fetch failed", fileId, resp.status); continue; }
      const bytes = await resp.arrayBuffer();
      const ct = resp.headers.get("content-type") ?? "";
      await appendFileToPdf(doc, bytes, ct);
    } catch (err) {
      console.error("guideMerger: error fetching student guide", fileId, err);
    }
  }

  return doc.save();
}

// ─── teacher guides (auth required – Drive API + OAuth) ──────────────────────

/** Cached token (valid for ~1 hour within the same browser session). */
let cachedToken: string | null = null;

/** Request a Google OAuth access token with drive.readonly scope via GIS. */
function getGoogleToken(): Promise<string> {
  if (cachedToken) return Promise.resolve(cachedToken);

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
  if (!clientId) {
    return Promise.reject(
      new Error(
        "VITE_GOOGLE_CLIENT_ID is not set. Add it to your .env file and redeploy."
      )
    );
  }

  return new Promise<string>((resolve, reject) => {
    const gis = (window as any).google?.accounts?.oauth2;
    if (!gis) {
      reject(new Error("Google Identity Services script not loaded."));
      return;
    }

    const client = gis.initTokenClient({
      client_id: clientId,
      scope: "https://www.googleapis.com/auth/drive.readonly",
      callback: (response: { access_token?: string; error?: string }) => {
        if (response.error || !response.access_token) {
          reject(new Error(response.error ?? "OAuth failed"));
        } else {
          cachedToken = response.access_token;
          // Expire the cache after 55 minutes (tokens last 60 min)
          setTimeout(() => { cachedToken = null; }, 55 * 60 * 1000);
          resolve(response.access_token);
        }
      },
    });

    // prompt: '' = silent if already consented, shows popup the first time
    client.requestAccessToken({ prompt: "" });
  });
}

export async function mergeTeacherGuides(urls: string[]): Promise<Uint8Array> {
  const token = await getGoogleToken();
  const doc = await PDFDocument.create();
  const seen = new Set<string>();

  for (const url of urls) {
    if (seen.has(url)) continue;
    seen.add(url);
    const fileId = extractFileId(url);
    if (!fileId) continue;

    try {
      const resp = await fetch(`${DRIVE_API}/${fileId}?alt=media`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!resp.ok) { console.warn("guideMerger: Drive API failed", fileId, resp.status); continue; }
      const bytes = await resp.arrayBuffer();
      const ct = resp.headers.get("content-type") ?? "";
      await appendFileToPdf(doc, bytes, ct);
    } catch (err) {
      console.error("guideMerger: error fetching teacher guide", fileId, err);
    }
  }

  return doc.save();
}
