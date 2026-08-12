// ==========================================
// src/keyboard.js - کیبردهای رنگی بلوک‌های ۳در۳
// ==========================================

const BOX_COLORS = ["🟥", "🟧", "🟨", "🟩", "🟦", "🟪", "🟥", "🟧", "🟨"];
const BOX_NAMES = ["بالا-چپ", "بالا-وسط", "بالا-راست", "وسط-چپ", "مرکز", "وسط-راست", "پایین-چپ", "پایین-وسط", "پایین-راست"];

export function buildSudokuGridKeyboard(board) {
  const keyboard = [
    [
      { text: "🟥 بلوک ۱", callback_data: "box:0" },
      { text: "🟧 بلوک ۲", callback_data: "box:1" },
      { text: "🟨 بلوک ۳", callback_data: "box:2" }
    ],
    [
      { text: "🟩 بلوک ۴", callback_data: "box:3" },
      { text: "🟦 بلوک ۵", callback_data: "box:4" },
      { text: "🟪 بلوک ۶", callback_data: "box:5" }
    ],
    [
      { text: "🟥 بلوک ۷", callback_data: "box:6" },
      { text: "🟧 بلوک ۸", callback_data: "box:7" },
      { text: "🟨 بلوک ۹", callback_data: "box:8" }
    ],
    [
      { text: "🔄 بازی جدید", callback_data: "action:new" }
    ]
  ];

  return { inline_keyboard: keyboard };
}

export function buildBoxCellsKeyboard(board, boxIndex) {
  const keyboard = [];
  const startRow = Math.floor(boxIndex / 3) * 3;
  const startCol = (boxIndex % 3) * 3;
  const colorIcon = BOX_COLORS[boxIndex];

  let rowButtons = [];
  
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const globalRow = startRow + r;
      const globalCol = startCol + c;
      const idx = globalRow * 9 + globalCol;
      const val = board[idx];
      
      const cellNumInBox = r * 3 + c + 1;
      const btnText = val ? `✅ ${val}` : `${colorIcon} خانه ${cellNumInBox}`;
      
      rowButtons.push({
        text: btnText,
        callback_data: `cell:${boxIndex}:${idx}`
      });
    }
    keyboard.push(rowButtons);
    rowButtons = [];
  }

  keyboard.push([
    { text: `🔙 بازگشت (${colorIcon} بلوک‌ها)`, callback_data: "action:grid" }
  ]);

  return { inline_keyboard: keyboard };
}

export function buildNumberKeyboard(boxIndex, cellIndex) {
  const colorIcon = BOX_COLORS[boxIndex];
  return {
    inline_keyboard: [
      [
        { text: "1️⃣", callback_data: `num:${cellIndex}:1` },
        { text: "2️⃣", callback_data: `num:${cellIndex}:2` },
        { text: "3️⃣", callback_data: `num:${cellIndex}:3` }
      ],
      [
        { text: "4️⃣", callback_data: `num:${cellIndex}:4` },
        { text: "5️⃣", callback_data: `num:${cellIndex}:5` },
        { text: "6️⃣", callback_data: `num:${cellIndex}:6` }
      ],
      [
        { text: "7️⃣", callback_data: `num:${cellIndex}:7` },
        { text: "8️⃣", callback_data: `num:${cellIndex}:8` },
        { text: "9️⃣", callback_data: `num:${cellIndex}:9` }
      ],
      [
        { text: "❌ پاک کردن", callback_data: `num:${cellIndex}:0` },
        { text: `🔙 بازگشت ${colorIcon}`, callback_data: `box:${boxIndex}` }
      ]
    ]
  };
}

export function buildDifficultyKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: "🟢 آسان", callback_data: "difficulty:easy" },
        { text: "🟡 متوسط", callback_data: "difficulty:medium" },
        { text: "🔴 سخت", callback_data: "difficulty:hard" }
      ]
    ]
  };
}

export function buildFinishedKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: "🏆 بازی تمام شد - شروع مجدد", callback_data: "action:new" }
      ]
    ]
  };
}
