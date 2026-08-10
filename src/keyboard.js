// ==========================================
// src/keyboard.js
// Telegram Inline Keyboards
// Sudoku
// ==========================================

// ==========================================
// کیبورد انتخاب بلوک‌های 3×3
// ==========================================

export function buildBlockKeyboard() {

  return {
    inline_keyboard: [

      [
        {
          text: "1️⃣",
          callback_data: "block:0"
        },
        {
          text: "2️⃣",
          callback_data: "block:1"
        },
        {
          text: "3️⃣",
          callback_data: "block:2"
        }
      ],

      [
        {
          text: "4️⃣",
          callback_data: "block:3"
        },
        {
          text: "5️⃣",
          callback_data: "block:4"
        },
        {
          text: "6️⃣",
          callback_data: "block:5"
        }
      ],

      [
        {
          text: "7️⃣",
          callback_data: "block:6"
        },
        {
          text: "8️⃣",
          callback_data: "block:7"
        },
        {
          text: "9️⃣",
          callback_data: "block:8"
        }
      ],

      [
        {
          text: "💡 راهنمایی",
          callback_data: "action:hint"
        },
        {
          text: "🔄 بازی جدید",
          callback_data: "action:new"
        }
      ]
    ]
  };
}

// ==========================================
// کیبورد انتخاب خانه داخل یک بلوک
// ==========================================

export function buildCellKeyboard(block) {

  const blockRow =
    Math.floor(block / 3);

  const blockCol =
    block % 3;

  const keyboard = [];

  for (
    let localRow = 0;
    localRow < 3;
    localRow++
  ) {

    const row = [];

    for (
      let localCol = 0;
      localCol < 3;
      localCol++
    ) {

      const rowIndex =
        blockRow * 3 +
        localRow;

      const colIndex =
        blockCol * 3 +
        localCol;

      const index =
        rowIndex * 9 +
        colIndex;

      row.push({

        text:
          `${rowIndex + 1}×${colIndex + 1}`,

        callback_data:
          `cell:${index}`
      });
    }

    keyboard.push(row);
  }

  // ----------------------------------------
  // برگشت
  // ----------------------------------------

  keyboard.push([
    {
      text: "⬅️ برگشت به بلوک‌ها",

      callback_data:
        "action:blocks"
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

      // --------------------------------------
      // کنترل مداد و پاک کردن
      // --------------------------------------

      [
        {
          text:
            game.pencilMode
              ? "✏️ مداد روشن"
              : "✏️ مداد خاموش",

          callback_data:
            "mode:pencil"
        },

        {
          text:
            "🧹 پاک کردن",

          callback_data:
            "mode:erase"
        }
      ],

      // --------------------------------------
      // برگشت به جدول
      // --------------------------------------

      [
        {
          text:
            "⬅️ برگشت به جدول",

          callback_data:
            "action:blocks"
        }
      ]
    ]
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
          text:
            "🔄 بازی جدید",

          callback_data:
            "action:new"
        }
      ]
    ]
  };
}
