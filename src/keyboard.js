// ==========================================
// src/keyboard.js
// Inline Keyboard Sudoku
// نسخه تست حداقل عرض دکمه‌ها
// ==========================================

// ==========================================
// نمایش مقدار خانه
// ==========================================

function getCellText(game, index) {
  const value = game.board[index];

  // اعداد به صورت SuperScript
  // برای کم کردن عرض ظاهری دکمه
  if (value !== null) {
    const tinyNumbers = {
      1: "¹",
      2: "²",
      3: "³",
      4: "⁴",
      5: "⁵",
      6: "⁶",
      7: "⁷",
      8: "⁸",
      9: "⁹"
    };

    return tinyNumbers[value] || "·";
  }

  // Pencil
  const notes = Array.isArray(game.notes[index])
    ? game.notes[index]
    : [];

  // در حالت Pencil هم فقط یک کاراکتر
  // نمایش داده می‌شود تا عرض دکمه زیاد نشود.
  if (notes.length > 0) {
    return "·";
  }

  // خانه خالی
  return "·";
}

// ==========================================
// خانه انتخاب‌شده
// ==========================================

function markSelected() {
  // فقط یک کاراکتر
  return "•";
}

// ==========================================
// کیبورد اصلی Sudoku
// ==========================================

export function buildSudokuKeyboard(game) {
  const keyboard = [];

  for (let row = 0; row < 9; row++) {
    const line = [];

    for (let col = 0; col < 9; col++) {
      const index = row * 9 + col;

      let text =
        getCellText(game, index);

      // خانه انتخاب‌شده
      if (game.selectedCell === index) {
        text = markSelected();
      }

      /*
       * عمداً هیچ Emoji یا فاصله‌ای
       * در خانه‌های جدول استفاده نشده.
       */

      line.push({
        text: text,

        callback_data:
          `cell:${index}`
      });
    }

    keyboard.push(line);
  }

  // ========================================
  // کنترل‌ها
  // ========================================

  keyboard.push([
    {
      text: game.pencilMode
        ? "✏️ مداد روشن"
        : "✏️ مداد خاموش",

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
// کیبورد انتخاب عدد
// ==========================================

export function buildNumberKeyboard(game) {
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

  // ========================================
  // کنترل‌ها
  // ========================================

  keyboard.push([
    {
      text: game.pencilMode
        ? "✏️ مداد روشن"
        : "✏️ مداد خاموش",

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
      text: "⬅️ برگشت به جدول",

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
// کیبورد درجه سختی
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
          text: "🔄 بازی جدید",
          callback_data: "action:new"
        }
      ]
    ]
  };
}
