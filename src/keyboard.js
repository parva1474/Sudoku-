// ==========================================
// src/keyboard.js
// ==========================================

export function buildDifficultyKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: '🟢 آسان', callback_data: 'difficulty:easy' },
        { text: '🟡 متوسط', callback_data: 'difficulty:medium' }
      ],
      [
        { text: '🔴 سخت', callback_data: 'difficulty:hard' },
        { text: '🔥 خیلی سخت', callback_data: 'difficulty:expert' }
      ]
    ]
  };
}

function isBoxComplete(board, boxIndex) {
  const startRow = Math.floor(boxIndex / 3) * 3;
  const startCol = (boxIndex % 3) * 3;
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const idx = (startRow + r) * 9 + (startCol + c);
      if (board[idx] === 0) return false;
    }
  }
  return true;
}

export function buildSudokuGridKeyboard(board) {
  let keyboard = [];
  
  for (let bRow = 0; bRow < 3; bRow++) {
    let rowButtons = [];
    for (let bCol = 0; bCol < 3; bCol++) {
      let boxIndex = bRow * 3 + bCol;
      
      if (isBoxComplete(board, boxIndex)) {
        rowButtons.push({ text: `✅ بلوک ${boxIndex + 1} (تکمیل)`, callback_data: `box_done:${boxIndex}` });
      } else {
        rowButtons.push({ text: `🟦 بلوک ${boxIndex + 1}`, callback_data: `box:${boxIndex}` });
      }
    }
    keyboard.push(rowButtons);
  }

  return { inline_keyboard: keyboard };
}

export function buildBoxCellsKeyboard(board, boxIndex) {
  let keyboard = [];
  const startRow = Math.floor(boxIndex / 3) * 3;
  const startCol = (boxIndex % 3) * 3;

  for (let r = 0; r < 3; r++) {
    let rowButtons = [];
    for (let c = 0; c < 3; c++) {
      const cellRow = startRow + r;
      const cellCol = startCol + c;
      const cellIndex = cellRow * 9 + cellCol;
      const val = board[cellIndex];

      let text = val !== 0 ? `🔒 ${val}` : `▫️ خالی`;
      rowButtons.push({ text: text, callback_data: `cell:${boxIndex}:${cellIndex}` });
    }
    keyboard.push(rowButtons);
  }

  keyboard.push([
    { text: '🔙 بازگشت به جدول کل', callback_data: 'action:grid' }
  ]);

  return { inline_keyboard: keyboard };
}

export function buildNumberKeyboard(board, boxIndex, cellIndex) {
  const counts = {};
  for (let i = 1; i <= 9; i++) {
    counts[i] = 9;
  }
  for (let i = 0; i < 81; i++) {
    const val = board[i];
    if (val >= 1 && val <= 9) {
      counts[val]--;
    }
  }

  const createNumButton = (num) => {
    if (counts[num] <= 0) {
      return { text: `☑️ ${num} (تکمیل)`, callback_data: `num_done:${num}` };
    }
    const icons = ['', '🟥 ۱', '🟧 ۲', '🟨 ۳', '🟩 ۴', '🟦 ۵', '🟪 ۶', '🟫 ۷', '⬛ ۸', '⬜ ۹'];
    return { text: icons[num], callback_data: `num:${cellIndex}:${num}` };
  };

  return {
    inline_keyboard: [
      [createNumButton(1), createNumButton(2), createNumButton(3)],
      [createNumButton(4), createNumButton(5), createNumButton(6)],
      [createNumButton(7), createNumButton(8), createNumButton(9)],
      [
        { text: '🧹 پاک کردن خانه', callback_data: `num:${cellIndex}:0` }
      ],
      [
        { text: '🔙 بازگشت به بلوک', callback_data: `box:${boxIndex}` }
      ]
    ]
  };
}

export function buildFinishedKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: '🔄 بازی مجدد (جدول جدید)', callback_data: 'action:new' }
      ]
    ]
  };
}
