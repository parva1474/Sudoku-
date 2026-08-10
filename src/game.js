// ==========================================
// src/game.js
// منطق بازی Sudoku
// ==========================================

import {
  createPuzzle,
  isValidMove,
  isSolved,
  getCandidates
} from "./sudoku.js";

// ==========================================
// ساخت بازی جدید
// ==========================================

export function newGame(difficulty = "medium") {
  const { puzzle, solution } =
    createPuzzle(difficulty);

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

export function selectCell(game, index) {
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
// تغییر حالت مداد
// ==========================================

export function togglePencilMode(game) {
  game.pencilMode =
    !game.pencilMode;

  return game.pencilMode;
}

// ==========================================
// بررسی اینکه خانه قابل ویرایش است یا نه
// ==========================================

export function isEditableCell(
  game,
  index
) {
  if (
    index < 0 ||
    index >= 81
  ) {
    return false;
  }

  // خانه‌ای که از ابتدا پر بوده
  if (
    game.puzzle[index] !== null
  ) {
    return false;
  }

  return true;
}

// ==========================================
// افزودن / حذف Pencil
// ==========================================

export function toggleNote(
  game,
  index,
  number
) {
  if (
    !isEditableCell(game, index)
  ) {
    return {
      ok: false,
      message: "این خانه قابل ویرایش نیست."
    };
  }

  if (
    game.board[index] !== null
  ) {
    return {
      ok: false,
      message: "این خانه عدد دارد."
    };
  }

  if (
    !Number.isInteger(number) ||
    number < 1 ||
    number > 9
  ) {
    return {
      ok: false,
      message: "عدد نامعتبر است."
    };
  }

  const candidates =
    getCandidates(
      game.board,
      index
    );

  /*
   * اگر عدد از نظر قوانین Sudoku
   * اصلاً امکان‌پذیر نباشد،
   * داخل مداد قرار نمی‌گیرد.
   */

  if (
    !candidates.includes(number)
  ) {
    return {
      ok: false,
      message:
        `عدد ${number} در این خانه امکان‌پذیر نیست.`
    };
  }

  const notes =
    game.notes[index];

  const position =
    notes.indexOf(number);

  if (position === -1) {

    notes.push(number);

    notes.sort(
      (a, b) => a - b
    );

    return {
      ok: true,
      added: true
    };

  } else {

    notes.splice(
      position,
      1
    );

    return {
      ok: true,
      added: false
    };
  }
}

// ==========================================
// قرار دادن عدد واقعی
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
      message: "این بازی تمام شده است."
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
        "این خانه از ابتدا پر بوده و قابل تغییر نیست."
    };
  }

  if (
    !Number.isInteger(number) ||
    number < 1 ||
    number > 9
  ) {
    return {
      ok: false,
      message: "عدد نامعتبر است."
    };
  }

  /*
   * اگر عدد اشتباه باشد:
   * عدد وارد جدول نمی‌شود.
   * فقط تعداد اشتباهات افزایش می‌یابد.
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
        `❌ عدد ${number} برای این خانه صحیح نیست.`,
      mistakes:
        game.mistakes
    };
  }

  // عدد صحیح
  game.board[index] =
    number;

  // Pencilهای همان خانه پاک شوند
  game.notes[index] = [];

  // این عدد از Pencil خانه‌های مرتبط حذف شود
  removeNumberFromRelatedNotes(
    game,
    index,
    number
  );

  // بررسی برد
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
        "🎉 تبریک! Sudoku را کامل حل کردی.",
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
// پاک کردن عدد یک خانه
// ==========================================

export function eraseNumber(
  game,
  index
) {
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

  if (
    game.board[index] === null
  ) {
    return {
      ok: false,
      message:
        "این خانه خالی است."
    };
  }

  game.board[index] =
    null;

  return {
    ok: true
  };
}

// ==========================================
// حذف یک عدد از Pencilهای مرتبط
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

      game.notes[i] =
        game.notes[i].filter(
          value =>
            value !== number
        );
    }
  }
}

// ==========================================
// دریافت اطلاعات خانه
// ==========================================

export function getCellInfo(
  game,
  index
) {
  if (
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
      [...game.notes[index]],

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
// تعداد خانه‌های حل‌شده
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

  return Math.round(
    (count / 81) * 100
  );
}
