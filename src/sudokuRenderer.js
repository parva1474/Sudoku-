// ==========================================
// sudokuRenderer.js
// رندر جدول سودوکو به صورت SVG
// ==========================================

const SIZE = 9;
const CELL_SIZE = 60;

const GRID_SIZE = SIZE * CELL_SIZE;


/**
 * تبدیل متن به XML-safe
 */
function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}


/**
 * رنگ پس‌زمینه خانه
 */
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
    return '#DDEBFF';
  }


  // خانه دارای خطا
  if (cell.isError) {
    return '#FFE0E0';
  }


  // باکس‌های 3×3
  const boxRow =
    Math.floor(row / 3);

  const boxCol =
    Math.floor(col / 3);


  // یکی در میان برای جدا شدن باکس‌ها
  if (
    (boxRow + boxCol) % 2 === 0
  ) {
    return '#FFFFFF';
  }


  return '#F5F7FA';
}


/**
 * رندر اعداد مدادی
 */
function renderNotes(
  cell,
  x,
  y
) {

  if (
    !cell.notes ||
    cell.notes.length === 0
  ) {
    return '';
  }


  let output = '';


  for (
    let index = 0;
    index < cell.notes.length;
    index++
  ) {

    const number =
      cell.notes[index];


    const noteRow =
      Math.floor(
        (number - 1) / 3
      );


    const noteCol =
      (number - 1) % 3;


    const noteX =
      x +
      10 +
      noteCol * 18;


    const noteY =
      y +
      16 +
      noteRow * 18;


    output += `
      <text
        x="${noteX}"
        y="${noteY}"
        font-size="12"
        font-family="Arial, sans-serif"
        text-anchor="middle"
        dominant-baseline="middle"
        fill="#777777"
      >
        ${number}
      </text>
    `;
  }


  return output;
}


/**
 * رندر یک خانه
 */
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
  // خانه انتخاب‌شده
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
        fill="none"
        stroke="#2979FF"
        stroke-width="3"
      />

    `;
  }


  // ========================================
  // اعداد مدادی
  // ========================================

  if (
    cell.value === null
  ) {

    output +=
      renderNotes(
        cell,
        x,
        y
      );
  }


  // ========================================
  // عدد اصلی
  // ========================================

  else {

    let textColor =
      cell.given
        ? '#222222'
        : '#1769AA';


    if (
      cell.isError
    ) {
      textColor =
        '#D32F2F';
    }


    output += `

      <text
        x="${x + CELL_SIZE / 2}"
        y="${y + CELL_SIZE / 2 + 2}"
        font-size="32"
        font-weight="${cell.given ? '700' : '500'}"
        font-family="Arial, sans-serif"
        text-anchor="middle"
        dominant-baseline="middle"
        fill="${textColor}"
      >
        ${escapeXml(cell.value)}
      </text>

    `;


    // علامت خطا
    if (
      cell.isError
    ) {

      output += `

        <circle
          cx="${x + CELL_SIZE - 10}"
          cy="${y + 10}"
          r="5"
          fill="#D32F2F"
        />

      `;
    }
  }


  return output;
}


/**
 * رسم خطوط جدول
 */
function renderGridLines() {

  let output = '';


  for (
    let i = 0;
    i <= SIZE;
    i++
  ) {

    const position =
      i * CELL_SIZE;


    const isBoxLine =
      i % 3 === 0;


    const strokeWidth =
      isBoxLine
        ? 4
        : 1;


    const stroke =
      isBoxLine
        ? '#222222'
        : '#999999';


    // خط عمودی
    output += `

      <line
        x1="${position}"
        y1="0"
        x2="${position}"
        y2="${GRID_SIZE}"
        stroke="${stroke}"
        stroke-width="${strokeWidth}"
      />

    `;


    // خط افقی
    output += `

      <line
        x1="0"
        y1="${position}"
        x2="${GRID_SIZE}"
        y2="${position}"
        stroke="${stroke}"
        stroke-width="${strokeWidth}"
      />

    `;
  }


  return output;
}


/**
 * تابع اصلی رندر سودوکو
 */
export function renderSudokuSVG(
  gameState,
  selectedCell = null
) {

  if (
    !gameState ||
    !gameState.board
  ) {
    throw new Error(
      'gameState معتبر نیست.'
    );
  }


  let cells = '';


  // ========================================
  // رندر 81 خانه
  // ========================================

  for (
    let row = 0;
    row < SIZE;
    row++
  ) {

    for (
      let col = 0;
      col < SIZE;
      col++
    ) {

      const cell =
        gameState.board[row][col];


      cells +=
        renderCell(
          row,
          col,
          cell,
          selectedCell
        );
    }
  }


  // ========================================
  // وضعیت بازی
  // ========================================

  let statusText =
    '🎮 در حال بازی';


  if (
    gameState.status ===
    'COMPLETED'
  ) {

    statusText =
      '🎉 سودوکو کامل شد!';
  }


  // ========================================
  // SVG نهایی
  // ========================================

  const svg = `

<svg
  xmlns="http://www.w3.org/2000/svg"
  width="${GRID_SIZE}"
  height="${GRID_SIZE + 45}"
  viewBox="0 0 ${GRID_SIZE} ${GRID_SIZE + 45}"
>

  <!-- پس‌زمینه -->

  <rect
    x="0"
    y="0"
    width="${GRID_SIZE}"
    height="${GRID_SIZE}"
    fill="#FFFFFF"
  />


  <!-- خانه‌ها -->

  ${cells}


  <!-- خطوط جدول -->

  ${renderGridLines()}


  <!-- وضعیت -->

  <text
    x="${GRID_SIZE / 2}"
    y="${GRID_SIZE + 27}"
    font-size="18"
    font-family="Arial, sans-serif"
    font-weight="600"
    text-anchor="middle"
    fill="#333333"
  >
    ${escapeXml(statusText)}
  </text>

</svg>

  `;


  return svg;
}
این مرحله چه چیزهایی را درست می‌کند؟
🔲 جدول دقیقاً ۹×۹
▦ خطوط ضخیم بین هر باکس ۳×۳
🔒 اعداد اولیه از اعداد بازیکن قابل تشخیص هستند
🔵 خانه انتخاب‌شده مشخص می‌شود
❌ عدد اشتباه قرمز می‌شود
✏️ اعداد مدادی داخل خانه نمایش داده می‌شوند
🎉 پایان بازی نمایش داده می‌شود
الان چهار فایل اصلی را داریم:
sudoku.js ✅
utils.js ✅
telegram.js ✅
index.js ✅
sudokuRenderer.js ✅
اما قبل از Deploy یک ایراد مهم در نسخه‌ای که دادم وجود دارد: در Telegram، ارسال SVG به‌عنوان data:image/svg+xml... در sendPhoto/editMessageMedia قابل اتکا نیست و ممکن است API آن را نپذیرد. همچنین برای Inline، تغییر article به photo به شکل فعلی باید با ساختار صحیح Telegram انجام شود.
پس فعلاً Deploy نکن. مرحله بعدی بهتر است telegram.js را یک بار دیگر اصلاح کنیم تا ارسال/ویرایش تصویر واقعاً با Telegram API سازگار باشد؛ بعد می‌رویم سراغ تست نهایی.
