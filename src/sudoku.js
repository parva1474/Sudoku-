// ==========================================
// src/sudoku.js
// Sudoku Engine
// مناسب Cloudflare Workers
// بدون sudoku-core
// ==========================================

// ==========================================
// ثابت‌ها
// ==========================================

const NUMBERS = [
  1, 2, 3, 4, 5, 6, 7, 8, 9
];

// ==========================================
// ابزار تصادفی
// ==========================================

function randomInt(max) {
  return Math.floor(
    Math.random() * max
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
      randomInt(i + 1);

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
// ساخت Sudoku کامل
// ==========================================

function createSolvedBoard() {
  const board =
    Array(81).fill(0);

  function pattern(row, col) {
    return (
      (row * 3) +
      Math.floor(row / 3) +
      col
    ) % 9;
  }

  const rows = [];
  const cols = [];

  // گروه‌های سه‌تایی سطر
  const rowGroups =
    shuffle([0, 1, 2]);

  for (
    const group of rowGroups
  ) {
    const inside =
      shuffle([0, 1, 2]);

    for (
      const offset of inside
    ) {
      rows.push(
        group * 3 + offset
      );
    }
  }

  // گروه‌های سه‌تایی ستون
  const colGroups =
    shuffle([0, 1, 2]);

  for (
    const group of colGroups
  ) {
    const inside =
      shuffle([0, 1, 2]);

    for (
      const offset of inside
    ) {
      cols.push(
        group * 3 + offset
      );
    }
  }

  const numbers =
    shuffle(NUMBERS);

  for (
    let r = 0;
    r < 9;
    r++
  ) {

    for (
      let c = 0;
      c < 9;
      c++
    ) {

      const value =
        numbers[
          pattern(
            rows[r],
            cols[c]
          )
        ];

      board[
        r * 9 + c
      ] = value;
    }
  }

  return board;
}

// ==========================================
// بررسی معتبر بودن حرکت
// ==========================================

function canPlace(
  board,
  index,
  value
) {
  const row =
    Math.floor(index / 9);

  const col =
    index % 9;

  // Row
  for (
    let c = 0;
    c < 9;
    c++
  ) {

    const i =
      row * 9 + c;

    if (
      i !== index &&
      board[i] === value
    ) {
      return false;
    }
  }

  // Column
  for (
    let r = 0;
    r < 9;
    r++
  ) {

    const i =
      r * 9 + col;

    if (
      i !== index &&
      board[i] === value
    ) {
      return false;
    }
  }

  // Box
  const boxRow =
    Math.floor(row / 3) * 3;

  const boxCol =
    Math.floor(col / 3) * 3;

  for (
    let r = boxRow;
    r < boxRow + 3;
    r++
  ) {

    for (
      let c = boxCol;
      c < boxCol + 3;
      c++
    ) {

      const i =
        r * 9 + c;

      if (
        i !== index &&
        board[i] === value
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
  solution,
  difficulty
) {
  const puzzle =
    [...solution];

  const removeCount =
    getRemoveCount(
      difficulty
    );

  const positions =
    shuffle(
      Array.from(
        { length: 81 },
        (_, i) => i
      )
    );

  let removed = 0;

  for (
    const index of positions
  ) {

    if (
      removed >= removeCount
    ) {
      break;
    }

    const backup =
      puzzle[index];

    puzzle[index] =
      null;

    /*
     * این نسخه برای سرعت بالا
     * uniqueness را با Solver
     * سنگین بررسی نمی‌کند.
     *
     * چون Solution اصلی همچنان
     * در بازی ذخیره می‌شود.
     */

    removed++;

    /*
     * جلوگیری از حذف بیش از حد
     */

    if (
      countFilled(puzzle) < 17
    ) {

      puzzle[index] =
        backup;

      removed--;

      break;
    }
  }

  return puzzle;
}

// ==========================================
// تعداد خانه‌های پر
// ==========================================

function countFilled(board) {
  let count = 0;

  for (
    const value of board
  ) {

    if (
      value !== null &&
      value !== 0
    ) {
      count++;
    }
  }

  return count;
}

// ==========================================
// میزان حذف بر اساس سختی
// ==========================================

function getRemoveCount(
  difficulty
) {

  switch (difficulty) {

    case "easy":
      return 40;

    case "medium":
      return 48;

    case "hard":
      return 54;

    case "expert":
      return 58;

    case "master":
      return 62;

    default:
      return 48;
  }
}

// ==========================================
// ساخت Puzzle
// ==========================================

export function createPuzzle(
  difficulty = "medium"
) {

  const solution =
    createSolvedBoard();

  const puzzle =
    removeCells(
      solution,
      difficulty
    );

  return {
    puzzle,
    solution
  };
}

// ==========================================
// بررسی حرکت
// ==========================================

export function isValidMove(
  solution,
  index,
  value
) {

  if (
    !Array.isArray(solution) ||
    solution.length !== 81
  ) {
    return false;
  }

  if (
    !Number.isInteger(index) ||
    index < 0 ||
    index >= 81
  ) {
    return false;
  }

  const number =
    Number(value);

  if (
    !Number.isInteger(number) ||
    number < 1 ||
    number > 9
  ) {
    return false;
  }

  return (
    solution[index] ===
    number
  );
}

// ==========================================
// بررسی حل کامل
// ==========================================

export function isSolved(
  board,
  solution
) {

  if (
    !Array.isArray(board) ||
    !Array.isArray(solution)
  ) {
    return false;
  }

  if (
    board.length !== 81 ||
    solution.length !== 81
  ) {
    return false;
  }

  for (
    let i = 0;
    i < 81;
    i++
  ) {

    if (
      board[i] !==
      solution[i]
    ) {
      return false;
    }
  }

  return true;
}

// ==========================================
// Candidateهای یک خانه
// ==========================================

export function getCandidates(
  board,
  index
) {

  if (
    !Array.isArray(board) ||
    board.length !== 81
  ) {
    return [];
  }

  if (
    !Number.isInteger(index) ||
    index < 0 ||
    index >= 81
  ) {
    return [];
  }

  if (
    board[index] !== null &&
    board[index] !== 0
  ) {
    return [];
  }

  const used =
    new Set();

  const row =
    Math.floor(index / 9);

  const col =
    index % 9;

  // Row
  for (
    let c = 0;
    c < 9;
    c++
  ) {

    const value =
      board[row * 9 + c];

    if (
      value !== null &&
      value !== 0
    ) {
      used.add(value);
    }
  }

  // Column
  for (
    let r = 0;
    r < 9;
    r++
  ) {

    const value =
      board[r * 9 + col];

    if (
      value !== null &&
      value !== 0
    ) {
      used.add(value);
    }
  }

  // Box
  const boxRow =
    Math.floor(row / 3) * 3;

  const boxCol =
    Math.floor(col / 3) * 3;

  for (
    let r = boxRow;
    r < boxRow + 3;
    r++
  ) {

    for (
      let c = boxCol;
      c < boxCol + 3;
      c++
    ) {

      const value =
        board[r * 9 + c];

      if (
        value !== null &&
        value !== 0
      ) {
        used.add(value);
      }
    }
  }

  return NUMBERS.filter(
    number =>
      !used.has(number)
  );
}

// ==========================================
// اعتبارسنجی کل جدول
// ==========================================

export function isBoardValid(
  board
) {

  if (
    !Array.isArray(board) ||
    board.length !== 81
  ) {
    return false;
  }

  // Rows
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
        value === null ||
        value === 0
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

  // Columns
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
        value === null ||
        value === 0
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

  // Boxes
  for (
    let boxRow = 0;
    boxRow < 3;
    boxRow++
  ) {

    for (
      let boxCol = 0;
      boxCol < 3;
      boxCol++
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

          const row =
            boxRow * 3 + r;

          const col =
            boxCol * 3 + c;

          const value =
            board[
              row * 9 + col
            ];

          if (
            value === null ||
            value === 0
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
// Hint
// ==========================================

export function getHint(
  board
) {

  if (
    !Array.isArray(board) ||
    board.length !== 81
  ) {
    return null;
  }

  /*
   * در این موتور سبک،
   * Hint از Candidateها استفاده می‌کند.
   *
   * اگر خانه‌ای فقط یک Candidate داشته باشد،
   * آن حرکت بهترین Hint است.
   */

  for (
    let index = 0;
    index < 81;
    index++
  ) {

    if (
      board[index] !== null &&
      board[index] !== 0
    ) {
      continue;
    }

    const candidates =
      getCandidates(
        board,
        index
      );

    if (
      candidates.length === 1
    ) {

      return {
        index,

        value:
          candidates[0]
      };
    }
  }

  /*
   * اگر Single پیدا نشد،
   * اولین خانه خالی را با Candidate
   * اول پیشنهاد می‌کنیم.
   */

  for (
    let index = 0;
    index < 81;
    index++
  ) {

    if (
      board[index] === null ||
      board[index] === 0
    ) {

      const candidates =
        getCandidates(
          board,
          index
        );

      if (
        candidates.length > 0
      ) {

        return {
          index,

          value:
            candidates[0]
        };
      }
    }
  }

  return null;
}

// ==========================================
// استخراج Hint
// ==========================================

export function extractHintMove(
  result
) {

  if (!result) {
    return null;
  }

  if (
    Number.isInteger(
      result.index
    ) &&
    Number.isInteger(
      result.value
    )
  ) {

    return {
      index:
        result.index,

      value:
        result.value
    };
  }

  if (
    result.move &&
    Number.isInteger(
      result.move.index
    ) &&
    Number.isInteger(
      result.move.value
    )
  ) {

    return {
      index:
        result.move.index,

      value:
        result.move.value
    };
  }

  return null;
  }
