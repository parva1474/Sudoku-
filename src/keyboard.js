// ==========================================
// src/keyboard.js - کیبردهای انتخاب بلوک ۳در۳ و اعداد
// ==========================================

export function buildSudokuGridKeyboard(board) {
  // تقسیم صفحه به ۹ بلوک ۳در۳
  // بلوک‌ها از 0 تا 8 شماره‌گذاری می‌شوند:
  // 0 | 1 | 2
  // ---------
  // 3 | 4 | 5
  // ---------
  // 6 | 7 | 8
  
  const keyboard = [
    [
      { text: "📦 بلوک ۱ (بالا-چپ)", callback_data: "box:0" },
      { text: "📦 بلوک ۲ (بالا-وسط)", callback_data: "box:1" },
      { text: "📦 بلوک ۳ (بالا-راست)", callback_data: "box:2" }
    ],
    [
      { text: "📦 بلوک ۴ (وسط-چپ)", callback_data: "box:3" },
      { text: "📦 بلوک ۵ (مرکز)", callback_data: "box:4" },
      { text: "📦 بلوک ۶ (وسط-راست)", callback_data: "box:5" }
    ],
    [
      { text: "📦 بلوک ۷ (پایین-چپ)", callback_data: "box:6" },
      { text: "📦 بلوک ۸ (پایین-وسط)", callback_data: "box:7" },
      { text: "📦 بلوک ۹ (پایین-راست)", callback_data: "box:8" }
    ],
    [
      { text: "🔄 بازی جدید", callback_data: "action:new" }
    ]
  ];

  return { inline_keyboard: keyboard };
}

// ساخت کیبرد برای انتخاب خانه مشخص داخل بلوک انتخاب شده (خانه‌های 1 تا 9 داخل آن بلوک)
export function buildBoxCellsKeyboard(board, boxIndex) {
  const keyboard = [];
  const startRow = Math.floor(boxIndex / 3) * 3;
  const startCol = (boxIndex % 3) * 3;

  let rowButtons = [];
  
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const globalRow = startRow + r;
      const globalCol = startCol + c;
      const idx = globalRow * 9 + globalCol;
      const val = board[idx];
      
      // متن دکمه: اگر عدد دارد خود عدد، اگر خالی است علامت نقطه و شماره نسبی خانه (1 تا 9)
      const cellNumInBox = r * 3 + c + 1;
      const btnText = val ? `✅ ${val}` : `▫️ خانه ${cellNumInBox}`;
      
      rowButtons.push({
        text: btnText,
        callback_data: `cell:${boxIndex}:${idx}`
      });
    }
    keyboard.push(rowButtons);
    rowButtons = [];
  }

  // دکمه بازگشت به انتخاب بلوک‌ها
  keyboard.push([
    { text: "🔙 بازگشت به انتخاب بلوک‌ها", callback_data: "action:grid" }
  ]);

  return { inline_keyboard: keyboard };
}

export function buildNumberKeyboard(boxIndex, cellIndex) {
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
        { text: "❌ پاک کردن خانه", callback_data: `num:${cellIndex}:0` },
        { text: "🔙 بازگشت به بلوک", callback_data: `box:${boxIndex}` }
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
