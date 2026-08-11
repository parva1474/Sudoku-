// ==========================================
// src/keyboard.js
// Telegram Inline Keyboard - Sudoku
// Maximum 3 buttons per row
// ==========================================

export function buildBlockKeyboard(game = null) {

  return {
    inline_keyboard: [

      [
        {
          text: "1️⃣",
          callback_data: "block:0"
        },
        {
          text: "2️⃣",
          callback_data: "block:1"
        },
        {
          text: "3️⃣",
          callback_data: "block:2"
        }
      ],

      [
        {
          text: "4️⃣",
          callback_data: "block:3"
        },
        {
          text: "5️⃣",
          callback_data: "block:4"
        },
        {
          text: "6️⃣",
          callback_data: "block:5"
        }
      ],

      [
        {
          text: "7️⃣",
          callback_data: "block:6"
        },
        {
          text: "8️⃣",
          callback_data: "block:7"
        },
        {
          text: "9️⃣",
          callback_data: "block:8"
        }
      ],

      [
        {
          text: "💡 راهنمایی",
          callback_data: "action:hint"
        },
        {
          text: "🔄 بازی جدید",
          callback_data: "action:new"
        }
      ]

    ]
  };
}


export function buildCellKeyboard(
  block,
  game = null
) {

  block = Number(block);

  if (
    !Number.isInteger(block) ||
    block < 0 ||
    block > 8
  ) {
    return buildBlockKeyboard(game);
  }

  const blockRow =
    Math.floor(block / 3);

  const blockCol =
    block % 3;

  const keyboard = [];

  for (
    let localRow = 0;
    localRow < 3;
    localRow++
  ) {

    const row = [];

    for (
      let localCol = 0;
      localCol < 3;
      localCol++
    ) {

      const rowIndex =
        blockRow * 3 +
        localRow;

      const colIndex =
        blockCol * 3 +
        localCol;

      const index =
        rowIndex * 9 +
        colIndex;

      let text =
        `${rowIndex + 1}×${colIndex + 1}`;

      if (
        game &&
        game.selectedCell === index
      ) {
        text =
          `🔵 ${text}`;
      }

      if (
        game &&
        Array.isArray(game.puzzle) &&
        game.puzzle[index] !== null &&
        game.puzzle[index] !== undefined
      ) {
        text =
          `🔒 ${text}`;
      }

      row.push({
        text,
        callback_data:
          `cell:${index}`
      });
    }

    keyboard.push(row);
  }

  keyboard.push([
    {
      text: "⬅️ برگشت به بلوک‌ها",
      callback_data: "action:blocks"
    }
  ]);

  return {
    inline_keyboard:
      keyboard
  };
}


export function buildNumberKeyboard(
  game
) {

  return {
    inline_keyboard: [

      [
        {
          text: "1",
          callback_data: "num:1"
        },
        {
          text: "2",
          callback_data: "num:2"
        },
        {
          text: "3",
          callback_data: "num:3"
        }
      ],

      [
        {
          text: "4",
          callback_data: "num:4"
        },
        {
          text: "5",
          callback_data: "num:5"
        },
        {
          text: "6",
          callback_data: "num:6"
        }
      ],

      [
        {
          text: "7",
          callback_data: "num:7"
        },
        {
          text: "8",
          callback_data: "num:8"
        },
        {
          text: "9",
          callback_data: "num:9"
        }
      ],

      [
        {
          text:
            game && game.pencilMode
              ? "✏️ مداد روشن"
              : "✏️ مداد خاموش",

          callback_data:
            "mode:pencil"
        },

        {
          text: "🧹 پاک کردن",
          callback_data: "mode:erase"
        }
      ],

      [
        {
          text: "⬅️ برگشت به خانه‌ها",
          callback_data: "action:cells"
        }
      ]

    ]
  };
}


export function buildDifficultyKeyboard() {

  return {
    inline_keyboard: [

      [
        {
          text: "🟢 آسان",
          callback_data: "difficulty:easy"
        },
        {
          text: "🟡 متوسط",
          callback_data: "difficulty:medium"
        }
      ],

      [
        {
          text: "🔴 سخت",
          callback_data: "difficulty:hard"
        },
        {
          text: "🟣 خیلی سخت",
          callback_data: "difficulty:expert"
        }
      ],

      [
        {
          text: "⚫ استاد",
          callback_data: "difficulty:master"
        }
      ]

    ]
  };
}


export function buildFinishedKeyboard() {

  return {
    inline_keyboard: [

      [
        {
          text: "🔄 بازی جدید",
          callback_data: "action:new"
        }
      ]

    ]
  };
}


export function buildSudokuKeyboard(
  game
) {

  return buildBlockKeyboard(
    game
  );
            }
// ==========================================
// src/sudoku-image.js
// Sudoku Board Renderer
// Cloudflare Workers + resvg
// ==========================================

import {
  Resvg
} from "@cf-wasm/resvg/workerd";

const IMAGE_SIZE = 540;

const PADDING = 12;

const BOARD_SIZE =
  IMAGE_SIZE -
  (PADDING * 2);

const CELL_SIZE =
  BOARD_SIZE / 9;


// ==========================================
// اعداد فارسی
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
// Escape SVG
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
// ساخت SVG
// ==========================================

function buildSudokuSVG(
  game
) {

  const svg = [];

  svg.push(
    `<svg xmlns="http://www.w3.org/2000/svg"
      width="${IMAGE_SIZE}"
      height="${IMAGE_SIZE}"
      viewBox="0 0 ${IMAGE_SIZE} ${IMAGE_SIZE}">`
  );


  // ----------------------------------------
  // Background
  // ----------------------------------------

  svg.push(`
    <rect
      x="0"
      y="0"
      width="${IMAGE_SIZE}"
      height="${IMAGE_SIZE}"
      fill="#ffffff"
    />
  `);


  // ----------------------------------------
  // Cells
  // ----------------------------------------

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


      // --------------------------------------
      // Selected
      // --------------------------------------

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


      // --------------------------------------
      // Number
      // --------------------------------------

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

        // ------------------------------------
        // Pencil notes
        // ------------------------------------

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
  // Grid
  // ========================================

  for (
    let i = 0;
    i <= 9;
    i++
  ) {

    const position =
      PADDING +
      i * CELL_SIZE;

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
  // ضخیم 3×3
  // ========================================

  for (
    let i = 0;
    i <= 9;
    i += 3
  ) {

    const position =
      PADDING +
      i * CELL_SIZE;

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
