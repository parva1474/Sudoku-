// ==========================================
// src/sudoku.js
// Sudoku Engine Adapter
// ==========================================

import {
  generate,
  solve,
  hint
} from "sudoku-core";

// ==========================================
// تبدیل مقدار به خانه استاندارد
// ==========================================

function normalizeValue(value) {
  if (
    value === null ||
    value === undefined ||
    value === "" ||
    value === 0
  ) {
    return null;
  }

  const number = Number(value);

  if (
    !Number.isInteger(number) ||
    number < 1 ||
    number > 9
  ) {
    return null;
  }

  return number;
}

// ==========================================
// استاندارد کردن Board
// ==========================================

function normalizeBoard(board) {
  if (!Array.isArray(board)) {
    throw new Error(
      "Sudoku board is not an array."
    );
  }

  if (board.length !== 81) {
    throw new Error(
      `Invalid Sudoku board length: ${board.length}`
    );
  }

  return board.map(normalizeValue);
}

// ==========================================
// ساخت Puzzle
// ==========================================

export function createPuzzle(
  difficulty = "medium"
) {
  let generated;

  try {
    generated =
      generate({
        difficulty
      });
  } catch (error) {

    /*
     * برای سازگاری با نسخه‌هایی که
     * difficulty را مستقیم دریافت می‌کنند.
     */

    generated =
      generate(difficulty);
  }

  const puzzle =
    normalizeBoard(
      generated
    );

  const solved =
    solve(puzzle);

  if (
    !solved ||
    !Array.isArray(solved.board)
  ) {
    throw new Error(
      "Sudoku solver returned an invalid result."
    );
  }

  const solution =
    normalizeBoard(
      solved.board
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
    Number(solution[index]) ===
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

  for (let i = 0; i < 81; i++) {

    if (
      normalizeValue(board[i]) !==
      normalizeValue(solution[i])
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

  const current =
    normalizeValue(
      board[index]
    );

  if (current !== null) {
    return [];
  }

  const row =
    Math.floor(index / 9);

  const col =
    index % 9;

  const used =
    new Set();

  // ----------------------------------------
  // Row
  // ----------------------------------------

  for (
    let c = 0;
    c < 9;
    c++
  ) {

    const value =
      normalizeValue(
        board[row * 9 + c]
      );

    if (value !== null) {
      used.add(value);
    }
  }

  // ----------------------------------------
  // Column
  // ----------------------------------------

  for (
    let r = 0;
    r < 9;
    r++
  ) {

    const value =
      normalizeValue(
        board[r * 9 + col]
      );

    if (value !== null) {
      used.add(value);
    }
  }

  // ----------------------------------------
  // 3x3 Box
  // ----------------------------------------

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
        normalizeValue(
          board[r * 9 + c]
        );

      if (value !== null) {
        used.add(value);
      }
    }
  }

  const candidates = [];

  for (
    let number = 1;
    number <= 9;
    number++
  ) {

    if (
      !used.has(number)
    ) {
      candidates.push(number);
    }
  }

  return candidates;
}

// ==========================================
// بررسی معتبر بودن کل جدول
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

  // ----------------------------------------
  // Rows
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
        normalizeValue(
          board[row * 9 + col]
        );

      if (value === null) {
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
  // Columns
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
        normalizeValue(
          board[row * 9 + col]
        );

      if (value === null) {
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
  // Boxes
  // ----------------------------------------

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
            normalizeValue(
              board[row * 9 + col]
            );

          if (value === null) {
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
// دریافت Hint
// ==========================================

export function getHint(
  board
) {
  const normalized =
    normalizeBoard(
      board
    );

  try {

    return hint(
      normalized
    );

  } catch (error) {

    console.error(
      "sudoku-core hint error:",
      error
    );

    return null;
  }
}

// ==========================================
// استخراج حرکت از Hint
// ==========================================

export function extractHintMove(
  result
) {
  if (!result) {
    return null;
  }

  /*
   * بعضی نسخه‌ها / خروجی‌ها ممکن است
   * حرکت را در یکی از این ساختارها
   * قرار دهند.
   */

  const candidates = [
    result.move,
    result.step,
    result.hint,
    result.solution,
    result.steps?.[0]
  ];

  for (
    const candidate of candidates
  ) {

    if (!candidate) {
      continue;
    }

    if (
      Number.isInteger(
        candidate.index
      ) &&
      Number.isInteger(
        candidate.value
      )
    ) {

      return {
        index:
          candidate.index,

        value:
          candidate.value
      };
    }

    if (
      Number.isInteger(
        candidate.cell
      ) &&
      Number.isInteger(
        candidate.value
      )
    ) {

      return {
        index:
          candidate.cell,

        value:
          candidate.value
      };
    }
  }

  return null;
}
