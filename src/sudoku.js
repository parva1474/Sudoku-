// ==========================================
// src/sudoku.js
// Sudoku Generator + Solver
// ==========================================


// ==========================================
// تنظیمات سختی
// ==========================================

const DIFFICULTY_CLUES = {

  easy:
    42,

  medium:
    36,

  hard:
    31,

  expert:
    27,

  master:
    23
};


// ==========================================
// تولید Sudoku
// ==========================================

export function generateSudoku(
  difficulty = "medium"
) {

  const clues =
    DIFFICULTY_CLUES[difficulty] ||
    DIFFICULTY_CLUES.medium;


  const solution =
    createSolvedBoard();


  const puzzle =
    [...solution];


  removeCells(
    puzzle,
    81 - clues
  );


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
    solveBoard(board)
  ) {

    return board;
  }


  throw new Error(
    "Unable to generate Sudoku solution."
  );
}


// ==========================================
// Solver
// ==========================================

function solveBoard(
  board
) {

  const index =
    findEmptyCell(board);


  if (
    index === -1
  ) {

    return true;
  }


  const numbers =
    shuffle([
      1,2,3,4,5,6,7,8,9
    ]);


  for (
    const number of numbers
  ) {

    if (
      isValidMove(
        board,
        index,
        number
      )
    ) {

      board[index] =
        number;


      if (
        solveBoard(board)
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
// اولین خانه خالی
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
      board[i] === null ||
      board[i] === undefined
    ) {

      return i;
    }
  }

  return -1;
}


// ==========================================
// بررسی حرکت
// ==========================================

function isValidMove(
  board,
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

    if (
      board[row * 9 + c] === number
    ) {

      return false;
    }
  }


  // ستون
  for (
    let r = 0;
    r < 9;
    r++
  ) {

    if (
      board[r * 9 + col] === number
    ) {

      return false;
    }
  }


  // بلوک 3×3
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

      if (
        board[r * 9 + c] === number
      ) {

        return false;
      }
    }
  }


  return true;
}


// ==========================================
// حذف خانه‌ها
// ==========================================

function removeCells(
  puzzle,
  amount
) {

  const indexes =
    shuffle(
      Array.from(
        { length: 81 },
        (_, i) => i
      )
    );


  let removed = 0;


  for (
    const index of indexes
  ) {

    if (
      removed >= amount
    ) {
      break;
    }


    const backup =
      puzzle[index];


    puzzle[index] =
      null;


    // اگر می‌خواهیم بازی قابل حل باقی بماند
    // حداقل یک جواب داشته باشد.
    const test =
      [...puzzle];


    if (
      hasSolution(test)
    ) {

      removed++;

    } else {

      puzzle[index] =
        backup;
    }
  }
}


// ==========================================
// آیا جدول قابل حل است؟
// ==========================================

function hasSolution(
  board
) {

  const index =
    findEmptyCell(board);


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
      isValidMove(
        board,
        index,
        number
      )
    ) {

      board[index] =
        number;


      if (
        hasSolution(board)
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
  solution
) {

  if (
    !Array.isArray(board) ||
    !Array.isArray(solution)
  ) {

    return null;
  }


  // اول خانه خالی پیدا کن
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
      Math.floor(
        Math.random() * (i + 1)
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
