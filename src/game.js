// ==========================================
// src/game.js
// Sudoku Game Engine
// ==========================================

const MAX_MISTAKES = 3;


// ==========================================
// ساخت بازی جدید
// ==========================================

export function newGame(
  difficulty,
  puzzle,
  solution
) {

  const cleanPuzzle =
    Array.isArray(puzzle)
      ? [...puzzle]
      : [];

  const cleanSolution =
    Array.isArray(solution)
      ? [...solution]
      : [];

  if (
    cleanPuzzle.length !== 81 ||
    cleanSolution.length !== 81
  ) {
    throw new Error(
      "Invalid Sudoku puzzle or solution."
    );
  }

  return {

    difficulty,

    puzzle:
      cleanPuzzle,

    solution:
      cleanSolution,

    board:
      [...cleanPuzzle],

    notes:
      Array.from(
        { length: 81 },
        () => []
      ),

    selectedCell:
      -1,

    pencilMode:
      false,

    mistakes:
      0,

    hints:
      0,

    status:
      "playing",

    createdAt:
      Date.now(),

    updatedAt:
      Date.now()
  };
}


// ==========================================
// انتخاب خانه
// ==========================================

export function selectCell(
  game,
  index
) {

  index =
    Number(index);

  if (
    !Number.isInteger(index) ||
    index < 0 ||
    index >= 81
  ) {
    return false;
  }

  game.selectedCell =
    index;

  game.updatedAt =
    Date.now();

  return true;
}


// ==========================================
// تغییر حالت مداد
// ==========================================

export function togglePencilMode(
  game
) {

  game.pencilMode =
    !game.pencilMode;

  game.updatedAt =
    Date.now();

  return game.pencilMode;
}


// ==========================================
// بررسی خانه ثابت
// ==========================================

function isFixed(
  game,
  index
) {

  return (
    game.puzzle[index] !== null &&
    game.puzzle[index] !== undefined
  );
}


// ==========================================
// بررسی عدد معتبر
// ==========================================

function isValidNumber(
  number
) {

  return (
    Number.isInteger(number) &&
    number >= 1 &&
    number <= 9
  );
}


// ==========================================
// مداد
// ==========================================

