// ==========================================
// src/sudokuRenderer.js
// نسخه پایدار و اصلاح‌شده برای رفع مشکل برش تصویر
// ==========================================

const SIZE = 9;
const CELL_SIZE = 60;
const GRID_SIZE = SIZE * CELL_SIZE; // 540

const COLORS = {
  background: '#FFFFFF',
  cellA: '#FFFFFF',
  cellB: '#F3F6FA',
  gridThin: '#B8C0CC',
  gridThick: '#20252B',
  selected: '#D9E9FF',
  selectedBorder: '#1976D2',
  given: '#20252B',
  user: '#1565C0',
  error: '#D32F2F',
  notes: '#68727D'
};

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function getCellBackground(row, col, selectedCell, cell) {
  if (selectedCell && selectedCell.r === row && selectedCell.c === col) return COLORS.selected;
  if (cell.isError) return '#FFE4E4';
  const boxRow = Math.floor(row / 3);
  const boxCol = Math.floor(col / 3);
  return (boxRow + boxCol) % 2 === 0 ? COLORS.cellA : COLORS.cellB;
}

function renderNotes(cell, x, y) {
  if (!Array.isArray(cell.notes) || cell.notes.length === 0) return '';
  let output = '';
  for (let number = 1; number <= 9; number++) {
    if (!cell.notes.includes(number)) continue;
    const index = number - 1;
    const noteRow = Math.floor(index / 3);
    const noteCol = index % 3;
    const noteX = x + 10 + noteCol * 20;
    const noteY = y + 14 + noteRow * 19;
    output += `<text x="${noteX}" y="${noteY}" font-family="Arial" font-size="13" text-anchor="middle" dominant-baseline="middle" fill="${COLORS.notes}">${number}</text>`;
  }
  return output;
}

function renderCell(row, col, cell, selectedCell) {
  const x = col * CELL_SIZE;
  const y = row * CELL_SIZE;
  const background = getCellBackground(row, col, selectedCell, cell);

  let output = `<rect x="${x}" y="${y}" width="${CELL_SIZE}" height="${CELL_SIZE}" fill="${background}" />`;

  if (selectedCell && selectedCell.r === row && selectedCell.c === col) {
    output += `<rect x="${x + 2}" y="${y + 2}" width="${CELL_SIZE - 4}" height="${CELL_SIZE - 4}" rx="4" ry="4" fill="none" stroke="${COLORS.selectedBorder}" stroke-width="3" />`;
  }

  if (cell.value !== null && cell.value !== undefined) {
    let textColor = cell.given ? COLORS.given : COLORS.user;
    if (cell.isError) textColor = COLORS.error;
    output += `<text x="${x + CELL_SIZE / 2}" y="${y + CELL_SIZE / 2}" font-family="Arial" font-size="30" font-weight="${cell.given ? '700' : '500'}" text-anchor="middle" dominant-baseline="middle" fill="${textColor}">${escapeXml(cell.value)}</text>`;
    if (cell.isError) output += `<circle cx="${x + CELL_SIZE - 9}" cy="${y + 9}" r="4" fill="${COLORS.error}" />`;
  } else {
    output += renderNotes(cell, x, y);
  }
  return output;
}

function renderThinGrid() {
  let output = '';
  for (let i = 1; i < SIZE; i++) {
    const pos = i * CELL_SIZE;
    output += `<line x1="${pos}" y1="0" x2="${pos}" y2="${GRID_SIZE}" stroke="${COLORS.gridThin}" stroke-width="1" />
               <line x1="0" y1="${pos}" x2="${GRID_SIZE}" y2="${pos}" stroke="${COLORS.gridThin}" stroke-width="1" />`;
  }
  return output;
}

function renderBoxLines() {
  let output = '';
  const pos = [3 * CELL_SIZE, 6 * CELL_SIZE];
  for (const p of pos) {
    output += `<line x1="${p}" y1="0" x2="${p}" y2="${GRID_SIZE}" stroke="${COLORS.gridThick}" stroke-width="4" />
               <line x1="0" y1="${p}" x2="${GRID_SIZE}" y2="${p}" stroke="${COLORS.gridThick}" stroke-width="4" />`;
  }
  return output;
}

function renderOuterBorder() {
  return `<rect x="0" y="0" width="${GRID_SIZE}" height="${GRID_SIZE}" fill="none" stroke="${COLORS.gridThick}" stroke-width="4" />`;
}

export function renderSudokuSVG(gameState, selectedCell = null) {
  let cells = '';
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      cells += renderCell(row, col, gameState.board[row][col], selectedCell);
    }
  }

  // مستقیماً ابعاد را ست می‌کنیم بدون viewBox تا در رندر مشکلی پیش نیاید
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${GRID_SIZE}" height="${GRID_SIZE}">
    <rect x="0" y="0" width="${GRID_SIZE}" height="${GRID_SIZE}" fill="${COLORS.background}" />
    ${cells}
    ${renderThinGrid()}
    ${renderBoxLines()}
    ${renderOuterBorder()}
</svg>`;
}
