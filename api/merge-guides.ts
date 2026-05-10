import { PDFDocument } from "pdf-lib";

// Vercel serverless function
// POST /api/merge-guides
// Body: { fileIds: string[], label?: string }
// Response: application/pdf (merged PDF bytes)

export const config = { maxDuration: 30 };

export default async function handler(
  req: {
    method: string;
    body: { fileIds?: string[]; label?: string };
  },
  res: {
    status: (code: number) => typeof res;
    json: (body: unknown) => void;
    setHeader: (name: string, value: string) => void;
    send: (body: Buffer) => void;
  }
) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { fileIds, label = "guides" } = req.body ?? {};

  if (!Array.isArray(fileIds) || fileIds.length === 0) {
    res.status(400).json({ error: "fileIds array required" });
    return;
  }

  const merged = await PDFDocument.create();
  let mergedCount = 0;

  for (const fileId of fileIds) {
    try {
      // Google Drive direct download URL (works for "Anyone with the link" files)
      const url = `https://drive.google.com/uc?export=download&id=${fileId}&confirm=t`;
      const response = await fetch(url, {
        redirect: "follow",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; ThinkCERCA-Planner/1.0)",
        },
      });

      if (!response.ok) {
        console.warn(`Drive fetch failed for ${fileId}: ${response.status}`);
        continue;
      }

      const contentType = response.headers.get("content-type") ?? "";
      if (!contentType.includes("pdf")) {
        console.warn(`Unexpected content-type for ${fileId}: ${contentType}`);
        continue;
      }

      const bytes = await response.arrayBuffer();
      const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const indices = pdf.getPageIndices();
      const pages = await merged.copyPagesFrom(pdf, indices);
      pages.forEach((page) => merged.addPage(page));
      mergedCount++;
    } catch (err) {
      console.error(`Failed to process fileId ${fileId}:`, err);
    }
  }

  if (mergedCount === 0) {
    res.status(502).json({
      error:
        "Could not fetch any guide PDFs. Files may require Google authentication.",
    });
    return;
  }

  const pdfBytes = await merged.save();
  const safeName = label.replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 80);

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${safeName}.pdf"`
  );
  res.setHeader("Cache-Control", "no-store");
  res.send(Buffer.from(pdfBytes));
}
