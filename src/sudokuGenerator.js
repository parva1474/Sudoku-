// ==========================================
// src/sudokuGenerator.js
// ==========================================

// تابع کمکی برای بررسی امکان قرار دادن عدد در خانه
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

// حل‌کننده سودوکو برای ساخت جدول کامل
function solveSudoku(board) {
  for (let i = 0; i < 81; i++) {
    if (board[i] === 0) {
      const row = Math.floor(i / 9);
      const col = i % 9;
      const numbers = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
      
      for (let num of numbers) {
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

// تولیدکننده اصلی جدول‌های پویا (بیش از ۵۰۰ ترکیب و جدول منحصر‌به‌فرد برای هر سطح)
export function generateSudoku(difficulty) {
  // ساخت جدول حل‌شده کامل پایه
  let solution = Array(81).fill(0);
  solveSudoku(solution);

  let puzzle = [...solution];
  
  // تعیین تعداد خانه‌هایی که بر اساس درجه سختی باید حذف شوند
  let removeCount = 35; // آسان
  if (difficulty === 'medium') removeCount = 45;
  if (difficulty === 'hard') removeCount = 52;
  if (difficulty === 'expert') removeCount = 58;

  let removed = 0;
  while (removed < removeCount) {
    const index = Math.floor(Math.random() * 81);
    if (puzzle[index] !== 0) {
      puzzle[index] = 0;
      removed++;
    }
  }

  return {
    id: `${difficulty}_${Math.floor(Math.random() * 500) + 1}_${Date.now()}`,
    puzzle: puzzle,
    solution: solution
  };
}
