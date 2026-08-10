// ==========================================
// src/keyboard.js
// Inline Keyboard سودوکو
// ==========================================

function getCellText(game, index) {
  const value = game.board[index];

  // خانه دارای عدد
  if (value !== null) {
    return String(value);
  }

  // خانه دارای Pencil
  const notes = game.notes[index];

  if (notes.length > 0) {
    return notes.join("");
  }

  // خانه خالی
  return "·";
}

// ==========================================
// جدول اصلی Sudoku
// ==========================================

export function buildSudokuKeyboard(game) {
  const keyboard = [];

  for (let row = 0; row < 9; row++) {
    const line = [];

    for (let col = 0; col < 9; col++) {
      const index = row * 9 + col;

      let text =
        getCellText(game, index);

      // مشخص کردن خانه انتخاب‌شده
      if (
        game.selectedCell === index
      ) {
        text = `【${text}】`;
      }

      // مشخص کردن خانه‌های اولیه
      if (
        game.puzzle[index] !== null
      ) {
        text = `🔒${text}`;
      }

      line.push({
        text,

        callback_data:
          `cell:${index}`
      });
    }

    keyboard.push(line);
  }

  // ----------------------------------------
  // کنترل‌های بازی
  // ----------------------------------------

  keyboard.push([
    {
      text:
        game.pencilMode
          ? "✏️ مداد: روشن"
          : "✏️ مداد: خاموش",

      callback_data:
        "mode:pencil"
    },

    {
      text: "🧹 پاک کردن",

      callback_data:
        "mode:erase"
    }
  ]);

  keyboard.push([
    {
      text: "💡 راهنمایی",

      callback_data:
        "action:hint"
    },

    {
      text: "🔄 بازی جدید",

      callback_data:
        "action:new"
    }
  ]);

  return {
    inline_keyboard:
      keyboard
  };
}

// ==========================================
// کیبورد اعداد
// ==========================================

export function buildNumberKeyboard(
  game
) {
  const keyboard = [];

  keyboard.push([
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
  ]);

  keyboard.push([
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
  ]);

  keyboard.push([
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
  ]);

  keyboard.push([
    {
      text:
        game.pencilMode
          ? "✏️ مداد روشن"
          : "✏️ مداد خاموش",

      callback_data:
        "mode:pencil"
    },

    {
      text: "⬅️ برگشت",

      callback_data:
        "action:board"
    }
  ]);

  return {
    inline_keyboard:
      keyboard
  };
}

// ==========================================
// کیبورد انتخاب درجه سختی
// ==========================================

export function buildDifficultyKeyboard() {
  return {
    inline_keyboard: [

      [
        {
          text: "🟢 آسان",
          callback_data:
            "difficulty:easy"
        },

        {
          text: "🟡 متوسط",
          callback_data:
            "difficulty:medium"
        }
      ],

      [
        {
          text: "🔴 سخت",
          callback_data:
            "difficulty:hard"
        },

        {
          text: "🟣 خیلی سخت",
          callback_data:
            "difficulty:expert"
        }
      ],

      [
        {
          text: "⚫ استاد",
          callback_data:
            "difficulty:master"
        }
      ]
    ]
  };
}

// ==========================================
// کیبورد پایان بازی
// ==========================================

export function buildFinishedKeyboard() {
  return {
    inline_keyboard: [
      [
        {
          text: "🔄 بازی جدید",

          callback_data:
            "action:new"
        }
      ]
    ]
  };
}
