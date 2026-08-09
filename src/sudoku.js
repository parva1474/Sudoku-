// ==========================================
// src/sudoku.js
// موتور کامل و استاندارد Sudoku 9×9
// ==========================================

const SIZE = 9;
const BOX_SIZE = 3;

const NUMBERS = [
  1, 2, 3,
  4, 5, 6,
  7, 8, 9
];


// ==========================================
// ساخت جدول خالی 9×9
// ==========================================

function createEmptyGrid() {

  return Array.from(
    { length: SIZE },
    () => Array(SIZE).fill(0)
  );

}


// ==========================================
// Shuffle
// ==========================================

function shuffle(array) {

  const result = [...array];

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


// ==========================================
// بررسی مجاز بودن عدد
//
// قوانین:
// 1. ردیف تکراری نباشد
// 2. ستون تکراری نباشد
// 3. بلوک 3×3 تکراری نباشد
// ==========================================

export function isValid(
  board,
  row,
  col,
  num
) {

  if (
    !Array.isArray(board) ||
    board.length !== SIZE
  ) {

    return false;
  }


  if (
    !Number.isInteger(num) ||
    num < 1 ||
    num > 9
  ) {

    return false;
  }


  // -----------------------------
  // بررسی ردیف
  // -----------------------------

  for (
    let c = 0;
    c < SIZE;
    c++
  ) {

    if (
      c !== col &&
      board[row][c] === num
    ) {

      return false;
    }
  }


  // -----------------------------
  // بررسی ستون
  // -----------------------------

  for (
    let r = 0;
    r < SIZE;
    r++
  ) {

    if (
      r !== row &&
      board[r][col] === num
    ) {

      return false;
    }
  }


  // -----------------------------
  // بررسی بلوک 3×3
  // -----------------------------

  const startRow =
    Math.floor(row / BOX_SIZE) *
    BOX_SIZE;

  const startCol =
    Math.floor(col / BOX_SIZE) *
    BOX_SIZE;


  for (
    let r = startRow;
    r < startRow + BOX_SIZE;
    r++
  ) {

    for (
      let c = startCol;
      c < startCol + BOX_SIZE;
      c++
    ) {

      if (
        r === row &&
        c === col
      ) {

        continue;
      }


      if (
        board[r][c] === num
      ) {

        return false;
      }
    }
  }


  return true;
}


// ==========================================
// حل Sudoku
// Backtracking
// ==========================================

function solveSudoku(board) {

  for (
    let row = 0;
    row < SIZE;
    row++
  ) {

    for (
      let col = 0;
      col < SIZE;
      col++
    ) {

      if (
        board[row][col] !== 0
      ) {

        continue;
      }


      const candidates =
        shuffle(NUMBERS);


      for (
        const num of candidates
      ) {

        if (
          isValid(
            board,
            row,
            col,
            num
          )
        ) {

          board[row][col] = num;


          if (
            solveSudoku(board)
          ) {

            return true;
          }


          board[row][col] = 0;
        }
      }


      return false;
    }
  }


  return true;
}


// ==========================================
// بررسی کامل بودن جدول حل‌شده
// ==========================================

export function isCompleteValidSudoku(
  board
) {

  if (
    !Array.isArray(board) ||
    board.length !== SIZE
  ) {

    return false;
  }


  // ----------------------------------------
  // بررسی تعداد ستون‌های هر ردیف
  // ----------------------------------------

  for (
    let row = 0;
    row < SIZE;
    row++
  ) {

    if (
      !Array.isArray(board[row]) ||
      board[row].length !== SIZE
    ) {

      return false;
    }
  }


  // ----------------------------------------
  // بررسی ردیف‌ها
  // ----------------------------------------

  for (
    let row = 0;
    row < SIZE;
    row++
  ) {

    const seen =
      new Set();


    for (
      let col = 0;
      col < SIZE;
      col++
    ) {

      const value =
        board[row][col];


      if (
        !NUMBERS.includes(value) ||
        seen.has(value)
      ) {

        return false;
      }


      seen.add(value);
    }
  }


  // ----------------------------------------
  // بررسی ستون‌ها
  // ----------------------------------------

  for (
    let col = 0;
    col < SIZE;
    col++
  ) {

    const seen =
      new Set();


    for (
      let row = 0;
      row < SIZE;
      row++
    ) {

      const value =
        board[row][col];


      if (
        !NUMBERS.includes(value) ||
        seen.has(value)
      ) {

        return false;
      }


      seen.add(value);
    }
  }


  // ----------------------------------------
  // بررسی تمام بلوک‌های 3×3
  // ----------------------------------------

  for (
    let boxRow = 0;
    boxRow < SIZE;
    boxRow += BOX_SIZE
  ) {

    for (
      let boxCol = 0;
      boxCol < SIZE;
      boxCol += BOX_SIZE
    ) {

      const seen =
        new Set();


      for (
        let r = boxRow;
        r < boxRow + BOX_SIZE;
        r++
      ) {

        for (
          let c = boxCol;
          c < boxCol + BOX_SIZE;
          c++
        ) {

          const value =
            board[r][c];


          if (
            !NUMBERS.includes(value) ||
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
// ساخت جدول جواب
// ==========================================

function generateSolvedGrid() {

  const board =
    createEmptyGrid();


  const solved =
    solveSudoku(board);


  if (
    !solved
  ) {

    throw new Error(
      '❌ ساخت جدول حل‌شده ناموفق بود.'
    );
  }


  if (
    !isCompleteValidSudoku(board)
  ) {

    throw new Error(
      '❌ جدول تولیدشده Sudoku معتبر نیست.'
    );
  }


  return board;
}


// ==========================================
// تعداد خانه‌های حذف‌شده
// ==========================================

function getCellsToRemove() {

  // بین 40 تا 50 خانه خالی

  return (
    40 +
    Math.floor(
      Math.random() * 11
    )
  );
}


// ==========================================
// ساخت بازی جدید
// ==========================================

export function generateNewGame() {

  // ----------------------------------------
  // ساخت جواب کامل
  // ----------------------------------------

  const solution =
    generateSolvedGrid();


  // ----------------------------------------
  // کپی جواب
  // ----------------------------------------

  const puzzle =
    solution.map(
      row => [...row]
    );


  // ----------------------------------------
  // ساخت لیست 81 خانه
  // ----------------------------------------

  const positions = [];


  for (
    let row = 0;
    row < SIZE;
    row++
  ) {

    for (
      let col = 0;
      col < SIZE;
      col++
    ) {

      positions.push({
        r: row,
        c: col
      });
    }
  }


  // ----------------------------------------
  // مخلوط کردن خانه‌ها
  // ----------------------------------------

  const shuffledPositions =
    shuffle(positions);


  // ----------------------------------------
  // حذف خانه‌ها
  // ----------------------------------------

  const cellsToRemove =
    getCellsToRemove();


  for (
    let i = 0;
    i < cellsToRemove;
    i++
  ) {

    const {
      r,
      c
    } = shuffledPositions[i];


    puzzle[r][c] = 0;
  }


  // ----------------------------------------
  // ساخت ساختار بازی
  // ----------------------------------------

  const board =
    Array.from(
      { length: SIZE },
      (_, row) => {

        return Array.from(
          { length: SIZE },
          (_, col) => {

            const value =
              puzzle[row][col];


            return {

              // مقدار فعلی
              value:
                value === 0
                  ? null
                  : value,

              // جواب واقعی
              solutionValue:
                solution[row][col],

              // عدد اولیه
              given:
                value !== 0,

              // یادداشت‌های مدادی
              notes: [],

              // وضعیت خطا
              isError: false

            };

          }
        );

      }
    );


  // ----------------------------------------
  // اطمینان از 9×9 بودن
  // ----------------------------------------

  if (
    board.length !== 9 ||
    board.some(
      row =>
        !Array.isArray(row) ||
        row.length !== 9
    )
  ) {

    throw new Error(
      '❌ خطای جدی: جدول بازی 9×9 ساخته نشد.'
    );
  }


  return {

    board,

    // جواب کامل
    solution:
      solution.map(
        row => [...row]
      ),

    // وضعیت
    status:
      'PLAYING',

    // حالت مداد
    pencilMode:
      false,

    // خطاهای کلی
    mistakes:
      0

  };
}


// ==========================================
// بررسی کامل شدن بازی
// ==========================================

export function isGameComplete(
  gameState
) {

  if (
    !gameState ||
    !Array.isArray(gameState.board) ||
    gameState.board.length !== 9
  ) {

    return false;
  }


  for (
    let row = 0;
    row < SIZE;
    row++
  ) {

    for (
      let col = 0;
      col < SIZE;
      col++
    ) {

      const cell =
        gameState.board[row][col];


      if (
        !cell ||
        cell.value === null ||
        cell.value !== cell.solutionValue
      ) {

        return false;
      }
    }
  }


  return true;
}


// ==========================================
// بررسی وضعیت فعلی جدول
//
// فقط اعداد واردشده توسط کاربر بررسی می‌شوند.
// خانه‌های خالی مشکلی ندارند.
// ==========================================

export function isCurrentBoardValid(
  gameState
) {

  if (
    !gameState ||
    !Array.isArray(gameState.board) ||
    gameState.board.length !== SIZE
  ) {

    return false;
  }


  const values =
    gameState.board.map(
      row =>
        row.map(
          cell =>
            cell.value ?? 0
        )
    );


  for (
    let row = 0;
    row < SIZE;
    row++
  ) {

    for (
      let col = 0;
      col < SIZE;
      col++
    ) {

      const value =
        values[row][col];


      if (
        value === 0
      ) {

        continue;
      }


      if (
        !isValid(
          values,
          row,
          col,
          value
        )
      ) {

        return false;
      }
    }
  }


  return true;
}


// ==========================================
// بررسی کاندیداهای مجاز یک خانه
// ==========================================

export function getCandidates(
  gameState,
  row,
  col
) {

  if (
    !gameState ||
    !gameState.board ||
    !gameState.board[row] ||
    !gameState.board[row][col]
  ) {

    return [];
  }


  const values =
    gameState.board.map(
      row =>
        row.map(
          cell =>
            cell.value ?? 0
        )
    );


  const candidates = [];


  for (
    const number of NUMBERS
  ) {

    if (
      isValid(
        values,
        row,
        col,
        number
      )
    ) {

      candidates.push(
        number
      );
    }
  }


  return candidates;
}
