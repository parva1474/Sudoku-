// ==========================================
// src/keyboard.js - نسخه نهایی با چیدمان بلوکی
// ==========================================

export function buildSudokuGridKeyboard(board, selectedCell = -1) {
  const keyboard = [];

  for (let blockRow = 0; blockRow < 3; blockRow++) {
    const rowButtons = [];

    for (let blockCol = 0; blockCol < 3; blockCol++) {
      // استفاده از کاراکترهای عددی و فاصله‌گذار برای حفظ چیدمان ۳در۳
      let display = "";
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          const idx = ((blockRow * 3 + r) * 9) + (blockCol * 3 + c);
          const val = board[idx] ? String(board[idx]) : "·";
          display += val + (c < 2 ? " " : ""); 
        }
        if (r < 2) display += "\n";
      }

      rowButtons.push({
        text: display,
        callback_data: `block:${blockRow}_${blockCol}`
      });
    }
    keyboard.push(rowButtons);
  }

  // دکمه‌های کنترلی پایین
  keyboard.push([
    { text: "✏️ مداد", callback_data: "mode:pencil" },
    { text: "🧹 پاک کردن", callback_data: "mode:erase" }
  ]);
  keyboard.push([
    { text: "💡 راهنمایی", callback_data: "action:hint" },
    { text: "🔄 جدید", callback_data: "action:new" }
  ]);

  return { inline_keyboard: keyboard };
}

export function buildNumberKeyboard(game) {
  return {
    inline_keyboard: [
      [
        { text: "1", callback_data: "num:1" },
        { text: "2", callback_data: "num:2" },
        { text: "3", callback_data: "num:3" }
      ],
      [
        { text: "4", callback_data: "num:4" },
        { text: "5", callback_data: "num:5" },
        { text: "6", callback_data: "num:6" }
      ],
      [
        { text: "7", callback_data: "num:7" },
        { text: "8", callback_data: "num:8" },
        { text: "9", callback_data: "num:9" }
      ],
      [
        { text: "🔙 بازگشت به جدول", callback_data: "action:grid" }
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
