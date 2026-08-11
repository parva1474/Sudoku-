// ==========================================
// src/sudoku-image.js
// Sudoku Image Renderer
// Cloudflare Workers + resvg
// ==========================================

import {
  Resvg
} from "@cf-wasm/resvg/workerd";


// ==========================================
// تنظیمات تصویر
// ==========================================

const CELL_SIZE = 80;
const GRID_SIZE = CELL_SIZE * 9;

const PADDING = 30;

const WIDTH =
  GRID_SIZE +
  PADDING * 2;

const HEIGHT =
  GRID_SIZE +
  PADDING * 2;


// ==========================================
// تبدیل مقدار به متن
// ==========================================

function cellValue(
  value
) {

  if (
    value === null ||
    value === undefined
  ) {

    return "";
  }


  return String(value);
}


// ==========================================
// Escape برای SVG
// ==========================================

function escapeXml(
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
// ساخت SVG جدول
// ==========================================

export function buildSudokuSvg(
  game
) {

  const board =
    Array.isArray(game?.board)
      ? game.board
      : Array(81).fill(null);


  const puzzle =
    Array.isArray(game?.puzzle)
      ? game.puzzle
      : Array(81).fill(null);


  const selectedCell =
    Number(
      game?.selectedCell ?? -1
    );


  const svg = [];


  svg.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">`
  );


  // ========================================
  // Background
  // ========================================

  svg.push(`
    <rect
      x="0"
      y="0"
      width="${WIDTH}"
      height="${HEIGHT}"
      rx="24"
      fill="#111827"
    />
  `);


  // ========================================
  // Grid Background
  // ========================================

  svg.push(`
    <rect
      x="${PADDING}"
      y="${PADDING}"
      width="${GRID_SIZE}"
      height="${GRID_SIZE}"
      rx="8"
      fill="#F9FAFB"
    />
  `);


  // ========================================
  // Selected Cell
  // ========================================

  if (
    Number.isInteger(selectedCell) &&
    selectedCell >= 0 &&
    selectedCell < 81
  ) {

    const row =
      Math.floor(
        selectedCell / 9
      );

    const col =
      selectedCell % 9;


    const x =
      PADDING +
      col * CELL_SIZE;

    const y =
      PADDING +
      row * CELL_SIZE;


    svg.push(`
      <rect
        x="${x}"
        y="${y}"
        width="${CELL_SIZE}"
        height="${CELL_SIZE}"
        fill="#DBEAFE"
      />
    `);
  }


  // ========================================
  // خانه‌ها
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
        row * 9 +
        col;


      const value =
        cellValue(
          board[index]
        );


      if (!value) {

        continue;
      }


      const x =
        PADDING +
        col * CELL_SIZE +
        CELL_SIZE / 2;


      const y =
        PADDING +
        row * CELL_SIZE +
        CELL_SIZE / 2;


      const fixed =
        puzzle[index] !== null &&
        puzzle[index] !== undefined;


      svg.push(`
        <text
          x="${x}"
          y="${y}"
          text-anchor="middle"
          dominant-baseline="central"
          font-family="Arial, sans-serif"
          font-size="34"
          font-weight="${fixed ? "700" : "500"}"
          fill="${fixed ? "#111827" : "#2563EB"}"
        >${escapeXml(value)}</text>
      `);
    }
  }


  // ========================================
  // خطوط جدول
  // ========================================

  for (
    let i = 0;
    i <= 9;
    i++
  ) {

    const position =
      PADDING +
      i * CELL_SIZE;


    const isMajor =
      i === 0 ||
      i === 3 ||
      i === 6 ||
      i === 9;


    const strokeWidth =
      isMajor
        ? 4
        : 1.5;


    // افقی

    svg.push(`
      <line
        x1="${PADDING}"
        y1="${position}"
        x2="${PADDING + GRID_SIZE}"
        y2="${position}"
        stroke="#111827"
        stroke-width="${strokeWidth}"
      />
    `);


    // عمودی

    svg.push(`
      <line
        x1="${position}"
        y1="${PADDING}"
        x2="${position}"
        y2="${PADDING + GRID_SIZE}"
        stroke="#111827"
        stroke-width="${strokeWidth}"
      />
    `);
  }


  svg.push(
    "</svg>"
  );


  return svg.join("");
}


// ==========================================
// SVG → PNG
// ==========================================

export async function renderSudokuPNG(
  game
) {

  const svg =
    buildSudokuSvg(
      game
    );


  const renderer =
    new Resvg(
      svg,
      {
        fitTo: {
          mode:
            "width",
          value:
            WIDTH
        }
      }
    );


  const pngData =
    renderer.render();


  return pngData.asPng();
}


// ==========================================
// ساخت Response برای ارسال مستقیم
// ==========================================

export async function sudokuImageResponse(
  game
) {

  const png =
    await renderSudokuPng(
      game
    );


  return new Response(
    png,
    {

      status: 200,

      headers: {

        "Content-Type":
          "image/png",

        "Cache-Control":
          "no-store"

      }

    }
  );
          }
