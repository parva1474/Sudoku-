// ==========================================
// src/game.js
// Sudoku Game Logic
// ==========================================


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

  if (
    !game ||
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
// تغییر حالت Pencil
// ==========================================

export function togglePencilMode(
  game
) {

  if (!game) {
    return false;
  }


  game.pencilMode =
    !Boolean(
      game.pencilMode
    );

  game.updatedAt =
    Date.now();

  return game.pencilMode;
}


// ==========================================
// بررسی خانه ثابت
// ==========================================

function isFixedCell(
  game,
  index
) {

  return (
    Array.isArray(game.puzzle) &&
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
// Toggle Pencil Note
// ==========================================

export function toggleNote(
  game,
  number
) {

  if (!game) {

    return {
      ok: false,
      message: "بازی پیدا نشد."
    };
  }


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
      message: "اول یک خانه انتخاب کن."
    };
  }


  if (
    game.status !== "playing"
  ) {

    return {
      ok: false,
      message: "این بازی تمام شده است."
    };
  }


  if (
    isFixedCell(
      game,
      index
    )
  ) {

    return {
      ok: false,
      message: "🔒 این خانه ثابت است."
    };
  }


  if (
    game.board[index] !== null &&
    game.board[index] !== undefined
  ) {

    return {
      ok: false,
      message: "این خانه عدد دارد."
    };
  }


  if (
    !isValidNumber(number)
  ) {

    return {
      ok: false,
      message: "عدد نامعتبر است."
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


  // ----------------------------------------
  // حذف یادداشت
  // ----------------------------------------

  if (
    position !== -1
  ) {

    game.notes[index].splice(
      position,
      1
    );

    game.updatedAt =
      Date.now();

    return {
      ok: true,
      added: false
    };
  }


  // ----------------------------------------
  // اضافه کردن یادداشت
  // ----------------------------------------

  game.notes[index].push(
    number
  );


  game.notes[index].sort(
    (a, b) => a - b
  );


  game.updatedAt =
    Date.now();


  return {
    ok: true,
    added: true
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

  if (!game) {

    return {
      ok: false,
      message: "بازی پیدا نشد."
    };
  }


  if (
    game.status !== "playing"
  ) {

    return {
      ok: false,
      message: "این بازی تمام شده است."
    };
  }


  if (
    !Number.isInteger(index) ||
    index < 0 ||
    index >= 81
  ) {

    return {
      ok: false,
      message: "خانه نامعتبر است."
    };
  }


  if (
    !isValidNumber(number)
  ) {

    return {
      ok: false,
      message: "عدد نامعتبر است."
    };
  }


  if (
    isFixedCell(
      game,
      index
    )
  ) {

    return {
      ok: false,
      message: "🔒 این خانه ثابت است."
    };
  }


  // ----------------------------------------
  // عدد درست نیست
  // ----------------------------------------

  if (
    game.solution[index] !== number
  ) {

    game.mistakes =
      Number(
        game.mistakes || 0
      ) + 1;

    game.updatedAt =
      Date.now();


    return {
      ok: true,
      mistake: true,
      won: false
    };
  }


  // ----------------------------------------
  // عدد صحیح
  // ----------------------------------------

  game.board[index] =
    number;


  // یادداشت‌های همان خانه پاک شوند

  game.notes[index] =
    [];


  // ----------------------------------------
  // حذف این عدد از Pencil
  // خانه‌های مرتبط
  // ----------------------------------------

  removeNumberFromRelatedNotes(
    game,
    index,
    number
  );


  game.updatedAt =
    Date.now();


  // ----------------------------------------
  // بررسی برد
  // ----------------------------------------

  if (
    isSolved(game)
  ) {

    game.status =
      "won";

    game.updatedAt =
      Date.now();


    return {
      ok: true,
      mistake: false,
      won: true
    };
  }


  return {
    ok: true,
    mistake: false,
    won: false
  };
}


// ==========================================
// پاک کردن عدد
// ==========================================

export function eraseNumber(
  game,
  index
) {

  if (!game) {

    return {
      ok: false,
      message: "بازی پیدا نشد."
    };
  }


  if (
    game.status !== "playing"
  ) {

    return {
      ok: false,
      message: "این بازی تمام شده است."
    };
  }


  if (
    !Number.isInteger(index) ||
    index < 0 ||
    index >= 81
  ) {

    return {
      ok: false,
      message: "خانه نامعتبر است."
    };
  }


  if (
    isFixedCell(
      game,
      index
    )
  ) {

    return {
      ok: false,
      message: "🔒 این خانه ثابت است."
    };
  }


  const oldValue =
    game.board[index];


  // اگر خانه خالی است

  if (
    oldValue === null ||
    oldValue === undefined
  ) {

    return {
      ok: false,
      message: "این خانه خالی است."
    };
  }


  game.board[index] =
    null;


  game.updatedAt =
    Date.now();


  return {
    ok: true
  };
}


// ==========================================
// حذف عدد از یادداشت‌های مرتبط
// ==========================================

function removeNumberFromRelatedNotes(
  game,
  index,
  number
) {

  const row =
    Math.floor(
      index / 9
    );

  const col =
    index % 9;


  const blockRow =
    Math.floor(
      row / 3
    );

  const blockCol =
    Math.floor(
      col / 3
    );


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
      Math.floor(
        i / 9
      );

    const c =
      i % 9;


    const sameRow =
      r === row;


    const sameCol =
      c === col;


    const sameBlock =
      Math.floor(r / 3) === blockRow &&
      Math.floor(c / 3) === blockCol;


    if (
      sameRow ||
      sameCol ||
      sameBlock
    ) {

      if (
        Array.isArray(
          game.notes[i]
        )
      ) {

        game.notes[i] =
          game.notes[i].filter(
            n => n !== number
          );
      }
    }
  }
}


// ==========================================
// بررسی کامل شدن جدول
// ==========================================

function isSolved(
  game
) {

  if (
    !Array.isArray(game.board) ||
    !Array.isArray(game.solution)
  ) {

    return false;
  }


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
// درصد پیشرفت
// ==========================================

export function getProgress(
  game
) {

  if (
    !game ||
    !Array.isArray(game.board)
  ) {

    return 0;
  }


  let filled =
    0;


  for (
    const value of game.board
  ) {

    if (
      value !== null &&
      value !== undefined
    ) {

      filled++;
    }
  }


  return Math.round(
    (
      filled / 81
    ) * 100
  );
}


// ==========================================
// Hint
// ==========================================

export function applyHint(
  game,
  selectedCell,
  hintIndex,
  hintNumber
) {

  if (!game) {

    return {
      ok: false,
      message: "بازی پیدا نشد.",
      won: false
    };
  }


  if (
    game.status !== "playing"
  ) {

    return {
      ok: false,
      message: "این بازی تمام شده است.",
      won: false
    };
  }


  let index =
    Number(
      hintIndex
    );


  // ----------------------------------------
  // اگر Hint خانه مشخصی نداشت
  // ----------------------------------------

  if (
    !Number.isInteger(index) ||
    index < 0 ||
    index >= 81
  ) {

    index =
      Number(
        selectedCell
      );
  }


  // ----------------------------------------
  // اگر خانه انتخاب شده معتبر نبود
  // ----------------------------------------

  if (
    !Number.isInteger(index) ||
    index < 0 ||
    index >= 81
  ) {

    return {
      ok: false,
      message: "اول یک خانه انتخاب کن.",
      won: false
    };
  }


  if (
    isFixedCell(
      game,
      index
    )
  ) {

    return {
      ok: false,
      message: "این خانه از قبل پر است.",
      won: false
    };
  }


  if (
    game.board[index] !== null &&
    game.board[index] !== undefined
  ) {

    return {
      ok: false,
      message: "این خانه قبلاً پر شده است.",
      won: false
    };
  }


  const correctNumber =
    Number(
      hintNumber
    );


  if (
    !isValidNumber(correctNumber)
  ) {

    return {
      ok: false,
      message: "راهنمایی نامعتبر است.",
      won: false
    };
  }


  game.board[index] =
    correctNumber;


  game.notes[index] =
    [];


  removeNumberFromRelatedNotes(
    game,
    index,
    correctNumber
  );


  game.hints =
    Number(
      game.hints || 0
    ) + 1;


  game.updatedAt =
    Date.now();


  if (
    isSolved(game)
  ) {

    game.status =
      "won";


    return {
      ok: true,
      won: true,
      index,
      number: correctNumber,
      message:
        "🎉 جدول کامل شد."
    };
  }


  return {
    ok: true,
    won: false,
    index,
    number: correctNumber,
    message:
      `💡 عدد ${correctNumber} در خانه قرار گرفت.`
  };
}
