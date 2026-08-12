// ==========================================
// src/sudokuGenerator.js
// ==========================================

function isValid(board, row, col, num) {
  for (let i = 0; i < 9; i++) {
    if (board[row * 9 + i] === num && i !== col) return false;
    if (board[i * 9 + col] === num && i !== row) return false;
  }
  const startRow = Math.floor(row / 3) * 3;
  const startCol = Math.floor(col / 3) * 3;
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const currRow = startRow + r;
      const currCol = startCol + c;
      if (board[currRow * 9 + currCol] === num && (currRow !== row || currCol !== col)) {
        return false;
      }
    }
  }
  return true;
}

function solveSudoku(board) {
  for (let i = 0; i < 81; i++) {
    if (board[i] === 0) {
      const row = Math.floor(i / 9);
      const col = i % 9;
      for (let num = 1; num <= 9; num++) {
        if (isValid(board, row, col, num)) {
          board[i] = num;
          if (solveSudoku(board)) return true;
          board[i] = 0;
        }
      }
      return false;
    }
  }
  return true;
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

export function generateSudoku(difficulty) {
  let solution = Array(81).fill(0);
  solveSudoku(solution);

  let puzzle = [...solution];
  
  // تعداد خانه‌هایی که باید برداشته شوند
  let removeCount = 35; // آسان
  if (difficulty === 'medium') removeCount = 45;
  if (difficulty === 'hard') removeCount = 52;
  if (difficulty === 'expert') removeCount = 58;

  let attempts = removeCount;
  let indices = shuffle([...Array(81).keys()]);

  for (let i = 0; i < indices.length && attempts > 0; i++) {
    let idx = indices[i];
    if (puzzle[idx] !== 0) {
      let temp = puzzle[idx];
      puzzle[idx] = 0;
      
      // بررسی اینکه آیا جدول همچنان قابل حل است
      let copy = [...puzzle];
      if (!solveSudoku(copy)) {
        puzzle[idx] = temp; // اگر قابل حل نبود، برگردان
      } else {
        attempts--;
      }
    }
  }

  return {
    id: `${difficulty}_${Math.floor(Math.random() * 500) + 1}_${Date.now()}`,
    puzzle: puzzle,
    solution: solution
  };
}
