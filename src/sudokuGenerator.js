// src/sudokuGenerator.js

function isValid(board, row, col, num) {
  for (let i = 0; i < 9; i++) {
    if (board[row * 9 + i] === num || board[i * 9 + col] === num) return false;
  }
  const startRow = Math.floor(row / 3) * 3;
  const startCol = Math.floor(col / 3) * 3;
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (board[(startRow + i) * 9 + (startCol + j)] === num) return false;
    }
  }
  return true;
}

function solve(board) {
  for (let i = 0; i < 81; i++) {
    if (board[i] === 0) {
      const row = Math.floor(i / 9);
      const col = i % 9;
      const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);
      for (let num of nums) {
        if (isValid(board, row, col, num)) {
          board[i] = num;
          if (solve(board)) return true;
          board[i] = 0;
        }
      }
      return false;
    }
  }
  return true;
}

export function generateSudoku(difficulty) {
  let board = Array(81).fill(0);
  solve(board); // تولید یک جدول کاملاً پر و صحیح
  
  const solution = [...board];
  const difficultyLevels = { 'easy': 30, 'medium': 45, 'hard': 55 };
  const cellsToRemove = difficultyLevels[difficulty] || 30;
  
  // حذف اعداد برای ایجاد پازل (با حفظ تقارن منطقی)
  let removed = 0;
  while (removed < cellsToRemove) {
    let idx = Math.floor(Math.random() * 81);
    if (board[idx] !== 0) {
      board[idx] = 0;
      removed++;
    }
  }

  return {
    id: Math.random().toString(36).substring(7),
    puzzle: board,
    solution: solution
  };
}
