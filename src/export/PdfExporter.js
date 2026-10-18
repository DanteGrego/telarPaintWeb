/**
 * PdfExporter.js — Exports the pattern as a PDF using jsPDF
 *
 * Content:
 *  1. Title
 *  2. Pattern grid (colored squares with grid lines)
 *  3. Weaving instructions list
 *
 * jsPDF is loaded from CDN, pre-cached by the Service Worker.
 */

import { exportManager } from './ExportManager.js';
import { generateInstructions, formatInstruction } from '../instructions/InstructionGenerator.js';
import { CELL_A } from '../store/AppState.js';

const JSPDF_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';

let _jsPdfLoaded = false;

async function ensureJsPdf() {
  if (_jsPdfLoaded || window.jspdf) { _jsPdfLoaded = true; return; }
  await new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = JSPDF_CDN;
    s.onload = () => { _jsPdfLoaded = true; resolve(); };
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

// Parse hex color to [r, g, b]
function hexToRgb(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

exportManager.register('pdf', {
  label: 'Exportar PDF',

  async export(stateRef) {
    await ensureJsPdf();
    const { jsPDF } = window.jspdf;

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    const PAGE_W = 210;
    const PAGE_H = 297;
    const MARGIN = 14;
    const CONTENT_W = PAGE_W - MARGIN * 2;

    // ── Colors ──────────────────────────────────────────────
    const rgbA = hexToRgb(stateRef.colorA);
    const rgbB = hexToRgb(stateRef.colorB);

    // ── Title ────────────────────────────────────────────────
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(30, 30, 30);
    doc.text(stateRef.title || 'Patrón de Tejido', MARGIN, MARGIN + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(
      `${stateRef.cols} columnas × ${stateRef.rows} filas`,
      MARGIN,
      MARGIN + 12
    );

    // Color legend
    const legendY = MARGIN + 16;
    doc.setFillColor(...rgbA);
    doc.rect(MARGIN, legendY, 6, 4, 'F');
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(8);
    doc.text('Hilo A (arriba)', MARGIN + 8, legendY + 3.2);

    doc.setFillColor(...rgbB);
    doc.rect(MARGIN + 55, legendY, 6, 4, 'F');
    doc.text('Hilo B (abajo)', MARGIN + 63, legendY + 3.2);

    // ── Grid ─────────────────────────────────────────────────
    const gridStartY = legendY + 8;
    const { cols, rows, grid } = stateRef;

    // Fit grid into content width; cap cell size
    const rawCellPx = CONTENT_W / cols;
    const CELL = Math.min(rawCellPx, 6); // max 6mm per cell
    const gridW = CELL * cols;
    const gridH = CELL * rows;

    // Center grid horizontally
    const gridOffsetX = MARGIN + (CONTENT_W - gridW) / 2;

    // Check if we need a new page for instructions (after drawing the grid)
    const maxGridH = PAGE_H - gridStartY - MARGIN - 40; // leave room for instructions header
    const drawableRows = Math.min(rows, Math.floor(maxGridH / CELL));
    const clipped = drawableRows < rows;

    for (let r = 0; r < drawableRows; r++) {
      for (let c = 0; c < cols; c++) {
        const v = grid[r * cols + c];
        doc.setFillColor(...(v === CELL_A ? rgbA : rgbB));
        doc.rect(gridOffsetX + c * CELL, gridStartY + r * CELL, CELL, CELL, 'F');
      }
    }

    // Grid lines
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.1);
    for (let r = 0; r <= drawableRows; r++) {
      doc.line(gridOffsetX, gridStartY + r * CELL, gridOffsetX + gridW, gridStartY + r * CELL);
    }
    for (let c = 0; c <= cols; c++) {
      doc.line(gridOffsetX + c * CELL, gridStartY, gridOffsetX + c * CELL, gridStartY + drawableRows * CELL);
    }

    if (clipped) {
      doc.setFontSize(7);
      doc.setTextColor(140, 140, 140);
      doc.text(
        `(Patrón recortado — mostrando ${drawableRows} de ${rows} filas)`,
        gridOffsetX,
        gridStartY + drawableRows * CELL + 3
      );
    }

    // ── Instructions ─────────────────────────────────────────
    const instrStartY = gridStartY + drawableRows * CELL + (clipped ? 8 : 6);
    const instructions = generateInstructions();

    let curY = instrStartY;

    // If instructions won't fit start a new page
    if (curY + 20 > PAGE_H - MARGIN) {
      doc.addPage();
      curY = MARGIN;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(30, 30, 30);
    doc.text('Instrucciones de Tejido', MARGIN, curY);
    curY += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);

    for (const instr of instructions) {
      if (curY > PAGE_H - MARGIN - 6) {
        doc.addPage();
        curY = MARGIN;
      }

      const text = formatInstruction(instr);
      const bgColor = instr.repeated ? [240, 237, 255] : [248, 248, 248];
      const lineH = 5.5;

      doc.setFillColor(...bgColor);
      doc.roundedRect(MARGIN, curY - 3.5, CONTENT_W, lineH, 1, 1, 'F');

      if (instr.repeated) {
        doc.setTextColor(100, 80, 200);
      } else {
        doc.setTextColor(30, 30, 30);
      }

      doc.text(text, MARGIN + 3, curY + 0.5);
      curY += lineH + 1;
    }

    // ── Footer ────────────────────────────────────────────────
    const pageCount = doc.internal.getNumberOfPages();
    for (let p = 1; p <= pageCount; p++) {
      doc.setPage(p);
      doc.setFontSize(7);
      doc.setTextColor(160, 160, 160);
      doc.text(
        `TelarPaint — Pág. ${p}/${pageCount}`,
        PAGE_W / 2,
        PAGE_H - 6,
        { align: 'center' }
      );
    }

    // ── Save ──────────────────────────────────────────────────
    const filename = (stateRef.title || 'patron').replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '') || 'patron';
    doc.save(`${filename}.pdf`);
  },
});

