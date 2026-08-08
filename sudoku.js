export function generateSudoku() {
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

  let puzzle = base.map(row => [...row]);
  let removedCount = 0;
  while (removedCount < 35) {
    let r = Math.floor(Math.random() * 9);
    let c = Math.floor(Math.random() * 9);
    if (puzzle[r][c] !== 0) {
      puzzle[r][c] = 0;
      removedCount++;
    }
  }

  return puzzle;
}

export function buildSudokuKeyboard(board, selectedCell = null, boardString = '') {
  let keyboard = [];
  const emojis = ['⬛', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣'];

  for (let r = 0; r < 9; r++) {
    let row = [];
    for (let c = 0; c < 9; c++) {
      let val = board[r][c];
      let text = emojis[val];

      row.push({
        text: text,
        callback_data: `cell_${r}_${c}_${boardString}`
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

export function buildNumberKeyboard(r, c, boardString) {
  return [
    [
      { text: "1️⃣", callback_data: `set_${r}_${c}_1_${boardString}` },
      { text: "2️⃣", callback_data: `set_${r}_${c}_2_${boardString}` },
      { text: "3️⃣", callback_data: `set_${r}_${c}_3_${boardString}` }
    ],
    [
      { text: "4️⃣", callback_data: `set_${r}_${c}_4_${boardString}` },
      { text: "5️⃣", callback_data: `set_${r}_${c}_5_${boardString}` },
      { text: "6️⃣", callback_data: `set_${r}_${c}_6_${boardString}` }
    ],
    [
      { text: "7️⃣", callback_data: `set_${r}_${c}_7_${boardString}` },
      { text: "8️⃣", callback_data: `set_${r}_${c}_8_${boardString}` },
      { text: "9️⃣", callback_data: `set_${r}_${c}_9_${boardString}` }
    ],
    [
      { text: "❌ پاک کردن", callback_data: `set_${r}_${c}_0_${boardString}` },
      { text: "🔙 بازگشت به جدول", callback_data: `back_board_${boardString}` }
    ]
  ];
}
