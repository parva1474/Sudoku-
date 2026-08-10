// ==========================================
// src/game.js
// منطق کامل بازی Sudoku
// ==========================================

import {
  createPuzzle,
  isValidMove,
  isSolved,
  getCandidates,
  extractHintMove
} from "./sudoku.js";

// ==========================================
// ساخت بازی جدید
// ==========================================

export function newGame(
  difficulty = "medium"
) {
  const {
    puzzle,
    solution
  } = createPuzzle(difficulty);

  return {
    puzzle: [...puzzle],

    solution: [...solution],

    board: [...puzzle],

    notes: Array.from(
      { length: 81 },
      () => []
    ),

    selectedCell: -1,

    difficulty,

    mistakes: 0,

    hints: 0,

    pencilMode: false,

    status: "playing",

    createdAt: Date.now()
  };
}

// ==========================================
// انتخاب خانه
// ==========================================

export function selectCell(
  game,
  index
) {
  if (
    !Number.isInteger(index) ||
    index < 0 ||
    index >= 81
  ) {
    return false;
  }

  game.selectedCell = index;

  return true;
}

// ==========================================
// روشن/خاموش کردن Pencil
// ==========================================

export function togglePencilMode(
  game
) {
  game.pencilMode =
    !game.pencilMode;

  return game.pencilMode;
}

// ==========================================
// آیا خانه قابل ویرایش است؟
// ==========================================

export function isEditableCell(
  game,
  index
) {
  if (
    !Number.isInteger(index) ||
    index < 0 ||
    index >= 81
  ) {
    return false;
  }

  /*
   * خانه‌ای که در Puzzle اولیه
   * عدد داشته باشد قفل است.
   */

  return (
    game.puzzle[index] === null
  );
}

// ==========================================
// Pencil
// ==========================================

export function toggleNote(
  game,
  index,
  number
) {
  if (
    game.status !== "playing"
  ) {
    return {
      ok: false,
      message:
        "این بازی تمام شده است."
    };
  }

  if (
    !isEditableCell(
      game,
      index
    )
  ) {
    return {
      ok: false,
      message:
        "این خانه قابل ویرایش نیست."
    };
  }

  if (
    !Number.isInteger(number) ||
    number < 1 ||
    number > 9
  ) {
    return {
      ok: false,
      message:
        "عدد نامعتبر است."
    };
  }

  /*
   * اگر خانه خودش عدد داشته باشد،
   * Pencil معنی ندارد.
   */

  if (
    game.board[index] !== null
  ) {
    return {
      ok: false,
      message:
        "ابتدا عدد خانه را پاک کن."
    };
  }

  /*
   * فقط عددهای منطقی را اجازه می‌دهیم.
   */

  const candidates =
    getCandidates(
      game.board,
      index
    );

  if (
    !candidates.includes(number)
  ) {
    return {
      ok: false,
      message:
        `❌ عدد ${number} در این خانه امکان‌پذیر نیست.`
    };
  }

  if (
    !Array.isArray(
      game.notes[index]
    )
  ) {
    game.notes[index] = [];
  }

  const position =
    game.notes[index].indexOf(
      number
    );

  if (position === -1) {

    game.notes[index].push(
      number
    );

    game.notes[index].sort(
      (a, b) => a - b
    );

    return {
      ok: true,
      added: true
    };
  }

  game.notes[index].splice(
    position,
    1
  );

  return {
    ok: true,
    added: false
  };
}

// ==========================================
// قرار دادن عدد
// ==========================================

export function putNumber(
  game,
  index,
  number
) {
  if (
    game.status !== "playing"
  ) {
    return {
      ok: false,
      message:
        "این بازی تمام شده است."
    };
  }

  if (
    !isEditableCell(
      game,
      index
    )
  ) {
    return {
      ok: false,
      message:
        "این خانه قابل تغییر نیست."
    };
  }

  if (
    !Number.isInteger(number) ||
    number < 1 ||
    number > 9
  ) {
    return {
      ok: false,
      message:
        "عدد نامعتبر است."
    };
  }

  /*
   * عدد باید با Solution مطابقت داشته باشد.
   */

  if (
    !isValidMove(
      game.solution,
      index,
      number
    )
  ) {

    game.mistakes++;

    return {
      ok: false,

      mistake: true,

      message:
        `❌ عدد ${number} اشتباه است.`,

      mistakes:
        game.mistakes
    };
  }

  // ----------------------------------------
  // عدد صحیح
  // ----------------------------------------

  game.board[index] =
    number;

  // Pencilهای همان خانه پاک شوند.

  game.notes[index] = [];

  // عدد قرار داده‌شده را از
  // Pencil خانه‌های مرتبط حذف کن.

  removeNumberFromRelatedNotes(
    game,
    index,
    number
  );

  // ----------------------------------------
  // بررسی پایان بازی
  // ----------------------------------------

  if (
    isSolved(
      game.board,
      game.solution
    )
  ) {

    game.status = "won";

    return {
      ok: true,

      won: true,

      message:
        "🎉 تبریک! Sudoku حل شد.",

      mistakes:
        game.mistakes
    };
  }

  return {
    ok: true,

    won: false,

    mistakes:
      game.mistakes
  };
}

// ==========================================
// پاک کردن عدد
// ==========================================