export function toggleNote(
  game,
  number
) {

  const index =
    Number(
      game.selectedCell
    );

  if (
    !Number.isInteger(index) ||
    index < 0 ||
    index >= 81
  ) {

    return {
      ok: false,
      message:
        "اول یک خانه انتخاب کن."
    };
  }

  if (
    isFixed(game, index)
  ) {

    return {
      ok: false,
      message:
        "🔒 این خانه ثابت است."
    };
  }

  if (
    !isValidNumber(number)
  ) {

    return {
      ok: false,
      message:
        "عدد نامعتبر است."
    };
  }

  if (
    game.board[index] !== null &&
    game.board[index] !== undefined
  ) {

    return {
      ok: false,
      message:
        "ابتدا عدد خانه را پاک کن."
    };
  }

  if (
    !Array.isArray(
      game.notes[index]
    )
  ) {

    game.notes[index] =
      [];
  }

  const position =
    game.notes[index].indexOf(
      number
    );

  let added;

  if (
    position === -1
  ) {

    game.notes[index].push(
      number
    );

    game.notes[index].sort(
      (a, b) => a - b
    );

    added =
      true;

  } else {

    game.notes[index].splice(
      position,
      1
    );

    added =
      false;
  }

  game.updatedAt =
    Date.now();

  return {
    ok: true,
    added
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

  index =
    Number(index);

  number =
    Number(number);

  if (
    game.status !== "playing"
  ) {

    return {
      ok: false,
      message:
        "بازی تمام شده است."
    };
  }

  if (
    !Number.isInteger(index) ||
    index < 0 ||
    index >= 81
  ) {

    return {
      ok: false,
      message:
        "خانه نامعتبر است."
    };
  }

  if (
    !isValidNumber(number)
  ) {

    return {
      ok: false,
      message:
        "عدد نامعتبر است."
    };
  }

  if (
    isFixed(game, index)
  ) {

    return {
      ok: false,
      message:
        "🔒 این خانه ثابت است."
    };
  }

  // اگر عدد صحیح بود
  if (
    number === game.solution[index]
  ) {

    game.board[index] =
      number;

    game.notes[index] =
      [];

    removeNumberFromRelatedNotes(
      game,
      index,
      number
    );

    game.updatedAt =
      Date.now();

    const won =
      checkWon(game);

    if (won) {

      game.status =
        "won";
    }

    return {
      ok: true,
      correct: true,
      won
    };
  }


  // جواب غلط
  game.mistakes =
    Number(game.mistakes || 0) + 1;

  game.updatedAt =
    Date.now();


  if (
    game.mistakes >= MAX_MISTAKES
  ) {

    game.status =
      "lost";

    return {
      ok: false,
      correct: false,
      mistake: true,
      lost: true,
      message:
        "❌ تعداد خطاها به حد مجاز رسید."
    };
  }

  return {
    ok: false,
    correct: false,
    mistake: true,
    lost: false,
    message:
      "❌ عدد اشتباه است."
  };
}


// ==========================================
// پاک کردن عدد
// ==========================================

export function eraseNumber(
  game,
  index
) {

  index =
    Number(index);

  if (
    !Number.isInteger(index) ||
    index < 0 ||
    index >= 81
  ) {

    return {
      ok: false,
      message:
        "خانه نامعتبر است."
    };
  }

  if (
    isFixed(game, index)
  ) {

    return {
      ok: false,
      message:
        "🔒 این خانه ثابت است."
    };
  }

  game.board[index] =
    null;

  game.notes[index] =
    [];

  game.updatedAt =
    Date.now();

  return {
    ok: true
  };
}


// ==========================================
// پیشرفت
// ==========================================

export function getProgress(
  game
) {

  let fixed = 0;
  let filled = 0;

  for (
    let i = 0;
    i < 81;
    i++
  ) {

    if (
      game.puzzle[i] !== null &&
      game.puzzle[i] !== undefined
    ) {
      fixed++;
    }

    if (
      game.board[i] !== null &&
      game.board[i] !== undefined
    ) {
      filled++;
    }
  }

  const totalToFill =
    81 - fixed;

  if (
    totalToFill <= 0
  ) {
    return 100;
  }

  const playerFilled =
    filled - fixed;

  return Math.max(
    0,
    Math.min(
      100,
      Math.floor(
        (
          playerFilled /
          totalToFill
        ) * 100
      )
    )
  );
}


// ==========================================
// بررسی برنده شدن
// ==========================================

function checkWon(
  game
) {

  for (
    let i = 0;
    i < 81;
    i++
  ) {

    if (
      game.board[i] !==
      game.solution[i]
    ) {

      return false;
    }
  }

  return true;
}


// ==========================================
// راهنمایی
// ==========================================

export function applyHint(
  game,
  selectedCell,
  hintIndex,
  hintNumber
) {

  let index =
    Number(hintIndex);

  const selected =
    Number(selectedCell);


  // اگر خانه انتخاب شده معتبر باشد
  // اولویت با همان خانه است.
  if (
    Number.isInteger(selected) &&
    selected >= 0 &&
    selected < 81 &&
    !isFixed(game, selected) &&
    (
      game.board[selected] === null ||
      game.board[selected] === undefined
    )
  ) {

    index =
      selected;
  }


  if (
    !Number.isInteger(index) ||
    index < 0 ||
    index >= 81
  ) {

    return {
      ok: false,
      message:
        "خانه مناسبی برای راهنمایی پیدا نشد."
    };
  }


  if (
    isFixed(game, index)
  ) {

    return {
      ok: false,
      message:
        "این خانه از قبل ثابت است."
    };
  }


  if (
    game.board[index] !== null &&
    game.board[index] !== undefined
  ) {

    return {
      ok: false,
      message:
        "این خانه قبلاً پر شده است."
    };
  }


  game.board[index] =
    hintNumber;

  game.notes[index] =
    [];

  game.hints =
    Number(game.hints || 0) + 1;

  removeNumberFromRelatedNotes(
    game,
    index,
    hintNumber
  );

  game.updatedAt =
    Date.now();


  const won =
    checkWon(game);

  if (won) {

    game.status =
      "won";
  }


  return {
    ok: true,
    won,
    index,
    number:
      hintNumber,
    message:
      `💡 عدد ${hintNumber} در خانه قرار گرفت.`
  };
}


// ==========================================
// حذف مداد مرتبط
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


  // سطر
  for (
    let c = 0;
    c < 9;
    c++
  ) {

    removeNote(
      game,
      row * 9 + c,
      number
    );
  }


  // ستون
  for (
    let r = 0;
    r < 9;
    r++
  ) {

    removeNote(
      game,
      r * 9 + col,
      number
    );
  }


  // بلوک
  const blockRow =
    Math.floor(row / 3) * 3;

  const blockCol =
    Math.floor(col / 3) * 3;

  for (
    let r = blockRow;
    r < blockRow + 3;
    r++
  ) {

    for (
      let c = blockCol;
      c < blockCol + 3;
      c++
    ) {

      removeNote(
        game,
        r * 9 + c,
        number
      );
    }
  }
}


// ==========================================
// حذف یک یادداشت
// ==========================================

function removeNote(
  game,
  index,
  number
) {

  if (
    !Array.isArray(
      game.notes?.[index]
    )
  ) {
    return;
  }

  const position =
    game.notes[index].indexOf(
      number
    );

  if (
    position !== -1
  ) {

    game.notes[index].splice(
      position,
      1
    );
  }
}
