// ==========================================
// src/sudoku.js
// Sudoku Generator + Solver
// 9×9 Standard Sudoku
// ==========================================

// ==========================================
// تنظیمات سختی
// ==========================================

const DIFFICULTY_CLUES = {

  easy: 45,

  medium: 38,

  hard: 32,

  expert: 28,

  master: 24
};

// ==========================================
// ساخت جدول جدید
// ==========================================

export function generateSudoku(
  difficulty = "medium"
) {

  const clues =
    DIFFICULTY_CLUES[
      difficulty
    ] ||
    DIFFICULTY_CLUES.medium;

  // ----------------------------------------
  // ساخت جدول کامل
  // ----------------------------------------

  const solution =
    createSolvedBoard();

  // ----------------------------------------
  // ساخت Puzzle
  // ----------------------------------------

  const puzzle =
    [...solution];

  const cellsToRemove =
    81 - clues;

  const positions =
    Array.from(
      { length: 81 },
      (_, i) => i
    );

  shuffle(
    positions
  );

  for (
    let i = 0;
    i < cellsToRemove;
    i++
  ) {

    puzzle[
      positions[i]
    ] = null;
  }

  return {

    puzzle,

    solution
  };
}

// ==========================================
// ساخت جدول حل‌شده
// ==========================================

function createSolvedBoard() {

  const board =
    Array(81).fill(null);

  if (
    fillBoard(
      board
    )
  ) {

    return board;
  }

  // این حالت عملاً نباید رخ دهد

  throw new Error(
    "Unable to generate Sudoku solution."
  );
}

// ==========================================
// Backtracking
// ==========================================

function fillBoard(
  board
) {

  const index =
    findEmptyCell(
      board
    );

  if (
    index === -1
  ) {

    return true;
  }

  const numbers =
    shuffle(
      [1, 2, 3, 4, 5, 6, 7, 8, 9]
    );

  for (
    const number of numbers
  ) {

    if (
      canPlace(
        board,
        index,
        number
      )
    ) {

      board[index] =
        number;

      if (
        fillBoard(
          board
        )
      ) {

        return true;
      }

      board[index] =
        null;
    }
  }

  return false;
}

// ==========================================
// پیدا کردن خانه خالی
// ==========================================

function findEmptyCell(
  board
) {

  for (
    let i = 0;
    i < 81;
    i++
  ) {

    if (
      board[i] === null
    ) {

      return i;
    }
  }

  return -1;
}

// ==========================================
// بررسی امکان قرار دادن عدد
// ==========================================

function canPlace(
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

    if (
      board[
        row * 9 + c
      ] === number
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

    if (
      board[
        r * 9 + col
      ] === number
    ) {

      return false;
    }
  }

  // ----------------------------------------
  // بلوک 3×3
  // ----------------------------------------

  const blockRow =
    Math.floor(
      row / 3
    ) * 3;

  const blockCol =
    Math.floor(
      col / 3
    ) * 3;

  for (
    let r = 0;
    r < 3;
    r++
  ) {

    for (
      let c = 0;
      c < 3;
      c++
    ) {

      if (
        board[
          (blockRow + r) * 9 +
          (blockCol + c)
        ] === number
      ) {

        return false;
      }
    }
  }

  return true;
}

// ==========================================
// Shuffle
// ==========================================

function shuffle(
  array
) {

  for (
    let i = array.length - 1;
    i > 0;
    i--
  ) {

    const j =
      Math.floor(
        Math.random() *
        (i + 1)
      );

    [
      array[i],
      array[j]
    ] = [
      array[j],
      array[i]
    ];
  }

  return array;
}

// ==========================================
// بررسی معتبر بودن جدول
// ==========================================

export function isValidSudoku(
  board
) {

  if (
    !Array.isArray(board) ||
    board.length !== 81
  ) {

    return false;
  }

  // ----------------------------------------
  // سطرها
  // ----------------------------------------

  for (
    let row = 0;
    row < 9;
    row++
  ) {

    const seen =
      new Set();

    for (
      let col = 0;
      col < 9;
      col++
    ) {

      const value =
        board[
          row * 9 + col
        ];

      if (
        value === null
      ) {

        continue;
      }

      if (
        !Number.isInteger(value) ||
        value < 1 ||
        value > 9
      ) {

        return false;
      }

      if (
        seen.has(value)
      ) {

        return false;
      }

      seen.add(value);
    }
  }

  // ----------------------------------------
  // ستون‌ها
  // ----------------------------------------

  for (
    let col = 0;
    col < 9;
    col++
  ) {

    const seen =
      new Set();

    for (
      let row = 0;
      row < 9;
      row++
    ) {

      const value =
        board[
          row * 9 + col
        ];

      if (
        value === null
      ) {

        continue;
      }

      if (
        seen.has(value)
      ) {

        return false;
      }

      seen.add(value);
    }
  }

  // ----------------------------------------
  // بلوک‌ها
  // ----------------------------------------

  for (
    let blockRow = 0;
    blockRow < 3;
    blockRow++
  ) {

    for (
      let blockCol = 0;
      blockCol < 3;
      blockCol++
    ) {

      const seen =
        new Set();

      for (
        let r = 0;
        r < 3;
        r++
      ) {

        for (
          let c = 0;
          c < 3;
          c++
        ) {

          const value =
            board[
              (blockRow * 3 + r) * 9 +
              (blockCol * 3 + c)
            ];

          if (
            value === null
          ) {

            continue;
          }

          if (
            seen.has(value)
          ) {

            return false;
          }

          seen.add(value);
        }
      }
    }
  }

  return true;
}

// ==========================================
// حل Sudoku
// ==========================================

export function solveSudoku(
  input
) {

  if (
    !Array.isArray(input) ||
    input.length !== 81
  ) {

    return null;
  }

  const board =
    [...input];

  if (
    !isValidSudoku(
      board
    )
  ) {

    return null;
  }

  if (
    solveBoard(
      board
    )
  ) {

    return board;
  }

  return null;
}

// ==========================================
// Solver داخلی
// ==========================================

function solveBoard(
  board
) {

  const index =
    findEmptyCell(
      board
    );

  if (
    index === -1
  ) {

    return true;
  }

  for (
    let number = 1;
    number <= 9;
    number++
  ) {

    if (
      canPlace(
        board,
        index,
        number
      )
    ) {

      board[index] =
        number;

      if (
        solveBoard(
          board
        )
      ) {

        return true;
      }

      board[index] =
        null;
    }
  }

  return false;
}

// ==========================================
// Hint
// ==========================================

export function getHint(
  board,
  solution = null
) {

  if (
    !Array.isArray(board) ||
    board.length !== 81
  ) {

    return null;
  }

  // ----------------------------------------
  // اگر solution داده شده باشد
  // ----------------------------------------

  if (
    Array.isArray(solution) &&
    solution.length === 81
  ) {

    for (
      let i = 0;
      i < 81;
      i++
    ) {

      if (
        board[i] === null
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

  // ----------------------------------------
  // در غیر این صورت جدول را حل کن
  // ----------------------------------------

  const solved =
    solveSudoku(
      board
    );

  if (
    !solved
  ) {

    return null;
  }

  for (
    let i = 0;
    i < 81;
    i++
  ) {

    if (
      board[i] === null
    ) {

      return {

        index:
          i,

        number:
          solved[i]
      };
    }
  }

  return null;
}
