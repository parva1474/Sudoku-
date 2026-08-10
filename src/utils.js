// ==========================================
// src/utils.js
// نسخه اصلاح‌شده و استاندارد برای تلگرام
// ==========================================

export function buildControlKeyboard(gameState, selectedCell = null, scoresMap = null) {
  const keyboard = [];

  // ۱. بخش امتیازات
  if (scoresMap && scoresMap.size > 0) {
    let scoreText = "🏆 جدول امتیازات:\n";
    const players = Array.from(scoresMap.values()).sort((a, b) => b.score - a.score);
    players.forEach((stats, index) => {
      const rank = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `${index + 1}.`;
      scoreText += `${rank} ${stats.name} | ⭐ ${stats.score} | ❌ ${stats.mistakes}/3\n`;
    });
    keyboard.push([{ text: scoreText.trim(), callback_data: "noop" }]);
  }

  // ۲. بخش انتخاب خانه
  if (selectedCell) {
    const selected = gameState?.board?.[selectedCell.r]?.[selectedCell.c];
    if (selected) {
      let text = `📍 خانه ${selectedCell.r + 1}،${selectedCell.c + 1} | `;
      text += selected.given ? `🔒 ${selected.value}` : (selected.value !== null ? `🔢 ${selected.value}` : "⬜ خالی");
      keyboard.push([{ text, callback_data: "noop" }]);
    }

    // دکمه مداد
    keyboard.push([{
      text: gameState.pencilMode ? "✏️ مداد: روشن" : "✏️ مداد: خاموش",
      callback_data: "toggle_pencil"
    }]);

    // ۳. ردیف اعداد (استاندارد تلگرام: ۵+۴)
    keyboard.push([
      { text: "1️⃣", callback_data: "input_1" },
      { text: "2️⃣", callback_data: "input_2" },
      { text: "3️⃣", callback_data: "input_3" },
      { text: "4️⃣", callback_data: "input_4" },
      { text: "5️⃣", callback_data: "input_5" }
    ]);
    keyboard.push([
      { text: "6️⃣", callback_data: "input_6" },
      { text: "7️⃣", callback_data: "input_7" },
      { text: "8️⃣", callback_data: "input_8" },
      { text: "9️⃣", callback_data: "input_9" }
    ]);

    // دکمه‌های کنترلی
    keyboard.push([
      { text: "🧹 پاک", callback_data: "input_0" },
      { text: "❌ لغو", callback_data: "deselect" }
    ]);
  } else {
    keyboard.push([{ text: "👇 از روی عکس بالا خانه انتخاب کنید", callback_data: "noop" }]);
  }

  // ۴. دکمه‌های پایین صفحه
  keyboard.push([
    { text: "🔄 بازی جدید", callback_data: "new_game" },
    { text: gameState.status === "COMPLETED" ? "🏆 تمام شد" : "🎮 در حال بازی", callback_data: "noop" }
  ]);

  return { inline_keyboard: keyboard };
}
