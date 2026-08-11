// ==========================================
// src/sudoku-image.js
// Sudoku Board Renderer
// Cloudflare Workers + resvg
// ==========================================

import {
  Resvg
} from "@cf-wasm/resvg/workerd";


// ==========================================
// تنظیمات تصویر
// ==========================================

const IMAGE_SIZE = 540;

const PADDING = 12;

const BOARD_SIZE =
  IMAGE_SIZE -
  (PADDING * 2);

const CELL_SIZE =
  BOARD_SIZE / 9;


// ==========================================
// تبدیل اعداد انگلیسی به فارسی
// ==========================================

function toPersianDigit(
  value
) {

  const digits = [
    "۰",
    "۱",
    "۲",
    "۳",
    "۴",
    "۵",
    "۶",
    "۷",
    "۸",
    "۹"
  ];

  return String(value).replace(
    /[0-9]/g,
    digit =>
      digits[
        Number(digit)
      ]
  );
}


// ==========================================
// Escape برای SVG
// ==========================================

function escapeXML(
  value
) {

  return String(value)
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&apos;"
    );
}


// ==========================================
// ساخت SVG جدول سودوکو
// ==========================================

function buildSudokuSVG(
  game
) {

  const svg = [];


  svg.push(
    `<svg
      xmlns="http://www.w3.org/2000/svg"
      width="${IMAGE_SIZE}"
      height="${IMAGE_SIZE}"
      viewBox="0 0 ${IMAGE_SIZE} ${IMAGE_SIZE}"
    >`
  );


  // ========================================
  // Background
  // ========================================

  svg.push(`
    <rect
      x="0"
      y="0"
      width="${IMAGE_SIZE}"
      height="${IMAGE_SIZE}"
      fill="#ffffff"
    />
  `);


  // ========================================
  // Cells
  // ========================================

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

      const index =
        row * 9 + col;


      const x =
        PADDING +
        col * CELL_SIZE;


      const y =
        PADDING +
        row * CELL_SIZE;


      // ====================================
      // خانه انتخاب‌شده
      // ====================================

      if (
        game.selectedCell === index
      ) {

        svg.push(`
          <rect
            x="${x}"
            y="${y}"
            width="${CELL_SIZE}"
            height="${CELL_SIZE}"
            fill="#dbeafe"
          />
        `);
      }


      // ====================================
      // مقدار خانه
      // ====================================

      const value =
        game.board[index];


      if (
        value !== null &&
        value !== undefined
      ) {

        const fixed =
          game.puzzle[index] !== null &&
          game.puzzle[index] !== undefined;


        const fontSize =
          Math.floor(
            CELL_SIZE * 0.52
          );


        const centerX =
          x +
          CELL_SIZE / 2;


        const centerY =
          y +
          CELL_SIZE / 2;


        svg.push(`
          <text
            x="${centerX}"
            y="${centerY}"
            text-anchor="middle"
            dominant-baseline="central"
            font-family="Arial, sans-serif"
            font-size="${fontSize}px"
            font-weight="700"
            fill="${
              fixed
                ? "#111827"
                : "#2563eb"
            }"
          >
            ${escapeXML(
              toPersianDigit(value)
            )}
          </text>
        `);

      } else {

        // ==================================
        // Pencil Notes
        // ==================================

        const notes =
          Array.isArray(
            game.notes?.[index]
          )
            ? game.notes[index]
            : [];


        if (
          notes.length
        ) {

          const noteSize =
            Math.floor(
              CELL_SIZE * 0.19
            );


          for (
            let n = 1;
            n <= 9;
            n++
          ) {

            if (
              !notes.includes(n)
            ) {

              continue;
            }


            const noteRow =
              Math.floor(
                (n - 1) / 3
              );


            const noteCol =
              (n - 1) % 3;


            const nx =
              x +
              CELL_SIZE *
              (
                0.20 +
                noteCol * 0.30
              );


            const ny =
              y +
              CELL_SIZE *
              (
                0.20 +
                noteRow * 0.30
              );


            svg.push(`
              <text
                x="${nx}"
                y="${ny}"
                text-anchor="middle"
                dominant-baseline="central"
                font-family="Arial, sans-serif"
                font-size="${noteSize}px"
                fill="#6b7280"
              >
                ${escapeXML(
                  toPersianDigit(n)
                )}
              </text>
            `);
          }
        }
      }
    }
  }


  // ========================================
  // خطوط نازک جدول
  // ========================================

  for (
    let i = 0;
    i <= 9;
    i++
  ) {

    const position =
      PADDING +
      i * CELL_SIZE;


    // عمودی

    svg.push(`
      <line
        x1="${position}"
        y1="${PADDING}"
        x2="${position}"
        y2="${IMAGE_SIZE - PADDING}"
        stroke="#9ca3af"
        stroke-width="1"
      />
    `);


    // افقی

    svg.push(`
      <line
        x1="${PADDING}"
        y1="${position}"
        x2="${IMAGE_SIZE - PADDING}"
        y2="${position}"
        stroke="#9ca3af"
        stroke-width="1"
      />
    `);
  }


  // ========================================
  // خطوط ضخیم بلوک‌های 3×3
  // ========================================

  for (
    let i = 0;
    i <= 9;
    i += 3
  ) {

    const position =
      PADDING +
      i * CELL_SIZE;


    // عمودی

    svg.push(`
      <line
        x1="${position}"
        y1="${PADDING}"
        x2="${position}"
        y2="${IMAGE_SIZE - PADDING}"
        stroke="#111827"
        stroke-width="3"
      />
    `);


    // افقی

    svg.push(`
      <line
        x1="${PADDING}"
        y1="${position}"
        x2="${IMAGE_SIZE - PADDING}"
        y2="${position}"
        stroke="#111827"
        stroke-width="3"
      />
    `);
  }


  // ========================================
  // پایان SVG
  // ========================================

  svg.push(
    "</svg>"
  );


  return svg.join("");
}


// ==========================================
// تبدیل SVG به PNG
// ==========================================

export async function renderSudokuPNG(
  game
) {

  const svg =
    buildSudokuSVG(
      game
    );


  const renderer =
    new Resvg(
      svg,
      {
        fitTo: {
          mode: "width",
          value: IMAGE_SIZE
        }
      }
    );


  return renderer
    .render()
    .asPng();
}
