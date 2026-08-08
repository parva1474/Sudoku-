// تابع تولید خودکار و الگوریتمی جدول سودوکو
function createBaseSudoku() {
  const base = [
    [1, 2, 3, 4, 5, 6, 7, 8, 9],
    [4, 5, 6, 7, 8, 9, 1, 2, 3],
    [7, 8, 9, 1, 2, 3, 4, 5, 6],
    [2, 3, 1, 5, 6, 4, 8, 9, 7],
    [5, 6, 4, 8, 9, 7, 2, 3, 1],
    [8, 9, 7, 2, 3, 1, 5, 6, 4],
    [3, 1, 2, 6, 4, 5, 9, 7, 8],
    [6, 4, 5, 9, 7, 8, 3, 1, 2],
    [9, 7, 8, 3, 1, 2, 6, 4, 5]
  ];
  
  // به هم ریختن تصادفی برای ایجاد یک جدول کاملاً جدید و معتبر
  for (let i = 0; i < 5; i++) {
    const n1 = Math.floor(Math.random() * 3);
    const n2 = Math.floor(Math.random() * 3);
    const block = Math.floor(Math.random() * 3);
    
    // جابجایی سطرها درون بلوک‌ها
    let row1 = block * 3 + n1;
    let row2 = block * 3 + n2;
    let temp = base[row1];
    base[row1] = base[row2];
    base[row2] = temp;
  }

  // پنهان کردن تعدادی از خانه‌ها برای تبدیل به معما (صفر کردن)
  let puzzle = base.map(row => [...row]);
  let removedCount = 0;
  while (removedCount < 40) { // حذف حدود 40 خانه برای ایجاد سختی استاندارد
    let r = Math.floor(Math.random() * 9);
    let c = Math.floor(Math.random() * 9);
    if (puzzle[r][c] !== 0) {
      puzzle[r][c] = 0;
      removedCount++;
    }
  }

  return puzzle;
}

export function generateSudoku() {
  return createBaseSudoku();
}

// تفکیک بلوک‌های ۳ در ۳ با اموجی‌های متنوع برای زیبایی و خوانایی
export function buildSudokuKeyboard(board, selectedCell = null) {
  let keyboard = [];

  for (let r = 0; r < 9; r++) {
    let row = [];
    for (let c = 0; c < 9; c++) {
      let val = board[r][c];
      
      let boxBlock = Math.floor(r / 3) * 3 + Math.floor(c / 3);
      let blockEmojis = [
        ['⬛', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣'],
        ['⬜', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣'],
        ['◼️', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣'],
        ['◻️', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣'],
        ['🟧', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣'],
        ['🟦', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣'],
        ['🟨', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣'],
        ['🟪', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣'],
        ['🟩', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣']
      ];

      let text = val === 0 ? blockEmojis[boxBlock][0] : ['▫️','1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣'][val];

      if (selectedCell && selectedCell.r === r && selectedCell.c === c) {
        text = '🔘';
      }

      row.push({
        text: text,
        callback_data: `cell_${r}_${c}`
      });
    }
    keyboard.push(row);
  }

  keyboard.push([
    { text: "🔄 بازی جدید", callback_data: "new_game" },
    { text: "💡 راهنما", callback_data: "help_game" }
  ]);

  return keyboard;
}

export function buildNumberKeyboard(r, c) {
  return [
    [
      { text: "1️⃣", callback_data: `set_${r}_${c}_1` },
      { text: "2️⃣", callback_data: `set_${r}_${c}_2` },
      { text: "3️⃣", callback_data: `set_${r}_${c}_3` }
    ],
    [
      { text: "4️⃣", callback_data: `set_${r}_${c}_4` },
      { text: "5️⃣", callback_data: `set_${r}_${c}_5` },
      { text: "6️⃣", callback_data: `set_${r}_${c}_6` }
    ],
    [
      { text: "7️⃣", callback_data: `set_${r}_${c}_7` },
      { text: "8️⃣", callback_data: `set_${r}_${c}_8` },
      { text: "9️⃣", callback_data: `set_${r}_${c}_9` }
    ],
    [
      { text: "❌ پاک کردن", callback_data: `set_${r}_${c}_0` },
      { text: "🔙 بازگشت به جدول", callback_data: "back_to_board" }
    ]
  ];
}
