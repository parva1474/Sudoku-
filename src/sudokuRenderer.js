// ==========================================
// src/sudokuRenderer.js
// Renderer استاندارد Sudoku 9×9
// نسخه اصلاح‌شده برای Telegram
// ==========================================

const SIZE = 9;

// قبلاً 70 بود → 630×630
// اکنون 60 → 540×540
const CELL_SIZE = 60;

const GRID_SIZE =
  SIZE * CELL_SIZE;


// ==========================================
// رنگ‌ها
// ==========================================

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


// ==========================================
// Escape XML
// ==========================================

function escapeXml(value) {

  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

}


// ==========================================
// پس‌زمینه خانه
// ==========================================

function getCellBackground(
  row,
  col,
  selectedCell,
  cell
) {

  // خانه انتخاب‌شده
  if (
    selectedCell &&
    selectedCell.r === row &&
    selectedCell.c === col
  ) {

    return COLORS.selected;
  }


  // خانه دارای خطا
  if (cell.isError) {

    return '#FFE4E4';
  }


  // الگوی 3×3
  const boxRow =
    Math.floor(row / 3);

  const boxCol =
    Math.floor(col / 3);


  return (
    (boxRow + boxCol) % 2 === 0
      ? COLORS.cellA
      : COLORS.cellB
  );

}


// ==========================================
// یادداشت‌های مدادی
// ==========================================

function renderNotes(
  cell,
  x,
  y
) {

  if (
    !Array.isArray(cell.notes) ||
    cell.notes.length === 0
  ) {

    return '';
  }


  let output = '';


  for (
    let number = 1;
    number <= 9;
    number++
  ) {

    if (
      !cell.notes.includes(number)
    ) {

      continue;
    }


    const index =
      number - 1;


    const noteRow =
      Math.floor(index / 3);


    const noteCol =
      index % 3;


    // متناسب با خانه 60×60
    const noteX =
      x + 10 + noteCol * 20;


    const noteY =
      y + 14 + noteRow * 19;


    output += `
      <text
        x="${noteX}"
        y="${noteY}"
        font-family="Arial, sans-serif"
        font-size="13"
        text-anchor="middle"
        dominant-baseline="middle"
        fill="${COLORS.notes}"
      >${number}</text>
    `;
  }


  return output;
}


// ==========================================
// یک خانه
// ==========================================

function renderCell(
  row,
  col,
  cell,
  selectedCell
) {

  const x =
    col * CELL_SIZE;


  const y =
    row * CELL_SIZE;


  const background =
    getCellBackground(
      row,
      col,
      selectedCell,
      cell
    );


  let output = `
    <rect
      x="${x}"
      y="${y}"
      width="${CELL_SIZE}"
      height="${CELL_SIZE}"
      fill="${background}"
    />
  `;


  // ========================================
  // کادر خانه انتخاب‌شده
  // ========================================

  if (
    selectedCell &&
    selectedCell.r === row &&
    selectedCell.c === col
  ) {

    output += `
      <rect
        x="${x + 2}"
        y="${y + 2}"
        width="${CELL_SIZE - 4}"
        height="${CELL_SIZE - 4}"
        rx="4"
        ry="4"
        fill="none"
        stroke="${COLORS.selectedBorder}"
        stroke-width="3"
      />
    `;
  }


  // ========================================
  // عدد
  // ========================================

  if (
    cell.value !== null &&
    cell.value !== undefined
  ) {

    let textColor =
      cell.given
        ? COLORS.given
        : COLORS.user;


    if (cell.isError) {

      textColor =
        COLORS.error;
    }


    output += `
      <text
        x="${x + CELL_SIZE / 2}"
        y="${y + CELL_SIZE / 2}"
        font-family="Arial, sans-serif"
        font-size="30"
        font-weight="${cell.given ? '700' : '500'}"
        text-anchor="middle"
        dominant-baseline="middle"
        fill="${textColor}"
      >${escapeXml(cell.value)}</text>
    `;


    // علامت خطا
    if (cell.isError) {

      output += `
        <circle
          cx="${x + CELL_SIZE - 9}"
          cy="${y + 9}"
          r="4"
          fill="${COLORS.error}"
        />
      `;
    }

  } else {

    // یادداشت‌ها
    output +=
      renderNotes(
        cell,
        x,
        y
      );
  }


  return output;
}


