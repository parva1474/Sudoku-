// ==========================================
// src/keyboard.js - نسخه کامل کیبردها
// ==========================================

export function buildSudokuGridKeyboard(board, selectedCell = -1) {
  const keyboard = [];
  
  // دکمه‌های انتخاب سطر ۱ تا ۹
  keyboard.push([
    { text: "1️⃣ سطر ۱", callback_data: "row:0" },
    { text: "2️⃣ سطر ۲", callback_data: "row:1" },
    { text: "3️⃣ سطر ۳", callback_data: "row:2" }
  ]);
  keyboard.push([
    { text: "4️⃣ سطر ۴", callback_data: "row:3" },
    { text: "5️⃣ سطر ۵", callback_data: "row:4" },
    { text: "6️⃣ سطر ۶", callback_data: "row:5" }
  ]);
  keyboard.push([
    { text: "7️⃣ سطر ۷", callback_data: "row:6" },
    { text: "8️⃣ سطر ۸", callback_data: "row:7" },
    { text: "9️⃣ سطر ۹", callback_data: "row:8" }
  ]);

  keyboard.push([
    { text: "✏️ مداد", callback_data: "mode:pencil" },
    { text: "🧹 پاک کردن", callback_data: "mode:erase" }
  ]);
  
  keyboard.push([
    { text: "🔄 بازی جدید", callback_data: "action:new" }
  ]);

  return { inline_keyboard: keyboard };
}

export function buildNumberKeyboard(game) {
  return {
    inline_keyboard: [
      [
        { text: "1️⃣", callback_data: "num:1" },
        { text: "2️⃣", callback_data: "num:2" },
        { text: "3️⃣", callback_data: "num:3" }
      ],
      [
        { text: "4️⃣", callback_data: "num:4" },
        { text: "5️⃣", callback_data: "num:5" },
        { text: "6️⃣", callback_data: "num:6" }
      ],
      [
        { text: "7️⃣", callback_data: "num:7" },
        { text: "8️⃣", callback_data: "num:8" },
        { text: "9️⃣", callback_data: "num:9" }
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
