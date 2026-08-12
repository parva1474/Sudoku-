// ==========================================
// src/keyboard.js (9x9 Grid using 3x3 blocks per row)
// ==========================================

export function buildSudokuGridKeyboard(board, selectedCell = -1) {
  const keyboard = [];

  // ایجاد ۹ سطر برای جدول سودوکو
  for (let row = 0; row < 9; row++) {
    const rowButtons = [];

    // هر سطر شامل ۳ دکمه است (هر دکمه شامل ۳ خانه کنار هم)
    for (let blockCol = 0; blockCol < 3; blockCol++) {
      let blockText = "";
      const startCol = blockCol * 3;

      for (let i = 0; i < 3; i++) {
        const col = startCol + i;
        const index = (row * 9) + col;
        const val = board[index];
        
        let char = val ? String(val) : "·";
        if (index === selectedCell) {
          char = `[${char}]`;
        }
        
        blockText += (i === 0 ? "" : " ") + char;
      }

      // اولین خانه این بلوک ۳تایی را به عنوان مرجع ایندکس برای کلیک در نظر می‌گیریم
      // یا برای دقت بالاتر، کلید را به ۳ قسمت تقسیم می‌کنیم:
      rowButtons.push({
        text: blockText,
        callback_data: `cell:${row * 9 + startCol}` // یا روش مدیریت کلیک بلوکی
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
