const sudokuBank = [
  [
    [5, 3, 0, 0, 7, 0, 0, 0, 0],
    [6, 0, 0, 1, 9, 5, 0, 0, 0],
    [0, 9, 8, 0, 0, 0, 0, 6, 0],
    [8, 0, 0, 0, 6, 0, 0, 0, 3],
    [4, 0, 0, 8, 0, 3, 0, 0, 1],
    [7, 0, 0, 0, 2, 0, 0, 0, 6],
    [0, 6, 0, 0, 0, 0, 2, 8, 0],
    [0, 0, 0, 4, 1, 9, 0, 0, 5],
    [0, 0, 0, 0, 8, 0, 0, 7, 9]
  ],
  [
    [0, 2, 0, 6, 0, 8, 0, 0, 0],
    [5, 8, 0, 0, 0, 9, 7, 0, 0],
    [0, 0, 0, 0, 4, 0, 0, 0, 0],
    [3, 7, 0, 0, 0, 0, 5, 0, 0],
    [6, 0, 0, 0, 0, 0, 0, 0, 4],
    [0, 0, 8, 0, 0, 0, 0, 1, 3],
    [0, 0, 0, 0, 2, 0, 0, 0, 0],
    [0, 0, 9, 8, 0, 0, 0, 3, 6],
    [0, 0, 0, 3, 0, 6, 0, 9, 0]
  ]
];

export function generateSudoku() {
  const randomIndex = Math.floor(Math.random() * sudokuBank.length);
  return sudokuBank[randomIndex].map(row => [...row]);
}

export function buildSudokuKeyboard(board, selectedCell = null) {
  const numberEmojis = ['▫️', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣'];
  let keyboard = [];

  for (let r = 0; r < 9; r++) {
    let row = [];
    for (let c = 0; c < 9; c++) {
      let val = board[r][c];
      let text = numberEmojis[val];

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
    { text: "🔄 بازی جدید", callback_data: "new_game" }
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
      { text: "🔙 بازگشت", callback_data: "back_to_board" }
    ]
  ];
}
