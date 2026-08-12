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

// بررسی کامل بودن بلوک
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
        // اگر بلوک کامل شده باشد، به جای دکمه کلیک‌پذیر، متن تکمیل نمایش داده می‌شود
        rowButtons.push({ text: `✅ بلوک ${boxIndex + 1} (تکمیل)`, callback_data: `box_done:${boxIndex}` });
      } else {
        rowButtons.push({ text: `🟦 بلوک ${boxIndex + 1}`, callback_data: `box:${boxIndex}` });
      }
    }
    keyboard.push(rowButtons);
  }

  keyboard.push([
    { text: '🔄 بازی جدید', callback_data: 'action:new' }
  ]);

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

export function buildNumberKeyboard(boxIndex, cellIndex) {
  return {
    inline_keyboard: [
      [
        { text: '🟥 ۱', callback_data: `num:${cellIndex}:1` },
        { text: '🟧 ۲', callback_data: `num:${cellIndex}:2` },
        { text: '🟨 ۳', callback_data: `num:${cellIndex}:3` }
      ],
      [
        { text: '🟩 ۴', callback_data: `num:${cellIndex}:4` },
        { text: '🟦 ۵', callback_data: `num:${cellIndex}:5` },
        { text: '🟪 ۶', callback_data: `num:${cellIndex}:6` }
      ],
      [
        { text: '🟫 ۷', callback_data: `num:${cellIndex}:7` },
        { text: '⬛ ۸', callback_data: `num:${cellIndex}:8` },
        { text: '⬜ ۹', callback_data: `num:${cellIndex}:9` }
      ],
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
        { text: '🔄 شروع بازی جدید', callback_data: 'action:new' }
      ]
    ]
  };
}
