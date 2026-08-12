// ==========================================
// src/keyboard.js
// مدیریت کیبوردهای شیشه‌ای سودوکو
// ==========================================

// ساخت کیبورد جدول کامل ۹ در ۹ (۸۱ خانه)
export function buildSudokuGridKeyboard(board, selectedCell = -1) {
  const keyboard = [];

  for (let row = 0; row < 9; row++) {
    const rowButtons = [];

    for (let col = 0; col < 9; col++) {
      const index = row * 9 + col;
      const cellValue = board[index];
      
      // اگر خانه انتخاب شده است، علامت خاصی بگذاریم تا کاربر متوجه شود
      let displayText = cellValue ? String(cellValue) : "·";
      if (index === selectedCell) {
        displayText = `[${displayText}]`;
      }

      rowButtons.push({
        text: displayText,
        callback_data: `cell:${index}`
      });
    }

    keyboard.push(rowButtons);
  }

  // دکمه‌های کنترلی پایین جدول
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

// کیبورد انتخاب اعداد (وقتی کاربری روی یک خانه کلیک می‌کند)
export function buildNumberKeyboard(game) {
  const keyboard = [
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
      { text: game.pencilMode ? "✏️ مداد: روشن" : "✏️ مداد: خاموش", callback_data: "mode:pencil" },
      { text: "🧹 پاک کردن", callback_data: "mode:erase" }
    ],
    [
      { text: "🔙 بازگشت به جدول", callback_data: "action:grid" }
    ]
  ];

  return { inline_keyboard: keyboard };
}

// کیبورد انتخاب سطح سختی برای شروع بازی
export function buildDifficultyKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: "🟢 آسان", callback_data: "difficulty:easy" },
        { text: "🟡 متوسط", callback_data: "difficulty:medium" }
      ],
      [
        { text: "🔴 سخت", callback_data: "difficulty:hard" },
        { text: "🟣 خیلی سخت", callback_data: "difficulty:expert" }
      ],
      [
        { text: "⚫ استاد", callback_data: "difficulty:master" }
      ]
    ]
  };
}

// کیبورد پایان بازی (برد)
export function buildFinishedKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: "🏆 تبریک! بازی تمام شد - شروع بازی جدید", callback_data: "action:new" }
      ]
    ]
  };
}
