// الگوریتم‌ها و توابع کمکی سودوکو و حالت یادداشت (مداد)

// تولید یک جدول سودوکو نمونه (قابل گسترش با الگوریتم تولیدکننده استاندارد)
export function generateSudoku(level = 'easy') {
  // نمونه جدول حل شده و جدول اولیه با خانه‌های خالی (صفر)
  const puzzle = [
    [5, 3, 0, 0, 7, 0, 0, 0, 0],
    [6, 0, 0, 1, 9, 5, 0, 0, 0],
    [0, 9, 8, 0, 0, 0, 0, 6, 0],
    [8, 0, 0, 0, 6, 0, 0, 0, 3],
    [4, 0, 0, 8, 0, 3, 0, 0, 1],
    [7, 0, 0, 0, 2, 0, 0, 0, 6],
    [0, 6, 0, 0, 0, 0, 2, 8, 0],
    [0, 0, 0, 4, 1, 9, 0, 0, 5],
    [0, 0, 0, 0, 8, 0, 0, 7, 9]
  ];
  
  // برای هر خانه می‌تونیم یادداشت‌ها (حالت مداد) رو هم نگهداری کنیم
  // ساختار یادداشت‌ها به صورت ماتریس ۹ در ۹ از آرایه‌هاست
  const notes = Array(9).fill(null).map(() => Array(9).fill([]));

  return { puzzle, notes };
}

// تبدیل جدول به کیبورد شیشه‌ای تلگرام همراه با ایموجی اعداد و حالت مداد
export function buildSudokuKeyboard(board, notes, selectedCell = null) {
  const numberEmojis = ['0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣'];
  const pencilEmojis = ['', ' ₁', ' ₂', ' ₃', ' ₄', ' ₅', ' ₆', ' ₇', ' ⁸', ' ₉']; // ساده‌سازی برای یادداشت

  let keyboard = [];

  for (let r = 0; r < 9; r++) {
    let row = [];
    for (let c = 0; c < 9; c++) {
      let val = board[r][c];
      let text = val === 0 ? '▫️' : numberEmojis[val];

      // اگر این خانه توسط کاربر انتخاب شده باشد تا بهش عدد بدهد
      if (selectedCell && selectedCell.r === r && selectedCell.c === c) {
        text = '🔘';
      }

      row.push({
        text: text,
        callback_data: `cell_${r}_${c}`
      });
    }
    keyboard.push(row);
  }

  return keyboard;
}