// ==========================================
// خطوط نازک
// ==========================================

function renderThinGrid() {

  let output = '';


  for (
    let i = 1;
    i < SIZE;
    i++
  ) {

    const position =
      i * CELL_SIZE;


    output += `
      <line
        x1="${position}"
        y1="0"
        x2="${position}"
        y2="${GRID_SIZE}"
        stroke="${COLORS.gridThin}"
        stroke-width="1"
      />

      <line
        x1="0"
        y1="${position}"
        x2="${GRID_SIZE}"
        y2="${position}"
        stroke="${COLORS.gridThin}"
        stroke-width="1"
      />
    `;
  }


  return output;
}


// ==========================================
// خطوط ضخیم بلوک‌های 3×3
// ==========================================

function renderBoxLines() {

  let output = '';


  const positions = [
    3 * CELL_SIZE,
    6 * CELL_SIZE
  ];


  for (
    const position of positions
  ) {

    // عمودی
    output += `
      <line
        x1="${position}"
        y1="0"
        x2="${position}"
        y2="${GRID_SIZE}"
        stroke="${COLORS.gridThick}"
        stroke-width="4"
      />
    `;


    // افقی
    output += `
      <line
        x1="0"
        y1="${position}"
        x2="${GRID_SIZE}"
        y2="${position}"
        stroke="${COLORS.gridThick}"
        stroke-width="4"
      />
    `;
  }


  return output;
}


// ==========================================
// قاب بیرونی
// ==========================================

function renderOuterBorder() {

  return `
    <rect
      x="2"
      y="2"
      width="${GRID_SIZE - 4}"
      height="${GRID_SIZE - 4}"
      fill="none"
      stroke="${COLORS.gridThick}"
      stroke-width="4"
    />
  `;
}


// ==========================================
// تابع اصلی
// ==========================================

export function renderSudokuSVG(
  gameState,
  selectedCell = null
) {

  // ========================================
  // بررسی ساختار
  // ========================================

  if (
    !gameState ||
    !Array.isArray(gameState.board) ||
    gameState.board.length !== 9
  ) {

    throw new Error(
      '❌ جدول Sudoku باید دقیقاً 9 ردیف داشته باشد.'
    );
  }


  for (
    let row = 0;
    row < 9;
    row++
  ) {

    if (
      !Array.isArray(
        gameState.board[row]
      ) ||
      gameState.board[row].length !== 9
    ) {

      throw new Error(
        `❌ ردیف ${row + 1} باید دقیقاً 9 خانه داشته باشد.`
      );
    }
  }


  // ========================================
  // ساخت 81 خانه
  // ========================================

  let cells = '';


  for (
    let row = 0;
    row < 9;
    row++
  ) {

    for (
      let col = 0;
      col < 9;
      col++
    ) {

      cells +=
        renderCell(
          row,
          col,
          gameState.board[row][col],
          selectedCell
        );
    }
  }


  // ========================================
  // SVG نهایی
  // ========================================

  return `
<svg
  xmlns="http://www.w3.org/2000/svg"
  width="${GRID_SIZE}"
  height="${GRID_SIZE}"
  viewBox="0 0 ${GRID_SIZE} ${GRID_SIZE}"
>

  <rect
    x="0"
    y="0"
    width="${GRID_SIZE}"
    height="${GRID_SIZE}"
    fill="${COLORS.background}"
  />

  ${cells}

  ${renderThinGrid()}

  ${renderBoxLines()}

  ${renderOuterBorder()}

</svg>
`;
      }
