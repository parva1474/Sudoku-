// ==========================================
// src/sudokuRenderer.js
// Sudoku Renderer - 9x9
// ==========================================

const SIZE = 9;
const CELL_SIZE = 70;

const GRID_SIZE =
  SIZE * CELL_SIZE;

const FOOTER_HEIGHT = 55;

const COLORS = {

  background: '#FFFFFF',

  cellA: '#FFFFFF',
  cellB: '#F3F6FA',

  gridThin: '#AEB7C2',

  gridThick: '#20252B',

  selected: '#D9E9FF',

  selectedBorder: '#1976D2',

  given: '#20252B',

  user: '#1565C0',

  error: '#D32F2F',

  notes: '#68727D',

  footer: '#30343B'
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

  // خانه انتخاب شده
  if (
    selectedCell &&
    selectedCell.r === row &&
    selectedCell.c === col
  ) {

    return COLORS.selected;
  }


  // خانه اشتباه
  if (cell.isError) {

    return '#FFE4E4';
  }


  // رنگ‌بندی بلوک‌های 3×3
  const boxRow =
    Math.floor(row / 3);

  const boxCol =
    Math.floor(col / 3);


  if (
    (boxRow + boxCol) % 2 === 0
  ) {

    return COLORS.cellA;
  }


  return COLORS.cellB;
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


    const noteX =
      x +
      12 +
      noteCol * 23;


    const noteY =
      y +
      16 +
      noteRow * 22;


    output += `

      <text
        x="${noteX}"
        y="${noteY}"
        font-family="Arial, sans-serif"
        font-size="15"
        font-weight="500"
        text-anchor="middle"
        dominant-baseline="middle"
        fill="${COLORS.notes}"
      >
        ${number}
      </text>

    `;
  }


  return output;
}


// ==========================================
// رندر یک خانه
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
  // کادر خانه انتخاب شده
  // ========================================

  if (
    selectedCell &&
    selectedCell.r === row &&
    selectedCell.c === col
  ) {

    output += `

      <rect
        x="${x + 3}"
        y="${y + 3}"
        width="${CELL_SIZE - 6}"
        height="${CELL_SIZE - 6}"
        rx="5"
        fill="none"
        stroke="${COLORS.selectedBorder}"
        stroke-width="4"
      />

    `;
  }


  // ========================================
  // عدد اصلی
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
        font-size="35"
        font-weight="${cell.given ? '700' : '500'}"
        text-anchor="middle"
        dominant-baseline="middle"
        fill="${textColor}"
      >
        ${escapeXml(cell.value)}
      </text>

    `;


    // نشانگر خطا
    if (cell.isError) {

      output += `

        <circle
          cx="${x + CELL_SIZE - 11}"
          cy="${y + 11}"
          r="5"
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
// خطوط نازک داخلی
// ==========================================

function renderThinGrid() {

  let output = '';


  // خطوط داخلی فقط
  // خطوط 3 و 6 را بعداً ضخیم می‌کنیم

  for (
    let i = 1;
    i < SIZE;
    i++
  ) {

    // خطوط ضخیم اینجا رسم نشوند
    if (
      i === 3 ||
      i === 6
    ) {

      continue;
    }


    const position =
      i * CELL_SIZE;


    // عمودی
    output += `

      <line
        x1="${position}"
        y1="0"
        x2="${position}"
        y2="${GRID_SIZE}"
        stroke="${COLORS.gridThin}"
        stroke-width="1.5"
      />

    `;


    // افقی
    output += `

      <line
        x1="0"
        y1="${position}"
        x2="${GRID_SIZE}"
        y2="${position}"
        stroke="${COLORS.gridThin}"
        stroke-width="1.5"
      />

    `;
  }


  return output;
}


// ==========================================
// خطوط ضخیم 3×3
// ==========================================

function renderBoxLines() {

  let output = '';


  // فقط مرزهای داخلی بلوک‌ها
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
        stroke-width="5"
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
        stroke-width="5"
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
      x="2.5"
      y="2.5"
      width="${GRID_SIZE - 5}"
      height="${GRID_SIZE - 5}"
      fill="none"
      stroke="${COLORS.gridThick}"
      stroke-width="5"
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

  // ----------------------------------------
  // بررسی ساختار جدول
  // ----------------------------------------

  if (
    !gameState ||
    !Array.isArray(gameState.board) ||
    gameState.board.length !== 9
  ) {

    throw new Error(
      'ساختار جدول باید دقیقاً 9 ردیف داشته باشد.'
    );
  }


  // ----------------------------------------
  // ساخت 81 خانه
  // ----------------------------------------

  let cells = '';


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
        `ردیف ${row + 1} باید دقیقاً 9 خانه داشته باشد.`
      );
    }


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


  // ----------------------------------------
  // وضعیت بازی
  // ----------------------------------------

  let statusText =
    '🎮 در حال بازی';


  if (
    gameState.status ===
    'COMPLETED'
  ) {

    statusText =
      '🎉 جدول کامل شد!';
  }


  if (
    gameState.status ===
    'GAME_OVER'
  ) {

    statusText =
      '❌ بازی تمام شد';
  }


  // ----------------------------------------
  // ارتفاع نهایی
  // ----------------------------------------

  const totalHeight =
    GRID_SIZE +
    FOOTER_HEIGHT;


  // ----------------------------------------
  // SVG
  // ----------------------------------------

  return `

<svg
  xmlns="http://www.w3.org/2000/svg"
  width="${GRID_SIZE}"
  height="${totalHeight}"
  viewBox="0 0 ${GRID_SIZE} ${totalHeight}"
>

  <!-- پس زمینه -->

  <rect
    x="0"
    y="0"
    width="${GRID_SIZE}"
    height="${totalHeight}"
    fill="${COLORS.background}"
  />


  <!-- 81 خانه -->

  ${cells}


  <!-- خطوط نازک -->

  ${renderThinGrid()}


  <!-- خطوط ضخیم بلوک‌های 3×3 -->

  ${renderBoxLines()}


  <!-- قاب بیرونی -->

  ${renderOuterBorder()}


  <!-- وضعیت -->

  <text
    x="${GRID_SIZE / 2}"
    y="${GRID_SIZE + 33}"
    font-family="Arial, sans-serif"
    font-size="20"
    font-weight="600"
    text-anchor="middle"
    dominant-baseline="middle"
    fill="${COLORS.footer}"
  >
    ${escapeXml(statusText)}
  </text>

</svg>

`;
}
