// ==========================================
// src/keyboard.js (3-Column Blocks per Row for 9x9 Grid)
// ==========================================

export function buildSudokuGridKeyboard(board, selectedCell = -1) {
  const keyboard = [];

  for (let row = 0; row < 9; row++) {
    const rowButtons = [];

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

      rowButtons.push({
        text: blockText,
        callback_data: `cell:${row * 9 + startCol}`
      });
    }

    keyboard.push(rowButtons);
  }

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
        { text: "🔙 بازگشت", callback_data: "action:grid" }
      ]
    ]
  };
}

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

export function buildFinishedKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: "🏆 بازی تمام شد - شروع مجدد", callback_data: "action:new" }
      ]
    ]
  };
}
