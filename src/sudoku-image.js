// ==========================================
// src/sudoku-image.js
// رندر جدول Sudoku به PNG
// Cloudflare Workers + Resvg
// ==========================================

import { Resvg } from "@cf-wasm/resvg/workerd";

// ==========================================
// تبدیل عدد به متن
// ==========================================

function cellValue(game, index) {
  const value = game.board[index];

  if (
    value !== null &&
    value !== undefined &&
    value !== 0
  ) {
    return String(value);
  }

  return "";
}

// ==========================================
// ساخت SVG جدول
// ==========================================

function buildSudokuSVG(game) {
  const size = 450;
  const cell = size / 9;

  const parts = [];

  // ----------------------------------------
  // پس‌زمینه
  // ----------------------------------------

  parts.push(`
    <rect
      x="0"
      y="0"
      width="${size}"
      height="${size}"
      rx="18"
      fill="#ffffff"
    />
  `);

  // ----------------------------------------
  // خانه‌ها
  // ----------------------------------------

  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const index =
        row * 9 + col;

      const x =
        col * cell;

      const y =
        row * cell;

      // خانه انتخاب‌شده
      if (
        game.selectedCell === index
      ) {
        parts.push(`
          <rect
            x="${x + 2}"
            y="${y + 2}"
            width="${cell - 4}"
            height="${cell - 4}"
            rx="8"
            fill="#dbeafe"
          />
        `);
      }

      // خانه اولیه
      else if (
        game.puzzle[index] !== null &&
        game.puzzle[index] !== undefined
      ) {
        parts.push(`
          <rect
            x="${x + 2}"
            y="${y + 2}"
            width="${cell - 4}"
            height="${cell - 4}"
            rx="8"
            fill="#f3f4f6"
          />
        `);
      }
    }
  }

  // ----------------------------------------
  // خطوط نازک
  // ----------------------------------------

  for (let i = 1; i < 9; i++) {
    const position =
      i * cell;

    parts.push(`
      <line
        x1="${position}"
        y1="0"
        x2="${position}"
        y2="${size}"
        stroke="#d1d5db"
        stroke-width="1"
      />

      <line
        x1="0"
        y1="${position}"
        x2="${size}"
        y2="${position}"
        stroke="#d1d5db"
        stroke-width="1"
      />
    `);
  }

  // ----------------------------------------
  // خطوط ضخیم بلوک‌های 3×3
  // ----------------------------------------

  for (let i = 0; i <= 9; i += 3) {
    const position =
      i * cell;

    parts.push(`
      <line
        x1="${position}"
        y1="0"
        x2="${position}"
        y2="${size}"
        stroke="#374151"
        stroke-width="3"
      />

      <line
        x1="0"
        y1="${position}"
        x2="${size}"
        y2="${position}"
        stroke="#374151"
        stroke-width="3"
      />
    `);
  }

  // ----------------------------------------
  // اعداد
  // ----------------------------------------

  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const index =
        row * 9 + col;

      const value =
        cellValue(game, index);

      if (!value) {
        continue;
      }

      const x =
        col * cell + cell / 2;

      const y =
        row * cell + cell / 2 + 12;

      const isGiven =
        game.puzzle[index] !== null &&
        game.puzzle[index] !== undefined;

      parts.push(`
        <text
          x="${x}"
          y="${y}"
          text-anchor="middle"
          font-family="Arial, sans-serif"
          font-size="30"
          font-weight="${isGiven ? "700" : "500"}"
          fill="${isGiven ? "#111827" : "#2563eb"}"
        >${value}</text>
      `);
    }
  }

  // ----------------------------------------
  // SVG
  // ----------------------------------------

  return `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="${size}"
      height="${size}"
      viewBox="0 0 ${size} ${size}"
    >
      ${parts.join("")}
    </svg>
  `;
}

// ==========================================
// تبدیل SVG به PNG
// ==========================================

export async function renderSudokuPNG(game) {
  const svg =
    buildSudokuSVG(game);

  const resvg =
    new Resvg(svg, {
      fitTo: {
        mode: "width",
        value: 900
      }
    });

  const rendered =
    resvg.render();

  const png =
    rendered.asPng();

  return png;
}
