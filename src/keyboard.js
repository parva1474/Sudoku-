// ==========================================
// src/keyboard.js
// Telegram Sudoku Keyboard
// Cloudflare Workers compatible
// ==========================================


// ==========================================
// ابزار ساخت دکمه
// ==========================================

function button(
  text,
  callbackData
) {

  return {
    text,
    callback_data: callbackData
  };
}


// ==========================================
// Sudoku Keyboard اصلی
// ==========================================

export function buildSudokuKeyboard(
  game
) {

  return buildBlockKeyboard(
    game
  );
}


// ==========================================
// انتخاب ۹ بلوک Sudoku
// چیدمان واقعی ۳×۳
// ==========================================

export function buildBlockKeyboard(
  game
) {

  const keyboard = [];


  // ----------------------------------------
  // سه ردیف × سه بلوک
  // ----------------------------------------

  for (
    let blockRow = 0;
    blockRow < 3;
    blockRow++
  ) {

    const row = [];


    for (
      let blockCol = 0;
      blockCol < 3;
      blockCol++
    ) {

      const block =
        blockRow * 3 +
        blockCol;


      row.push(
        button(
          getBlockText(
            game,
            block
          ),
          `block:${block}`
        )
      );
    }


    keyboard.push(row);
  }


  // ----------------------------------------
  // راهنمایی
  // ----------------------------------------

  keyboard.push([

    button(
      "💡 راهنمایی",
      "action:hint"
    ),

    button(
      "🔄 بازی جدید",
      "action:new"
    )

  ]);


  return {
    inline_keyboard:
      keyboard
  };
}


// ==========================================
// متن بلوک
// ==========================================

function getBlockText(
  game,
  block
) {

  const startRow =
    Math.floor(block / 3) * 3;

  const startCol =
    (block % 3) * 3;


  let filled = 0;
  let total = 0;


  for (
    let r = startRow;
    r < startRow + 3;
    r++
  ) {

    for (
      let c = startCol;
      c < startCol + 3;
      c++
    ) {

      const index =
        r * 9 + c;

      total++;


      if (
        game?.board?.[index] !== null &&
        game?.board?.[index] !== undefined
      ) {

        filled++;
      }
    }
  }


  return `▣ ${block + 1}  ${filled}/${total}`;
}


// ==========================================
// انتخاب خانه‌های یک بلوک
// ==========================================

export function buildCellKeyboard(
  block,
  game
) {

  if (
    !Number.isInteger(block) ||
    block < 0 ||
    block > 8
  ) {

    return {
      inline_keyboard: []
    };
  }


  const keyboard = [];


  const startRow =
    Math.floor(block / 3) * 3;

  const startCol =
    (block % 3) * 3;


  // ----------------------------------------
  // ۳ ردیف × ۳ خانه
  // ----------------------------------------

  for (
    let r = 0;
    r < 3;
    r++
  ) {

    const row = [];


    for (
      let c = 0;
      c < 3;
      c++
    ) {

      const realRow =
        startRow + r;

      const realCol =
        startCol + c;


      const index =
        realRow * 9 +
        realCol;


      row.push(
        button(
          getCellText(
            game,
            index
          ),
          `cell:${index}`
        )
      );
    }


    keyboard.push(row);
  }


  // ----------------------------------------
  // کنترل پایین صفحه
  // ----------------------------------------

  keyboard.push([

    button(
      "↩️ بلوک‌ها",
      "action:blocks"
    )

  ]);


  return {
    inline_keyboard:
      keyboard
  };
}


// ==========================================
// متن خانه
// ==========================================

function getCellText(
  game,
  index
) {

  const value =
    game?.board?.[index];


  // خانه انتخاب‌شده
  if (
    Number(game?.selectedCell) === index
  ) {

    if (
      value !== null &&
      value !== undefined
    ) {

      return `🔵 ${value}`;
    }

    return "🔵 ·";
  }


  // خانه دارای عدد
  if (
    value !== null &&
    value !== undefined
  ) {

    // عدد صحیح بازی
    if (
      game?.puzzle?.[index] !== null &&
      game?.puzzle?.[index] !== undefined
    ) {

      return `🔒 ${value}`;
    }


    return `✅ ${value}`;
  }


  // خانه دارای یادداشت
  const notes =
    game?.notes?.[index];


  if (
    Array.isArray(notes) &&
    notes.length > 0
  ) {

    return `✏️ ${notes.join("")}`;
  }


  return "·";
}


// ==========================================
// صفحه انتخاب عدد
// ==========================================

export function buildNumberKeyboard(
  game
) {

  const keyboard = [];


  // ----------------------------------------
  // اعداد ۱ تا ۹
  // ۳ × ۳
  // ----------------------------------------

  for (
    let row = 0;
    row < 3;
    row++
  ) {

    const buttons = [];


    for (
      let col = 0;
      col < 3;
      col++
    ) {

      const number =
        row * 3 +
        col +
        1;


      buttons.push(
        button(
          String(number),
          `num:${number}`
        )
      );
    }


    keyboard.push(
      buttons
    );
  }


  // ----------------------------------------
  // کنترل‌ها
  // ----------------------------------------

  keyboard.push([

    button(
      game?.pencilMode
        ? "✏️ مداد: روشن"
        : "✏️ مداد: خاموش",
      "mode:pencil"
    ),

    button(
      "🧹 پاک کردن",
      "mode:erase"
    )

  ]);


  // ----------------------------------------
  // برگشت
  // ----------------------------------------

  keyboard.push([

    button(
      "↩️ خانه‌ها",
      "action:cells"
    ),

    button(
      "💡 راهنمایی",
      "action:hint"
    )

  ]);


  return {
    inline_keyboard:
      keyboard
  };
}


// ==========================================
// Keyboard انتخاب سختی
// ==========================================

export function buildDifficultyKeyboard() {

  return {

    inline_keyboard: [

      [

        button(
          "🟢 آسان",
          "difficulty:easy"
        ),

        button(
          "🟡 متوسط",
          "difficulty:medium"
        )

      ],

      [

        button(
          "🔴 سخت",
          "difficulty:hard"
        ),

        button(
          "🟣 خیلی سخت",
          "difficulty:expert"
        )

      ],

      [

        button(
          "⚫ استاد",
          "difficulty:master"
        )

      ]

    ]

  };
}


// ==========================================
// Keyboard پایان بازی
// ==========================================

export function buildFinishedKeyboard() {

  return {

    inline_keyboard: [

      [

        button(
          "🔄 بازی جدید",
          "action:new"
        )

      ],

      [

        button(
          "💡 راهنمایی",
          "action:hint"
        )

      ]

    ]

  };
        }
