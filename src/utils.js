export function buildControlKeyboard(gameState, selectedCell) {
  let keyboard = [];

  // اگر خانه‌ای انتخاب شده باشد، کیبورد اعداد و مداد نمایش داده می‌شود
  if (selectedCell && gameState.status === 'PLAYING') {
    keyboard.push([
      { text: gameState.pencilMode ? "✏️ حالت مداد: روشن" : "✏️ حالت مداد: خاموش", callback_data: "toggle_pencil" }
    ]);
    keyboard.push([
      { text: "1️⃣", callback_data: "input_1" },
      { text: "2️⃣", callback_data: "input_2" },
      { text: "3️⃣", callback_data: "input_3" }
    ]);
    keyboard.push([
      { text: "4️⃣", callback_data: "input_4" },
      { text: "5️⃣", callback_data: "input_5" },
      { text: "6️⃣", callback_data: "input_6" }
    ]);
    keyboard.push([
      { text: "7️⃣", callback_data: "input_7" },
      { text: "8️⃣", callback_data: "input_8" },
      { text: "9️⃣", callback_data: "input_9" }
    ]);
    keyboard.push([
      { text: "🧹 پاک کردن", callback_data: "input_0" },
      { text: "❌ لغو انتخاب", callback_data: "deselect" }
    ]);
  } else {
    keyboard.push([
      { text: "👇 لطفاً یک خانه را از جدول زیر انتخاب کنید", callback_data: "noop" }
    ]);
  }

  // گرید کلیدهای انتخاب خانه‌ها (۸۱ خانه برای تعامل مستقیم)
  let gridSelect = [];
  for (let r = 0; r < 9; r++) {
    let row = [];
    for (let c = 0; c < 9; c++) {
      let label = '·';
      let cell = gameState.board[r][c];
      if (cell.value !== null) label = `${cell.value}`;
      if (selectedCell && selectedCell.r === r && selectedCell.c === c) label = '📍';
      row.push({ text: label, callback_data: `cell_${r}_${c}` });
    }
    gridSelect.push(row);
  }

  keyboard.push(...gridSelect);

  keyboard.push([
    { text: "🔄 بازی جدید", callback_data: "new_game" },
    { text: `خطاها: ${gameState.mistakes}/${gameState.maxMistakes}`, callback_data: "noop" }
  ]);

  return { inline_keyboard: keyboard };
}
