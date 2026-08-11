// ==========================================
// src/keyboard.js
// Telegram Inline Keyboard
// Sudoku
//
// IMPORTANT:
// Telegram cannot reliably display 9 buttons
// in one row.
// Therefore the Sudoku board is NOT rendered
// as 9 buttons in one row.
//
// Flow:
//
// 1. Select one of 9 blocks
// 2. Select one of 9 cells inside that block
// 3. Select a number
//
// Maximum buttons per row = 3
// ==========================================


// ==========================================
// بلوک‌های 3×3
// ==========================================

export function buildBlockKeyboard(
  game = null
) {

  const keyboard = [];

  // ----------------------------------------
  // 9 بلوک
  // ----------------------------------------

  keyboard.push([

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

  ]);

  keyboard.push([

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

  ]);

  keyboard.push([

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

  ]);

  // ----------------------------------------
  // کنترل‌ها
  // ----------------------------------------

  keyboard.push([

    {
      text: "💡 راهنمایی",
      callback_data: "action:hint"
    },

    {
      text: "🔄 بازی جدید",
      callback_data: "action:new"
    }

  ]);

  return {
    inline_keyboard:
      keyboard
  };
}


// ==========================================
// انتخاب خانه داخل بلوک
// ==========================================

export function buildCellKeyboard(
  block,
  game = null
) {

  block =
    Number(block);

  if (
    !Number.isInteger(block) ||
    block < 0 ||
    block > 8
  ) {

    return buildBlockKeyboard(
      game
    );
  }

  const blockRow =
    Math.floor(
      block / 3
    );

  const blockCol =
    block % 3;

  const keyboard = [];

  // ----------------------------------------
  // 3×3 خانه‌های بلوک
  // ----------------------------------------

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

      let text =
        `${rowIndex + 1}×${colIndex + 1}`;

      // --------------------------------------
      // مشخص کردن خانه انتخاب‌شده
      // --------------------------------------

      if (
        game &&
        game.selectedCell === index
      ) {

        text =
          `🔵 ${text}`;
      }

      // --------------------------------------
      // خانه ثابت
      // --------------------------------------

      if (
        game &&
        Array.isArray(game.puzzle) &&
        game.puzzle[index] !== null &&
        game.puzzle[index] !== undefined
      ) {

        text =
          `🔒 ${text}`;
      }

      row.push({

        text,

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
      text:
        "⬅️ برگشت به بلوک‌ها",

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

export function buildNumberKeyboard(
  game
) {

  const keyboard = [];

  // ----------------------------------------
  // اعداد 1 تا 9
  // ----------------------------------------

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

  // ----------------------------------------
  // مداد / پاک کردن
  // ----------------------------------------

  keyboard.push([

    {
      text:
        game && game.pencilMode
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

  ]);

  // ----------------------------------------
  // برگشت به خانه‌ها
  // ----------------------------------------

  keyboard.push([

    {
      text:
        "⬅️ برگشت به خانه‌ها",

      callback_data:
        "action:cells"

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
          text:
            "🟢 آسان",

          callback_data:
            "difficulty:easy"
        },

        {
          text:
            "🟡 متوسط",

          callback_data:
            "difficulty:medium"
        }

      ],

      [

        {
          text:
            "🔴 سخت",

          callback_data:
            "difficulty:hard"
        },

        {
          text:
            "🟣 خیلی سخت",

          callback_data:
            "difficulty:expert"
        }

      ],

      [

        {
          text:
            "⚫ استاد",

          callback_data:
            "difficulty:master"
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
          text:
            "🔄 بازی جدید",

          callback_data:
            "action:new"

        }

      ]

    ]

  };
}


// ==========================================
// کیبورد اصلی کنترل بازی
// ==========================================
//
// این تابع برای سازگاری با فایل‌های دیگر
// نگه داشته شده.
//
// جدول 9×9 مستقیماً اینجا ساخته نمی‌شود.
//
// ==========================================

export function buildSudokuKeyboard(
  game
) {

  return buildBlockKeyboard(
    game
  );
}
