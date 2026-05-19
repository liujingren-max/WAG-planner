/**
 * Build the "Export Plan" PDF directly with pdf-lib.
 *
 * Produces an A4-landscape PDF (842 × 595 pt) with a title + subtitle row
 * and a flex-wrap grid of session columns.  Bypasses the browser print
 * dialog entirely, so orientation and layout are identical in every
 * browser (including Safari, which doesn't honour @page reliably).
 */
import {
  PDFDocument,
  PDFFont,
  PDFPage,
  StandardFonts,
  rgb,
} from "pdf-lib";
import { LessonPlan, SessionColumn } from "@/state/planTypes";

// ─── page geometry (A4 landscape, in points) ─────────────────────────────────
const PAGE_W = 842;
const PAGE_H = 595;
const MARGIN = 36;

// ─── typography ──────────────────────────────────────────────────────────────
const TITLE_SIZE = 18;
const SUBTITLE_SIZE = 10;
const SESSION_HEADER_SIZE = 11;
const ACTIVITY_SIZE = 9;
const TOTAL_SIZE = 9;

// ─── column grid ─────────────────────────────────────────────────────────────
const COL_GAP = 10;
const ROW_GAP = 12;
const PADDING = 10;
const MIN_COL_WIDTH = 160;

// ─── colours ─────────────────────────────────────────────────────────────────
const TEXT = rgb(0.29, 0.29, 0.29); // #4a4a4a
const MUTED = rgb(0.44, 0.44, 0.44); // #707070
const BORDER = rgb(0.8, 0.8, 0.8); // #ccc

// ─── helpers ─────────────────────────────────────────────────────────────────

