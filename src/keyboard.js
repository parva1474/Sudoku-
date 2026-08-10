// ==========================================
// src/keyboard.js
// تست خالص جدول 9×9
// ==========================================

function getCellText(game, index) {
  const value = game.board[index];

  if (value !== null && value !== undefined) {
    return String(value);
  }

  return "·";
}

// ==========================================
// جدول Sudoku فقط
// ==========================================

export function buildSudokuKeyboard(game) {
  const keyboard = [];

  for (let row = 0; row < 9; row++) {
    const line = [];

    for (let col = 0; col < 9; col++) {
      const index =
        row * 9 + col;

      let text =
        getCellText(game, index);

      // خانه انتخاب‌شده
      if (game.selectedCell === index) {
        text = `•`;
      }

      line.push({
        text,
        callback_data: `cell:${index}`
      });
    }

    keyboard.push(line);
  }

  return {
    inline_keyboard: keyboard
  };
}

// ==========================================
// کیبورد اعداد
// ==========================================

export function buildNumberKeyboard(game) {
  return {
    inline_keyboard: [
      [
        {
          text: "1",
          callback_data: "num:1"
        },
        {
          text: "2",
          callback_data: "num:2"
        },
        {
          text: "3",
          callback_data: "num:3"
        }
      ],
      [
        {
          text: "4",
          callback_data: "num:4"
        },
        {
          text: "5",
          callback_data: "num:5"
        },
        {
          text: "6",
          callback_data: "num:6"
        }
      ],
      [
        {
          text: "7",
          callback_data: "num:7"
        },
        {
          text: "8",
          callback_data: "num:8"
        },
        {
          text: "9",
          callback_data: "num:9"
        }
      ],
      [
        {
          text: "✏️",
          callback_data: "mode:pencil"
        },
        {
          text: "🧹",
          callback_data: "mode:erase"
        }
      ],
      [
        {
          text: "⬅️",
          callback_data: "action:board"
        }
      ]
    ]
  };
}

// ==========================================
// انتخاب درجه سختی
// ==========================================

export function buildDifficultyKeyboard() {
  return {
    inline_keyboard: [
      [
        {
          text: "🟢 آسان",
          callback_data: "difficulty:easy"
        },
        {
          text: "🟡 متوسط",
          callback_data: "difficulty:medium"
        }
      ],
      [
        {
          text: "🔴 سخت",
          callback_data: "difficulty:hard"
        },
        {
          text: "🟣 خیلی سخت",
          callback_data: "difficulty:expert"
        }
      ],
      [
        {
          text: "⚫ استاد",
          callback_data: "difficulty:master"
        }
      ]
    ]
  };
}

// ==========================================
// پایان بازی
// ==========================================

export function buildFinishedKeyboard() {
  return {
    inline_keyboard: [
      [
        {
          text: "🔄",
          callback_data: "action:new"
        }
      ]
    ]
  };
}
