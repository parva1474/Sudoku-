// ==========================================
// src/sudoku.js
// Sudoku Generator + Solver + Hint
// Cloudflare Workers compatible
// ==========================================


// ==========================================
// تنظیمات سختی
// ==========================================

const DIFFICULTY_CONFIG = {

  easy: {
    clues: 45
  },

  medium: {
    clues: 38
  },

  hard: {
    clues: 32
  },

  expert: {
    clues: 27
  },

  master: {
    clues: 23
  }

};


// ==========================================
// ابزار تصادفی
// ==========================================

function randomInt(
  min,
  max
) {

  return Math.floor(
    Math.random() *
    (max - min + 1)
  ) + min;
}


// ==========================================
// Shuffle
// ==========================================

function shuffle(
  array
) {

  const result =
    [...array];


  for (
    let i = result.length - 1;
    i > 0;
    i--
  ) {

    const j =
      randomInt(
        0,
        i
      );


    [
      result[i],
      result[j]
    ] = [
      result[j],
      result[i]
    ];
  }


  return result;
}


// ==========================================
// بررسی امکان قرار دادن عدد
// ==========================================

function isSafe(
  board,
  index,
  number
) {

  const row =
    Math.floor(
      index / 9
    );

  const col =
    index % 9;


  // ----------------------------------------
  // سطر
  // ----------------------------------------

  for (
    let c = 0;
    c < 9;
    c++
  ) {

    const i =
      row * 9 + c;


    if (
      i !== index &&
      board[i] === number
    ) {

      return false;
    }
  }


  // ----------------------------------------
  // ستون
  // ----------------------------------------

  for (
    let r = 0;
    r < 9;
    r++
  ) {

    const i =
      r * 9 + col;


    if (
      i !== index &&
      board[i] === number
    ) {

      return false;
    }
  }


  // ----------------------------------------
  // بلوک ۳×۳
  // ----------------------------------------

  const startRow =
    Math.floor(row / 3) * 3;

  const startCol =
    Math.floor(col / 3) * 3;


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

      const i =
        r * 9 + c;


      if (
        i !== index &&
        board[i] === number
      ) {

        return false;
      }
    }
  }


  return true;
}


// ==========================================
// ساخت جدول کامل
// ==========================================

function fillBoard(
  board
) {

  // ----------------------------------------
  // پیدا کردن خانه خالی
  // ----------------------------------------

  let emptyIndex =
    -1;


  for (
    let i = 0;
    i < 81;
    i++
  ) {

    if (
      board[i] === null
    ) {

      emptyIndex =
        i;

      break;
    }
  }


  // جدول کامل شده

  if (
    emptyIndex === -1
  ) {

    return true;
  }


  const numbers =
    shuffle([
      1, 2, 3,
      4, 5, 6,
      7, 8, 9
    ]);


  for (
    const number of numbers
  ) {

    if (
      !isSafe(
        board,
        emptyIndex,
        number
      )
    ) {

      continue;
    }


    board[emptyIndex] =
      number;


    if (
      fillBoard(board)
    ) {

      return true;
    }


    board[emptyIndex] =
      null;
  }


  return false;
}


// ==========================================
// حل Sudoku
// ==========================================

function solveBoard(
  board
) {

  let bestIndex =
    -1;

  let bestCandidates =
    null;


  // ----------------------------------------
  // MRV
  // پیدا کردن خانه با کمترین کاندیدا
  // ----------------------------------------

  for (
    let i = 0;
    i < 81;
    i++
  ) {

    if (
      board[i] !== null
    ) {

      continue;
    }


    const candidates =
      getCandidates(
        board,
        i
      );


    if (
      candidates.length === 0
    ) {

      return false;
    }


    if (
      bestCandidates === null ||
      candidates.length <
        bestCandidates.length
    ) {

      bestIndex =
        i;

      bestCandidates =
        candidates;


      if (
        candidates.length === 1
      ) {

        break;
      }
    }
  }


  // حل شد

  if (
    bestIndex === -1
  ) {

    return true;
  }


  for (
    const number of bestCandidates
  ) {

    board[bestIndex] =
      number;


    if (
      solveBoard(board)
    ) {

      return true;
    }


    board[bestIndex] =
      null;
  }


  return false;
}


// ==========================================
// کاندیداهای یک خانه
// ==========================================

function getCandidates(
  board,
  index
) {

  const used =
    new Set();


  const row =
    Math.floor(
      index / 9
    );

  const col =
    index % 9;


  // سطر

  for (
    let c = 0;
    c < 9;
    c++
  ) {

    const value =
      board[
        row * 9 + c
      ];


    if (
      value !== null &&
      value !== undefined
    ) {

      used.add(value);
    }
  }


  // ستون

  for (
    let r = 0;
    r < 9;
    r++
  ) {

    const value =
      board[
        r * 9 + col
      ];


    if (
      value !== null &&
      value !== undefined
    ) {

      used.add(value);
    }
  }


  // بلوک

  const startRow =
    Math.floor(row / 3) * 3;

  const startCol =
    Math.floor(col / 3) * 3;


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

      const value =
        board[
          r * 9 + c
        ];


      if (
        value !== null &&
        value !== undefined
      ) {

        used.add(value);
      }
    }
  }


  const candidates =
    [];


  for (
    let number = 1;
    number <= 9;
    number++
  ) {

    if (
      !used.has(number)
    ) {

      candidates.push(
        number
      );
    }
  }


  return candidates;
}