export function eraseNumber(
  game,
  index
) {
  if (
    game.status !== "playing"
  ) {
    return {
      ok: false,
      message:
        "این بازی تمام شده است."
    };
  }

  if (
    !isEditableCell(
      game,
      index
    )
  ) {
    return {
      ok: false,
      message:
        "این خانه قابل پاک کردن نیست."
    };
  }

  /*
   * اگر خالی است، کاری نکن.
   */

  if (
    game.board[index] === null
  ) {
    return {
      ok: false,
      message:
        "این خانه از قبل خالی است."
    };
  }

  game.board[index] =
    null;

  return {
    ok: true
  };
}

// ==========================================
// پاک کردن Pencilهای مرتبط
// ==========================================

function removeNumberFromRelatedNotes(
  game,
  index,
  number
) {
  const row =
    Math.floor(index / 9);

  const col =
    index % 9;

  const boxRow =
    Math.floor(row / 3) * 3;

  const boxCol =
    Math.floor(col / 3) * 3;

  for (
    let i = 0;
    i < 81;
    i++
  ) {

    if (
      i === index
    ) {
      continue;
    }

    const r =
      Math.floor(i / 9);

    const c =
      i % 9;

    const sameRow =
      r === row;

    const sameColumn =
      c === col;

    const sameBox =
      r >= boxRow &&
      r < boxRow + 3 &&
      c >= boxCol &&
      c < boxCol + 3;

    if (
      sameRow ||
      sameColumn ||
      sameBox
    ) {

      if (
        Array.isArray(
          game.notes[i]
        )
      ) {

        game.notes[i] =
          game.notes[i].filter(
            value =>
              value !== number
          );
      }
    }
  }
}

// ==========================================
// دریافت اطلاعات یک خانه
// ==========================================

export function getCellInfo(
  game,
  index
) {
  if (
    !Number.isInteger(index) ||
    index < 0 ||
    index >= 81
  ) {
    return null;
  }

  return {
    index,

    value:
      game.board[index],

    notes:
      Array.isArray(
        game.notes[index]
      )
        ? [...game.notes[index]]
        : [],

    fixed:
      game.puzzle[index] !== null,

    editable:
      game.puzzle[index] === null,

    candidates:
      getCandidates(
        game.board,
        index
      )
  };
}

// ==========================================
// تعداد خانه‌های پر
// ==========================================

export function getSolvedCount(
  game
) {
  let count = 0;

  for (
    let i = 0;
    i < 81;
    i++
  ) {

    if (
      game.board[i] !== null
    ) {
      count++;
    }
  }

  return count;
}

// ==========================================
// درصد پیشرفت
// ==========================================

export function getProgress(
  game
) {
  const count =
    getSolvedCount(game);

  /*
   * فقط خانه‌های خالی اولیه را
   * معیار پیشرفت قرار می‌دهیم.
   */

  let totalEmpty = 0;

  for (
    let i = 0;
    i < 81;
    i++
  ) {

    if (
      game.puzzle[i] === null
    ) {
      totalEmpty++;
    }
  }

  if (
    totalEmpty === 0
  ) {
    return 100;
  }

  let solvedEmpty = 0;

  for (
    let i = 0;
    i < 81;
    i++
  ) {

    if (
      game.puzzle[i] === null &&
      game.board[i] !== null
    ) {
      solvedEmpty++;
    }
  }

  return Math.round(
    (solvedEmpty / totalEmpty) * 100
  );
}

// ==========================================
// Hint
// ==========================================

export function applyHint(
  game,
  hintResult
) {
  if (
    game.status !== "playing"
  ) {
    return {
      ok: false,
      message:
        "این بازی تمام شده است."
    };
  }

  const move =
    extractHintMove(
      hintResult
    );

  /*
   * اگر کتابخانه حرکت مشخصی
   * برنگرداند، از Solution خودمان
   * برای پیدا کردن اولین خانه خالی
   * استفاده می‌کنیم.
   */

  let index = null;
  let value = null;

  if (
    move &&
    Number.isInteger(
      move.index
    ) &&
    Number.isInteger(
      move.value
    )
  ) {

    index =
      move.index;

    value =
      move.value;

  } else {

    for (
      let i = 0;
      i < 81;
      i++
    ) {

      if (
        game.board[i] === null &&
        game.solution[i] !== null
      ) {

        index = i;

        value =
          game.solution[i];

        break;
      }
    }
  }

  if (
    index === null ||
    value === null
  ) {

    return {
      ok: false,
      message:
        "💡 راهنمایی مناسبی پیدا نشد."
    };
  }

  /*
   * خانه باید قابل ویرایش باشد.
   */

  if (
    !isEditableCell(
      game,
      index
    )
  ) {

    return {
      ok: false,
      message:
        "💡 خانه مناسبی برای راهنمایی پیدا نشد."
    };
  }

  game.board[index] =
    value;

  game.notes[index] = [];

  removeNumberFromRelatedNotes(
    game,
    index,
    value
  );

  game.hints++;

  if (
    isSolved(
      game.board,
      game.solution
    )
  ) {

    game.status = "won";

    return {
      ok: true,

      won: true,

      index,

      value,

      message:
        `💡 راهنمایی: عدد ${value} در خانه ${index + 1} قرار گرفت.\n\n🎉 جدول هم کامل شد.`
    };
  }

  return {
    ok: true,

    won: false,

    index,

    value,

    message:
      `💡 راهنمایی: عدد ${value} در خانه ${index + 1} قرار گرفت.`
  };
    }
