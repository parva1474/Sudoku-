// ==========================================
// sudoku.js
// موتور کامل بازی سودوکو 9×9
// ==========================================

const SIZE = 9;
const BOX_SIZE = 3;
const NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

/**
 * ساخت یک جدول خالی 9×9
 */
function createEmptyGrid() {
  return Array.from(
    { length: SIZE },
    () => Array(SIZE).fill(0)
  );
}

/**
 * مخلوط کردن آرایه
 */
function shuffle(array) {
  const arr = [...array];

  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  return arr;
}

/**
 * بررسی اینکه قرار دادن عدد در یک خانه مجاز است یا نه
 *
 * قوانین:
 * 1. عدد در ردیف تکراری نباشد
 * 2. عدد در ستون تکراری نباشد
 * 3. عدد در باکس 3×3 تکراری نباشد
 */
export function isValid(board, row, col, num) {
  // عدد باید بین 1 تا 9 باشد
  if (!Number.isInteger(num) || num < 1 || num > 9) {
    return false;
  }

  // بررسی ردیف
  for (let c = 0; c < SIZE; c++) {
    if (c !== col && board[row][c] === num) {
      return false;
    }
  }

  // بررسی ستون
  for (let r = 0; r < SIZE; r++) {
    if (r !== row && board[r][col] === num) {
      return false;
    }
  }

  // مختصات گوشه باکس 3×3
  const startRow = Math.floor(row / BOX_SIZE) * BOX_SIZE;
  const startCol = Math.floor(col / BOX_SIZE) * BOX_SIZE;

  // بررسی باکس 3×3
  for (let r = startRow; r < startRow + BOX_SIZE; r++) {
    for (let c = startCol; c < startCol + BOX_SIZE; c++) {
      if (r !== row && c !== col && board[r][c] === num) {
        return false;
      }
    }
  }

  return true;
}

/**
 * حل‌کننده سودوکو با Backtracking
 */
function solveSudoku(board) {
  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {

      if (board[row][col] !== 0) {
        continue;
      }

      const numbers = shuffle(NUMBERS);

      for (const num of numbers) {
        if (isValid(board, row, col, num)) {
          board[row][col] = num;

          if (solveSudoku(board)) {
            return true;
          }

          // اگر جواب نداد، برگردان به خالی
          board[row][col] = 0;
        }
      }

      return false;
    }
  }

  return true;
}

/**
 * بررسی کامل بودن و معتبر بودن یک جدول
 *
 * این تابع تضمین می‌کند:
 * - هر ردیف 1 تا 9 را دقیقاً یک بار دارد
 * - هر ستون 1 تا 9 را دقیقاً یک بار دارد
 * - هر باکس 3×3 اعداد 1 تا 9 را دقیقاً یک بار دارد
 */
export function isCompleteValidSudoku(board) {
  if (!Array.isArray(board) || board.length !== SIZE) {
    return false;
  }

  // بررسی ردیف‌ها
  for (let row = 0; row < SIZE; row++) {
    const numbers = new Set(board[row]);

    if (
      numbers.size !== 9 ||
      !NUMBERS.every(num => numbers.has(num))
    ) {
      return false;
    }
  }

  // بررسی ستون‌ها
  for (let col = 0; col < SIZE; col++) {
    const numbers = new Set();

    for (let row = 0; row < SIZE; row++) {
      numbers.add(board[row][col]);
    }

    if (
      numbers.size !== 9 ||
      !NUMBERS.every(num => numbers.has(num))
    ) {
      return false;
    }
  }

  // بررسی باکس‌های 3×3
  for (let boxRow = 0; boxRow < SIZE; boxRow += BOX_SIZE) {
    for (let boxCol = 0; boxCol < SIZE; boxCol += BOX_SIZE) {

      const numbers = new Set();

      for (let r = boxRow; r < boxRow + BOX_SIZE; r++) {
        for (let c = boxCol; c < boxCol + BOX_SIZE; c++) {
          numbers.add(board[r][c]);
        }
      }

      if (
        numbers.size !== 9 ||
        !NUMBERS.every(num => numbers.has(num))
      ) {
        return false;
      }
    }
  }

  return true;
}

/**
 * ساخت جدول کامل و معتبر سودوکو
 */
function generateSolvedGrid() {
  const board = createEmptyGrid();

  const solved = solveSudoku(board);

  if (!solved || !isCompleteValidSudoku(board)) {
    throw new Error("خطا در ساخت جدول کامل سودوکو");
  }

  return board;
}

/**
 * تعداد خانه‌هایی که باید از جدول جواب حذف شوند.
 *
 * حدود 40 تا 50 خانه خالی:
 * - مناسب برای بازی
 * - نه بیش از حد آسان
 * - نه بیش از حد سخت
 */
function getCellsToRemove() {
  return 40 + Math.floor(Math.random() * 11);
}

/**
 * ساخت بازی جدید
 */
export function generateNewGame() {

  // ساخت جواب کامل
  const solution = generateSolvedGrid();

  // کپی جدول برای ساخت پازل
  const puzzle = solution.map(row => [...row]);

  const cellsToRemove = getCellsToRemove();

  // تمام مختصات خانه‌ها
  const positions = [];

  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      positions.push({ r, c });
    }
  }

  // تصادفی کردن خانه‌ها
  const shuffledPositions = shuffle(positions);

  // حذف تعدادی خانه
  for (let i = 0; i < cellsToRemove; i++) {
    const { r, c } = shuffledPositions[i];
    puzzle[r][c] = 0;
  }

  /**
   * ساخت ساختار مورد استفاده ربات
   *
   * value:
   * مقدار فعلی خانه
   *
   * solutionValue:
   * جواب واقعی خانه
   *
   * given:
   * آیا این عدد از ابتدا در جدول بوده؟
   *
   * notes:
   * اعداد مدادی
   *
   * isError:
   * آیا آخرین حرکت کاربر اشتباه بوده؟
   */
  const board = Array.from(
    { length: SIZE },
    (_, r) =>
      Array.from(
        { length: SIZE },
        (_, c) => ({
          value: puzzle[r][c] === 0 ? null : puzzle[r][c],
          solutionValue: solution[r][c],
          given: puzzle[r][c] !== 0,
          notes: [],
          isError: false
        })
      )
  );

  return {
    board,

    // جدول جواب کامل
    solution: solution.map(row => [...row]),

    // وضعیت بازی
    status: 'PLAYING',

    // حالت مداد
    pencilMode: false,

    // تعداد خطاهای کلی بازی
    mistakes: 0
  };
}

/**
 * بررسی اینکه بازی کاملاً حل شده یا نه
 */
export function isGameComplete(gameState) {
  if (!gameState || !gameState.board) {
    return false;
  }

  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const cell = gameState.board[r][c];

      if (
        cell.value === null ||
        cell.value !== cell.solutionValue
      ) {
        return false;
      }
    }
  }

  return true;
}

/**
 * بررسی معتبر بودن وضعیت فعلی جدول
 *
 * این تابع برای اطمینان بیشتر است.
 * اگر بازیکن به هر روشی جدول را خراب کند،
 * ردیف، ستون یا باکس 3×3 نباید تکراری باشد.
 */
export function isCurrentBoardValid(gameState) {
  if (!gameState || !gameState.board) {
    return false;
  }

  const values = gameState.board.map(row =>
    row.map(cell => cell.value ?? 0)
  );

  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {

      const value = values[r][c];

      if (value === 0) {
        continue;
      }

      if (!isValid(values, r, c, value)) {
        return false;
      }
    }
  }

  return true;
}
