// ==========================================
// utils.js
// کیبورد کنترل سودوکو
// ==========================================

/**
 * ساخت کیبورد کنترل بازی سودوکو
 *
 * selectedCell:
 * {
 *   r: number,
 *   c: number
 * }
 *
 * scoresMap:
 * Map<userId, {
 *   name: string,
 *   score: number,
 *   mistakes: number
 * }>
 */
export function buildControlKeyboard(
  gameState,
  selectedCell = null,
  scoresMap = null
) {
  const keyboard = [];

  // ==========================================
  // جدول امتیازات
  // ==========================================

  if (scoresMap && scoresMap.size > 0) {
    let scoreText = "🏆 جدول امتیازات گروه:\n";

    let players = Array.from(scoresMap.values());

    // بیشترین امتیاز اول
    players.sort((a, b) => b.score - a.score);

    players.forEach((stats, index) => {
      const rank =
        index === 0 ? "🥇" :
        index === 1 ? "🥈" :
        index === 2 ? "🥉" :
        `${index + 1}.`;

      scoreText +=
        `${rank} ${stats.name} | ` +
        `⭐ ${stats.score} | ` +
        `❌ ${stats.mistakes}/3\n`;
    });

    keyboard.push([
      {
        text: scoreText.trim(),
        callback_data: "noop"
      }
    ]);
  }

  // ==========================================
  // کنترل اعداد
  // ==========================================

  if (
    selectedCell &&
    gameState &&
    gameState.status === "PLAYING"
  ) {

    const selected = gameState.board[selectedCell.r]?.[selectedCell.c];

    // نمایش وضعیت خانه انتخاب‌شده
    if (selected) {
      let cellInfo = "📍 خانه انتخاب‌شده";

      if (selected.given) {
        cellInfo += " | 🔒 ثابت";
      } else if (selected.value !== null) {
        cellInfo += ` | 🔢 ${selected.value}`;
      } else {
        cellInfo += " | ⬜ خالی";
      }

      keyboard.push([
        {
          text: cellInfo,
          callback_data: "noop"
        }
      ]);
    }

    // حالت مداد
    keyboard.push([
      {
        text: gameState.pencilMode
          ? "✏️ حالت مداد: روشن"
          : "✏️ حالت مداد: خاموش",
        callback_data: "toggle_pencil"
      }
    ]);

    // اعداد 1 تا 3
    keyboard.push([
      {
        text: "1️⃣",
        callback_data: "input_1"
      },
      {
        text: "2️⃣",
        callback_data: "input_2"
      },
      {
        text: "3️⃣",
        callback_data: "input_3"
      }
    ]);

    // اعداد 4 تا 6
    keyboard.push([
      {
        text: "4️⃣",
        callback_data: "input_4"
      },
      {
        text: "5️⃣",
        callback_data: "input_5"
      },
      {
        text: "6️⃣",
        callback_data: "input_6"
      }
    ]);

    // اعداد 7 تا 9
    keyboard.push([
      {
        text: "7️⃣",
        callback_data: "input_7"
      },
      {
        text: "8️⃣",
        callback_data: "input_8"
      },
      {
        text: "9️⃣",
        callback_data: "input_9"
      }
    ]);

    // پاک کردن / لغو انتخاب
    keyboard.push([
      {
        text: "🧹 پاک کردن",
        callback_data: "input_0"
      },
      {
        text: "❌ لغو انتخاب",
        callback_data: "deselect"
      }
    ]);

  } else {

    keyboard.push([
      {
        text: "👇 ابتدا یک خانه را از جدول انتخاب کنید",
        callback_data: "noop"
      }
    ]);
  }

  // ==========================================
  // گرید 9×9
  // ==========================================

  const grid = [];

  for (let r = 0; r < 9; r++) {

    const row = [];

    for (let c = 0; c < 9; c++) {

      const cell = gameState.board[r][c];

      let label = "·";

      // عدد موجود
      if (cell.value !== null) {

        // خانه‌های ثابت
        if (cell.given) {
          label = `🔒${cell.value}`;
        }

        // خانه‌ای که کاربر وارد کرده
        else if (cell.isError) {
          label = `❌${cell.value}`;
        }

        else {
          label = `${cell.value}`;
        }
      }

      // خانه انتخاب شده
      if (
        selectedCell &&
        selectedCell.r === r &&
        selectedCell.c === c
      ) {
        label = "📍";
      }

      row.push({
        text: label,
        callback_data: `cell_${r}_${c}`
      });
    }

    grid.push(row);
  }

  // اضافه کردن گرید به کیبورد
  keyboard.push(...grid);

  // ==========================================
  // کنترل‌های پایین
  // ==========================================

  keyboard.push([
    {
      text: "🔄 بازی جدید",
      callback_data: "new_game"
    },
    {
      text: `🎮 ${gameState.status}`,
      callback_data: "noop"
    }
  ]);

  return {
    inline_keyboard: keyboard
  };
}