// ==========================================
// تعداد راه‌حل‌ها
// برای اطمینان از Unique بودن
// ==========================================

function countSolutions(
  board,
  limit = 2
) {

  let count =
    0;


  function search() {

    if (
      count >= limit
    ) {

      return;
    }


    let bestIndex =
      -1;

    let bestCandidates =
      null;


    for (
      let i = 0;
      i < 81;
      i++
    ) {

      if (
        board[i] !== null
      ) {

        continue;
      }


      const candidates =
        getCandidates(
          board,
          i
        );


      if (
        candidates.length === 0
      ) {

        return;
      }


      if (
        bestCandidates === null ||
        candidates.length <
          bestCandidates.length
      ) {

        bestIndex =
          i;

        bestCandidates =
          candidates;


        if (
          candidates.length === 1
        ) {

          break;
        }
      }
    }


    // یک راه‌حل پیدا شد

    if (
      bestIndex === -1
    ) {

      count++;
      return;
    }


    for (
      const number of bestCandidates
    ) {

      board[bestIndex] =
        number;


      search();


      board[bestIndex] =
        null;


      if (
        count >= limit
      ) {

        return;
      }
    }
  }


  search();

  return count;
}


// ==========================================
// ساخت Puzzle
// ==========================================

function makePuzzle(
  solution,
  clues
) {

  const puzzle =
    [...solution];


  const indexes =
    shuffle(
      Array.from(
        { length: 81 },
        (_, i) => i
      )
    );


  let removed =
    0;


  const targetRemove =
    81 - clues;


  for (
    const index of indexes
  ) {

    if (
      removed >= targetRemove
    ) {

      break;
    }


    const backup =
      puzzle[index];


    puzzle[index] =
      null;


    // --------------------------------------
    // بررسی Unique بودن
    // --------------------------------------

    const test =
      [...puzzle];


    const solutions =
      countSolutions(
        test,
        2
      );


    if (
      solutions === 1
    ) {

      removed++;

    } else {

      puzzle[index] =
        backup;
    }
  }


  return puzzle;
}


// ==========================================
// Generate Sudoku
// ==========================================

export function generateSudoku(
  difficulty = "medium"
) {

  const config =
    DIFFICULTY_CONFIG[
      difficulty
    ] ||
    DIFFICULTY_CONFIG.medium;


  // ----------------------------------------
  // جدول کامل
  // ----------------------------------------

  const solution =
    Array(
      81
    ).fill(null);


  const success =
    fillBoard(
      solution
    );


  if (!success) {

    throw new Error(
      "Unable to generate Sudoku solution."
    );
  }


  // ----------------------------------------
  // Puzzle
  // ----------------------------------------

  const puzzle =
    makePuzzle(
      solution,
      config.clues
    );


  return {

    puzzle,

    solution,

    difficulty,

    clues:
      puzzle.filter(
        value =>
          value !== null
      ).length
  };
}


// ==========================================
// Hint
// ==========================================

export function getHint(
  board,
  solution
) {

  if (
    !Array.isArray(board) ||
    !Array.isArray(solution) ||
    board.length !== 81 ||
    solution.length !== 81
  ) {

    return null;
  }


  // ----------------------------------------
  // ابتدا خانه انتخاب‌شده را بررسی کن
  // ----------------------------------------

  for (
    let i = 0;
    i < 81;
    i++
  ) {

    if (
      board[i] === null ||
      board[i] === undefined
    ) {

      return {

        index:
          i,

        number:
          solution[i]
      };
    }
  }


  return null;
}


// ==========================================
// بررسی اعتبار جدول
// ==========================================

export function isValidBoard(
  board
) {

  if (
    !Array.isArray(board) ||
    board.length !== 81
  ) {

    return false;
  }


  for (
    let i = 0;
    i < 81;
    i++
  ) {

    const value =
      board[i];


    if (
      value === null ||
      value === undefined
    ) {

      continue;
    }


    if (
      !isValidNumber(value)
    ) {

      return false;
    }


    if (
      !isSafe(
        board,
        i,
        value
      )
    ) {

      return false;
    }
  }


  return true;
}


// ==========================================
// بررسی عدد
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
// تعداد خانه‌های پر
// ==========================================

export function countFilled(
  board
) {

  if (
    !Array.isArray(board)
  ) {

    return 0;
  }


  return board.filter(
    value =>
      value !== null &&
      value !== undefined
  ).length;
}


// ==========================================
// تعداد خانه‌های خالی
// ==========================================

export function countEmpty(
  board
) {

  return (
    81 -
    countFilled(board)
  );
}
