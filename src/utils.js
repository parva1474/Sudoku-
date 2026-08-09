export function buildControlKeyboard(gameState, selectedCell) {
  let keyboard = [];

  // اگر خانه‌ای انتخاب شده باشد، کیبورد اعداد نمایش داده می‌شود
  if (selectedCell && gameState.status === 'PLAYING') {
    keyboard.push([
      { text: gameState.pencilMode ? "✏️ حالت مداد: روشن" : "✏️ حالت مداد: خاموش", callback_data: "toggle_pencil" }
    ]);
    keyboard.push([
      { text: "1", callback_data: "input_1" },
      { text: "2", callback_data: "input_2" },
      { text: "3", callback_data: "input_3" }
    ]);
    keyboard.push([
      { text: "4", callback_data: "input_4" },
      { text: "5", callback_data: "input_5" },
      { text: "6", callback_data: "input_6" }
    ]);
    keyboard.push([
      { text: "7", callback_data: "input_7" },
      { text: "8", callback_data: "input_8" },
      { text: "9", callback_data: "input_9" }
    ]);
    keyboard.push([
      { text: "🧹 پاک کردن", callback_data: "input_0" },
      { text: "❌ لغو انتخاب", callback_data: "Deselect" }
    ]);
  } else {
    // کیبورد انتخاب خانه‌ها (برای راحتی روی موبایل یا راهنمای کلیک روی تصویر)
    // کاربران می‌توانند مستقیماً روی تصویر خانه را لمس کنند یا از دکمه‌های ناوبری استفاده کنند
    keyboard.push([
      { text: "👇 ابتدا یک خانه را از روی تصویر انتخاب کنید", callback_data: "noop" }
    ]);
  }

  // انتخابگر سریع ردیف‌ها/ستون‌ها برای تعامل آسان‌تر یا دکمه‌های ناوبری خانه انتخابی
  let navRow1 = [];
  for (let c = 0; c < 9; c++) {
    navRow1.push({ text: `${c+1}`, callback_data: `sel_col_${c}` });
  }
  // برای سادگی و کارایی، دکمه‌های کنترلی عمومی
  keyboard.push([
    { text: "🔄 بازی جدید", callback_data: "new_game" },
    { text: `خطاها: ${gameState.mistakes}/${gameState.maxMistakes}`, callback_data: "noop" }
  ]);

  // اضافه کردن گرید انتخاب سریع خانه (برای تعامل کامل دکمه‌ای در صورت نیاز)
  let gridSelect = [];
  for (let r = 0; r < 9; r++) {
    let row = [];
    for (let c = 0; c < 9; c++) {
      let label = '.';
      let cell = gameState.board[r][c];
      if (cell.value !== null) label = cell.value;
      if (selectedCell && selectedCell.r === r && selectedCell.c === c) label = '📍';
      row.push({ text: label, callback_data: `cell_${r}_${c}` });
    }
    gridSelect.push(row);
  }

  // به جای شلوغی، ترکیب کیبورد کنترلی پایین عکس
  return {
    inline_keyboard: [
      ...(selectedCell && gameState.status === 'PLAYING' ? [
        [{ text: `📍 خانه انتخاب‌شده: ردیف ${selectedCell.r+1}، ستون ${selectedCell.c+1}`, callback_data: "noop" }],
        [{ text: gameState.pencilMode ? "✏️ حالت مداد: روشن" : "✏️ حالت مداد: خاموش", callback_data: "toggle_pencil" }],
        [
          { text: "1", callback_data: "input_1" }, { text: "2", callback_data: "input_2" }, { text: "3", callback_data: "input_3" }
        ],
        [
          { text: "4", callback_data: "input_4" }, { text: "5", callback_data: "input_5" }, { text: "6", callback_data: "input_6" }
        ],
        [
          { text: "7", callback_data: "input_7" }, { text: "8", callback_data: "input_8" }, { text: "9", callback_data: "input_9" }
        ],
        [
          { text: "🧹 پاک کردن", callback_data: "input_0" }, { text: "❌ لغو انتخاب", callback_data: "deselect" }
        ]
      ] : [
        [{ text: "👆 برای شروع، یکی از خانه‌های زیر را انتخاب کنید", callback_data: "noop" }]
      ]),
      // مینی گرید انتخاب خانه زیر دکمه‌ها برای دسترسی کامل به ۸۱ خانه
      ...gridSelect,
      [
        { text: "🔄 بازی جدید", callback_data: "new_game" },
        { text: `خطاها: ${gameState.mistakes}/${gameState.maxMistakes}`, callback_data: "noop" }
      ]
    ]
  };
}
