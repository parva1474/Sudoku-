export function buildSudokuGridKeyboard(board, selectedCell = -1) {
  const keyboard = [];

  for (let row = 0; row < 9; row++) {
    const rowButtons = [];

    for (let col = 0; col < 9; col++) {
      const index = row * 9 + col;
      const cellValue = board[index];
      
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
