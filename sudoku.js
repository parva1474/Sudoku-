// تولید جدول نمونه سودوکو
export function generateSudoku() {
  const puzzle = [
    [5, 3, 0, 0, 7, 0, 0, 0, 0],
    [6, 0, 0, 1, 9, 5, 0, 0, 0],
    [0, 9, 8, 0, 0, 0, 0, 6, 0],
    [8, 0, 0, 0, 6, 0, 0, 0, 3],
    [4, 0, 0, 8, 0, 3, 0, 0, 1],
    [7, 0, 0, 0, 2, 0, 0, 0, 6],
    [0, 6, 0, 0, 0, 0, 2, 8, 0],
    [0, 0, 0, 4, 1, 9, 0, 0, 5],
    [0, 0, 0, 0, 8, 0, 0, 7, 9]
  ];
  return puzzle;
}

// ساخت کیبورد شیشه‌ای جدول سودوکو
export function buildSudokuKeyboard(board) {
  const numberEmojis = ['▫️', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣'];
  let keyboard = [];

  for (let r = 0; r < 9; r++) {
    let row = [];
    for (let c = 0; c < 9; c++) {
      let val = board[r][c];
      let text = numberEmojis[val];

      row.push({
        text: text,
        callback_data: `cell_${r}_${c}`
      });
    }
    keyboard.push(row);
  }

  // اضافه کردن کنترل‌ها در پایین جدول
  keyboard.push([
    { text: "🔄 بازی جدید", callback_data: "new_game" }
  ]);

  return keyboard;
}
