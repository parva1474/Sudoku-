// ==========================================
// src/sudoku.js
// Sudoku Core
// ==========================================

import {
  generate,
  solve,
  hint
} from "sudoku-core";

// ------------------------------------------
// تبدیل خروجی به آرایه 81 خانه‌ای
// ------------------------------------------

function normalizeBoard(board) {
  if (!Array.isArray(board)) {
    throw new Error("Invalid Sudoku board");
  }

  return board.map((value) => {
    if (
      value === null ||
      value === undefined ||
      value === 0 ||
      value === ""
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
  });
}

// ------------------------------------------
// ساخت جدول جدید
// ------------------------------------------

export function createPuzzle(difficulty = "medium") {
  const puzzle = normalizeBoard(
    generate(difficulty)
  );

  const solved = solve(puzzle);

  const solution = normalizeBoard(
    solved.board
  );

  return {
    puzzle,
    solution
  };
}

// ------------------------------------------
// بررسی حرکت بازیکن
// ------------------------------------------

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
    index < 0 ||
    index >= 81
  ) {
    return false;
  }

  if (
    value < 1 ||
    value > 9
  ) {
    return false;
  }

  return solution[index] === value;
}

// ------------------------------------------
// بررسی کامل شدن جدول
// ------------------------------------------

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
    if (board[i] !== solution[i]) {
      return false;
    }
  }

  return true;
}

// ------------------------------------------
// پیدا کردن Candidateهای یک خانه
// ------------------------------------------

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
    index < 0 ||
    index >= 81
  ) {
    return [];
  }

  if (board[index] !== null) {
    return [];
  }

  const row =
    Math.floor(index / 9);

  const col =
    index % 9;

  const used =
    new Set();

  // سطر
  for (let c = 0; c < 9; c++) {
    const value =
      board[row * 9 + c];

    if (value !== null) {
      used.add(value);
    }
  }

  // ستون
  for (let r = 0; r < 9; r++) {
    const value =
      board[r * 9 + col];

    if (value !== null) {
      used.add(value);
    }
  }

  // باکس 3×3
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

      if (value !== null) {
        used.add(value);
      }
    }
  }

  const candidates = [];

  for (let n = 1; n <= 9; n++) {
    if (!used.has(n)) {
      candidates.push(n);
    }
  }

  return candidates;
}

// ------------------------------------------
// راهنمایی Sudoku
// ------------------------------------------

export function getHint(board) {
  try {
    return hint(board);
  } catch (error) {
    console.error(
      "Sudoku hint error:",
      error
    );

    return null;
  }
}

// ------------------------------------------
// بررسی اعتبار جدول
// ------------------------------------------

export function isBoardValid(board) {
  if (
    !Array.isArray(board) ||
    board.length !== 81
  ) {
    return false;
  }

  // سطرها
  for (let row = 0; row < 9; row++) {
    const seen = new Set();

    for (let col = 0; col < 9; col++) {
      const value =
        board[row * 9 + col];

      if (value === null) {
        continue;
      }

      if (seen.has(value)) {
        return false;
      }

      seen.add(value);
    }
  }

  // ستون‌ها
  for (let col = 0; col < 9; col++) {
    const seen = new Set();

    for (let row = 0; row < 9; row++) {
      const value =
        board[row * 9 + col];

      if (value === null) {
        continue;
      }

      if (seen.has(value)) {
        return false;
      }

      seen.add(value);
    }
  }

  // باکس‌ها
  for (let boxRow = 0; boxRow < 3; boxRow++) {
    for (let boxCol = 0; boxCol < 3; boxCol++) {

      const seen = new Set();

      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {

          const row =
            boxRow * 3 + r;

          const col =
            boxCol * 3 + c;

          const value =
            board[row * 9 + col];

          if (value === null) {
            continue;
          }

          if (seen.has(value)) {
            return false;
          }

          seen.add(value);
        }
      }
    }
  }

  return true;
}