/** Greedy word-wrap that respects the font's actual measured width. */
function wrapText(
  text: string,
  font: PDFFont,
  size: number,
  maxWidth: number
): string[] {
  if (font.widthOfTextAtSize(text, size) <= maxWidth) return [text];
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) <= maxWidth) {
      current = next;
    } else {
      if (current) lines.push(current);
      // If the single word is itself wider than maxWidth, just place it
      // on its own line — pdf-lib will draw it slightly past the bound.
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/** Strip characters Helvetica's WinAnsi encoding can't render (em-dash, smart quotes, etc.). */
function sanitise(s: string): string {
  return s
    .replace(/[‐-―]/g, "-") // unicode dashes → ASCII hyphen
    .replace(/[‘’]/g, "'") // smart single quotes
    .replace(/[“”]/g, '"') // smart double quotes
    .replace(/…/g, "...") // ellipsis
    .replace(/ /g, " "); // nbsp
}

/** Pre-compute the height a session column will occupy (so rows can wrap cleanly). */
function measureSessionHeight(
  session: SessionColumn,
  font: PDFFont,
  colWidth: number
): number {
  const innerWidth = colWidth - PADDING * 2;
  const titleColumnWidth = innerWidth - 36; // reserve space for "X min" right-aligned
  let h = PADDING; // top padding
  h += SESSION_HEADER_SIZE + 6; // session name + gap
  h += 1 + 4; // separator + gap
  for (const a of session.activities) {
    const lines = wrapText(sanitise(a.title), font, ACTIVITY_SIZE, titleColumnWidth);
    h += Math.max(1, lines.length) * (ACTIVITY_SIZE + 3);
    h += 2; // inter-row gap
  }
  h += 4; // gap above bottom separator
  h += 1 + 4; // separator + gap
  h += TOTAL_SIZE + PADDING; // total + bottom padding
  return h;
}

/** Render one session column starting at (x, topY). */
function drawSession(
  page: PDFPage,
  session: SessionColumn,
  x: number,
  topY: number,
  colWidth: number,
  font: PDFFont,
  fontBold: PDFFont
) {
  const innerLeft = x + PADDING;
  const innerRight = x + colWidth - PADDING;
  const titleColumnWidth = colWidth - PADDING * 2 - 36;
  let y = topY - PADDING;

  // Session name
  y -= SESSION_HEADER_SIZE;
  page.drawText(sanitise(session.name), {
    x: innerLeft,
    y,
    size: SESSION_HEADER_SIZE,
    font: fontBold,
    color: TEXT,
  });
  y -= 6;

  // Separator under header
  page.drawLine({
    start: { x: innerLeft, y },
    end: { x: innerRight, y },
    thickness: 0.5,
    color: BORDER,
  });
  y -= 4;

  // Activities
  for (const a of session.activities) {
    const lines = wrapText(sanitise(a.title), font, ACTIVITY_SIZE, titleColumnWidth);
    const timeText = `${a.minutes} min`;
    const timeWidth = fontBold.widthOfTextAtSize(timeText, ACTIVITY_SIZE);

    for (let i = 0; i < lines.length; i++) {
      y -= ACTIVITY_SIZE;
      page.drawText(lines[i], {
        x: innerLeft,
        y,
        size: ACTIVITY_SIZE,
        font,
        color: TEXT,
      });
      if (i === 0) {
        // Right-align "X min" on the first line of the activity title
        page.drawText(timeText, {
          x: innerRight - timeWidth,
          y,
          size: ACTIVITY_SIZE,
          font: fontBold,
          color: MUTED,
        });
      }
      y -= 3;
    }
    y -= 2;
  }

  // Separator above total
  y -= 2;
  page.drawLine({
    start: { x: innerLeft, y },
    end: { x: innerRight, y },
    thickness: 0.5,
    color: BORDER,
  });
  y -= 4;

  // Total
  y -= TOTAL_SIZE;
  const used = session.activities.reduce((sum, a) => sum + a.minutes, 0);
  const totalText = `Total: ${used} / ${session.availableMinutes} min`;
  page.drawText(totalText, {
    x: innerLeft,
    y,
    size: TOTAL_SIZE,
    font: fontBold,
    color: TEXT,
  });
}

// ─── entry point ─────────────────────────────────────────────────────────────

export async function buildPlanPdf(plan: LessonPlan): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  const title = sanitise(plan.readLessonName || plan.title);
  const subtitle = sanitise(plan.title);

  // Decide grid dimensions
  const contentWidth = PAGE_W - MARGIN * 2;
  const sessions = plan.sessions;
  const maxColsByWidth = Math.max(
    1,
    Math.floor((contentWidth + COL_GAP) / (MIN_COL_WIDTH + COL_GAP))
  );
  const colsPerRow = Math.min(maxColsByWidth, sessions.length);
  const colWidth =
    (contentWidth - COL_GAP * (colsPerRow - 1)) / colsPerRow;

  // Pre-measure each session column
  const heights = sessions.map((s) => measureSessionHeight(s, font, colWidth));

  // Group sessions into rows
  const rows: { items: SessionColumn[]; heights: number[] }[] = [];
  for (let i = 0; i < sessions.length; i += colsPerRow) {
    rows.push({
      items: sessions.slice(i, i + colsPerRow),
      heights: heights.slice(i, i + colsPerRow),
    });
  }

  // Open first page + draw header
  let page = doc.addPage([PAGE_W, PAGE_H]);
  page.drawText(title, {
    x: MARGIN,
    y: PAGE_H - MARGIN - TITLE_SIZE,
    size: TITLE_SIZE,
    font: fontBold,
    color: TEXT,
  });
  page.drawText(subtitle, {
    x: MARGIN,
    y: PAGE_H - MARGIN - TITLE_SIZE - SUBTITLE_SIZE - 2,
    size: SUBTITLE_SIZE,
    font,
    color: MUTED,
  });
  let cursorY = PAGE_H - MARGIN - TITLE_SIZE - SUBTITLE_SIZE - 16;

  // Lay out rows, paginating when a row won't fit
  for (const row of rows) {
    const rowHeight = Math.max(...row.heights);

    if (cursorY - rowHeight < MARGIN) {
      page = doc.addPage([PAGE_W, PAGE_H]);
      cursorY = PAGE_H - MARGIN;
    }

    row.items.forEach((session, idx) => {
      const colX = MARGIN + idx * (colWidth + COL_GAP);
      const colHeight = row.heights[idx];

      // Column outline
      page.drawRectangle({
        x: colX,
        y: cursorY - colHeight,
        width: colWidth,
        height: colHeight,
        borderColor: BORDER,
        borderWidth: 0.5,
      });

      drawSession(page, session, colX, cursorY, colWidth, font, fontBold);
    });

    cursorY -= rowHeight + ROW_GAP;
  }

  return doc.save();
}
