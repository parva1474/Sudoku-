// ==========================================
// src/utils.js
// کیبورد کنترل سودوکو
// ==========================================

export function buildControlKeyboard(
  gameState,
  selectedCell = null,
  scoresMap = null
) {

  const keyboard = [];

  // ==========================================
  // جدول امتیازات
  // ==========================================

  if (
    scoresMap &&
    scoresMap.size > 0
  ) {

    let scoreText =
      "🏆 جدول امتیازات:\n";

    const players =
      Array.from(
        scoresMap.values()
      ).sort(
        (a, b) =>
          b.score - a.score
      );

    players.forEach(
      (stats, index) => {

        const rank =
          index === 0
            ? "🥇"
            : index === 1
              ? "🥈"
              : index === 2
                ? "🥉"
                : `${index + 1}.`;

        scoreText +=
          `${rank} ${stats.name} | ` +
          `⭐ ${stats.score} | ` +
          `❌ ${stats.mistakes}/3\n`;
      }
    );

    keyboard.push([
      {
        text:
          scoreText.trim(),
        callback_data:
          "noop"
      }
    ]);
  }

  // ==========================================
  // وضعیت خانه انتخاب‌شده
  // ==========================================

  if (selectedCell) {

    const selected =
      gameState
        ?.board?.[
          selectedCell.r
        ]?.[
          selectedCell.c
        ];

    if (selected) {

      let text =
        `📍 خانه ${selectedCell.r + 1}،${selectedCell.c + 1}`;

      if (selected.given) {

        text +=
          ` | 🔒 ${selected.value}`;

      } else if (
        selected.value !== null &&
        selected.value !== undefined
      ) {

        text +=
          ` | 🔢 ${selected.value}`;

      } else {

        text +=
          " | ⬜ خالی";
      }

      keyboard.push([
        {
          text,
          callback_data:
            "noop"
        }
      ]);
    }

    // ========================================
    // مداد
    // ========================================

    keyboard.push([
      {
        text:
          gameState.pencilMode
            ? "✏️ مداد: روشن"
            : "✏️ مداد: خاموش",

        callback_data:
          "toggle_pencil"
      }
    ]);

    // ========================================
    // اعداد
    // ========================================

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

    keyboard.push([
      {
        text:
          "🧹 پاک کردن",

        callback_data:
          "input_0"
      },
      {
        text:
          "❌ لغو انتخاب",

        callback_data:
          "deselect"
      }
    ]);

  } else {

    keyboard.push([
      {
        text:
          "👇 ابتدا یک خانه از جدول انتخاب کنید",

        callback_data:
          "noop"
      }
    ]);
  }

  // ==========================================
  // جدول 9×9
  // ==========================================

  for (
    let r = 0;
    r < 9;
    r++
  ) {

    const row = [];

    for (
      let c = 0;
      c < 9;
      c++
    ) {

      const cell =
        gameState.board[r][c];

      let label =
        "·";

      if (
        cell.value !== null &&
        cell.value !== undefined
      ) {

        if (cell.given) {

          label =
            `🔒${cell.value}`;

        } else if (
          cell.isError
        ) {

          label =
            `❌${cell.value}`;

        } else {

          label =
            String(cell.value);
        }
      }

      // ======================================
      // خانه انتخاب‌شده
      // ======================================

      if (
        selectedCell &&
        selectedCell.r === r &&
        selectedCell.c === c
      ) {

        label =
          cell.value !== null &&
          cell.value !== undefined
            ? `🔵${cell.value}`
            : "🔵";
      }

      row.push({
        text:
          label,

        callback_data:
          `cell_${r}_${c}`
      });
    }

    keyboard.push(row);
  }

  // ==========================================
  // پایین جدول
  // ==========================================

  keyboard.push([
    {
      text:
        "🔄 بازی جدید",

      callback_data:
        "new_game"
    },

    {
      text:
        gameState.status === "COMPLETED"
          ? "🏆 تمام شد"
          : "🎮 در حال بازی",

      callback_data:
        "noop"
    }
  ]);

  return {
    inline_keyboard:
      keyboard
  };
}
