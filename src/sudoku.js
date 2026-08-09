export function isValid(board, row, col, num) {
  for (let i = 0; i < 9; i++) {
    if (board[row][i] === num && i !== col) return false;
    if (board[i][col] === num && i !== row) return false;
  }
  const startRow = Math.floor(row / 3) * 3;
  const startCol = Math.floor(col / 3) * 3;
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      let currR = startRow + r;
      let currC = startCol + c;
      if (board[currR][currC] === num && (currR !== row || currC !== col)) return false;
    }
  }
  return true;
}

export function solveSudoku(board) {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c] === 0) {
        let nums = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);
        for (let num of nums) {
          if (isValid(board, r, c, num)) {
            board[r][c] = num;
            if (solveSudoku(board)) return true;
            board[r][c] = 0;
          }
        }
        return false;
      }
    }
  }
  return true;
}

export function generateNewGame() {
  let solutionBoard = Array(9).fill(0).map(() => Array(9).fill(0));
  solveSudoku(solutionBoard);

  let puzzleBoard = solutionBoard.map(row => [...row]);
  let removedCount = 0;
  while (removedCount < 35) {
    let r = Math.floor(Math.random() * 9);
    let c = Math.floor(Math.random() * 9);
    if (puzzleBoard[r][c] !== 0) {
      puzzleBoard[r][c] = 0;
      removedCount++;
    }
  }

  let board = [];
  for (let r = 0; r < 9; r++) {
    let row = [];
    for (let c = 0; c < 9; c++) {
      let val = puzzleBoard[r][c];
      row.push({
        value: val !== 0 ? val : null,
        solutionValue: solutionBoard[r][c],
        given: val !== 0,
        notes: [],
        isError: false
      });
    }
    board.push(row);
  }

  return {
    board: board,
    status: 'PLAYING',
    mistakes: 0,
    maxMistakes: 3,
    pencilMode: false
  };
}
