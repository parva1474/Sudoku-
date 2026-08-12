// ==========================================
// src/keyboard.js - نسخه ۹ بلوک ۳در۳
// ==========================================

// نمایش نمای کلی جدول (۹ بلوک ۳ در ۳)
export function buildSudokuGridKeyboard(board, selectedCell = -1) {
  const keyboard = [];

  for (let blockRow = 0; blockRow < 3; blockRow++) {
    const rowButtons = [];

    for (let blockCol = 0; blockCol < 3; blockCol++) {
      // تولید محتوای نمایشی کوچک برای هر بلوک ۳در۳
      let display = "";
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          const idx = ((blockRow * 3 + r) * 9) + (blockCol * 3 + c);
          display += (board[idx] ? board[idx] : "·");
          if (c < 2) display += " ";
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
    { text: "🧹 پاک کردن", callback_data: "mode:erase" },
    { text: "💡 راهنمایی", callback_data: "action:hint" }
  ]);

  keyboard.push([
    { text: "🔄 بازی جدید", callback_data: "action:new" }
  ]);

  return { inline_keyboard: keyboard };
}

// کیبورد اعداد (برای وقتی که کاربر وارد یک بلوک شد)
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
        { text: "🔙 بازگشت به جدول اصلی", callback_data: "action:grid" }
      ]
    ]
  };
}

// کیبورد انتخاب سختی
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

// کیبورد پایان بازی
export function buildFinishedKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: "🏆 تبریک! شروع مجدد", callback_data: "action:new" }
      ]
    ]
  };
}
