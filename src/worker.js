// ==========================================
// src/sudoku-image.js
// Sudoku Board Renderer
// Cloudflare Workers + resvg
// ==========================================

import {
  Resvg
} from "@cf-wasm/resvg/workerd";

const IMAGE_SIZE = 540;
const PADDING = 12;

const BOARD_SIZE =
  IMAGE_SIZE -
  (PADDING * 2);

const CELL_SIZE =
  BOARD_SIZE / 9;


// ==========================================
// اعداد فارسی
// ==========================================

function toPersianDigit(value) {

  const digits = [
    "۰",
    "۱",
    "۲",
    "۳",
    "۴",
    "۵",
    "۶",
    "۷",
    "۸",
    "۹"
  ];

  return String(value).replace(
    /[0-9]/g,
    digit =>
      digits[Number(digit)]
  );
}


// ==========================================
// Escape XML
// ==========================================

function escapeXML(value) {

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}


// ==========================================
// ساخت SVG
// ==========================================

function buildSudokuSVG(game) {

  const svg = [];

  svg.push(`
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="${IMAGE_SIZE}"
      height="${IMAGE_SIZE}"
      viewBox="0 0 ${IMAGE_SIZE} ${IMAGE_SIZE}"
    >
  `);


  // ========================================
  // Background
  // ========================================

  svg.push(`
    <rect
      x="0"
      y="0"
      width="${IMAGE_SIZE}"
      height="${IMAGE_SIZE}"
      fill="#ffffff"
    />
  `);


  // ========================================
  // خانه‌ها
  // ========================================

  for (let row = 0; row < 9; row++) {

    for (let col = 0; col < 9; col++) {

      const index =
        row * 9 + col;

      const x =
        PADDING +
        col * CELL_SIZE;

      const y =
        PADDING +
        row * CELL_SIZE;


      // ======================================
      // خانه انتخاب‌شده
      // ======================================

      if (
        Number(game.selectedCell) === index
      ) {

        svg.push(`
          <rect
            x="${x}"
            y="${y}"
            width="${CELL_SIZE}"
            height="${CELL_SIZE}"
            fill="#dbeafe"
          />
        `);
      }


      // ======================================
      // مقدار خانه
      // ======================================

      const value =
        game.board?.[index];


      if (
        value !== null &&
        value !== undefined &&
        value !== ""
      ) {

        const fixed =
          game.puzzle?.[index] !== null &&
          game.puzzle?.[index] !== undefined;

        const fontSize =
          Math.floor(
            CELL_SIZE * 0.52
          );

        const centerX =
          x +
          CELL_SIZE / 2;

        const centerY =
          y +
          CELL_SIZE / 2;

        svg.push(`
          <text
            x="${centerX}"
            y="${centerY}"
            text-anchor="middle"
            dominant-baseline="central"
            font-family="Arial, sans-serif"
            font-size="${fontSize}px"
            font-weight="700"
            fill="${
              fixed
                ? "#111827"
                : "#2563eb"
            }"
          >
            ${escapeXML(
              toPersianDigit(value)
            )}
          </text>
        `);

      } else {

        // ====================================
        // Pencil Notes
        // ====================================

        const notes =
          Array.isArray(
            game.notes?.[index]
          )
            ? game.notes[index]
            : [];

        if (notes.length > 0) {

          const noteSize =
            Math.floor(
              CELL_SIZE * 0.19
            );


          for (let n = 1; n <= 9; n++) {

            if (!notes.includes(n)) {
              continue;
            }


            const noteRow =
              Math.floor(
                (n - 1) / 3
              );

            const noteCol =
              (n - 1) % 3;


            const nx =
              x +
              CELL_SIZE *
              (
                0.20 +
                noteCol * 0.30
              );


            const ny =
              y +
              CELL_SIZE *
              (
                0.20 +
                noteRow * 0.30
              );


            svg.push(`
              <text
                x="${nx}"
                y="${ny}"
                text-anchor="middle"
                dominant-baseline="central"
                font-family="Arial, sans-serif"
                font-size="${noteSize}px"
                fill="#6b7280"
              >
                ${escapeXML(
                  toPersianDigit(n)
                )}
              </text>
            `);
          }
        }
      }
    }
  }


  // ========================================
  // خطوط نازک جدول
  // ========================================

  for (let i = 0; i <= 9; i++) {

    const position =
      PADDING +
      i * CELL_SIZE;


    svg.push(`
      <line
        x1="${position}"
        y1="${PADDING}"
        x2="${position}"
        y2="${IMAGE_SIZE - PADDING}"
        stroke="#9ca3af"
        stroke-width="1"
      />
    `);


    svg.push(`
      <line
        x1="${PADDING}"
        y1="${position}"
        x2="${IMAGE_SIZE - PADDING}"
        y2="${position}"
        stroke="#9ca3af"
        stroke-width="1"
      />
    `);
  }


  // ========================================
  // خطوط ضخیم 3×3
  // ========================================

  for (let i = 0; i <= 9; i += 3) {

    const position =
      PADDING +
      i * CELL_SIZE;


    svg.push(`
      <line
        x1="${position}"
        y1="${PADDING}"
        x2="${position}"
        y2="${IMAGE_SIZE - PADDING}"
        stroke="#111827"
        stroke-width="3"
      />
    `);


    svg.push(`
      <line
        x1="${PADDING}"
        y1="${position}"
        x2="${IMAGE_SIZE - PADDING}"
        y2="${position}"
        stroke="#111827"
        stroke-width="3"
      />
    `);
  }


  svg.push("</svg>");

  return svg.join("");
}


// ==========================================
// SVG → PNG
// ==========================================

export async function renderSudokuPNG(game) {

  const svg =
    buildSudokuSVG(game);


  const renderer =
    new Resvg(
      svg,
      {
        fitTo: {
          mode: "width",
          value: IMAGE_SIZE
        }
      }
    );


  return renderer
    .render()
    .asPng();
}
// ==========================================
// src/worker.js
// Telegram Sudoku Bot
// Cloudflare Workers + D1
// ==========================================

import {
  sendMessage,
  editMessageText,
  sendPhoto,
  editMessagePhoto,
  answerCallbackQuery
} from "./telegram.js";


import {
  newGame,
  selectCell,
  togglePencilMode,
  toggleNote,
  putNumber,
  eraseNumber,
  getProgress,
  applyHint
} from "./game.js";


import {
  buildSudokuKeyboard,
  buildBlockKeyboard,
  buildCellKeyboard,
  buildNumberKeyboard,
  buildDifficultyKeyboard,
  buildFinishedKeyboard
} from "./keyboard.js";


import {
  generateSudoku,
  getHint
} from "./sudoku.js";


import {
  renderSudokuPNG
} from "./sudoku-image.js";


// ==========================================
// تنظیمات
// ==========================================

const DEFAULT_DIFFICULTY =
  "medium";


const VALID_DIFFICULTIES = [
  "easy",
  "medium",
  "hard",
  "expert",
  "master"
];


// ==========================================
// Worker
// ==========================================

export default {

  async fetch(
    request,
    env
  ) {

    if (
      request.method === "GET"
    ) {

      return new Response(
        "🧩 Sudoku Bot is running.",
        {
          status: 200
        }
      );
    }


    if (
      request.method !== "POST"
    ) {

      return new Response(
        "Method Not Allowed",
        {
          status: 405
        }
      );
    }


    try {

      const update =
        await request.json();


      const token =
        env.BOT_TOKEN;


      if (!token) {

        console.error(
          "BOT_TOKEN is missing."
        );


        return new Response(
          "BOT_TOKEN is missing.",
          {
            status: 500
          }
        );
      }


      // ======================================
      // Message
      // ======================================

      if (
        update.message
      ) {

        await handleMessage(
          update.message,
          env,
          token
        );
      }


      // ======================================
      // Callback
      // ======================================

      if (
        update.callback_query
      ) {

        await handleCallbackQuery(
          update.callback_query,
          env,
          token
        );
      }


      return new Response(
        "OK",
        {
          status: 200
        }
      );


    } catch (error) {

      console.error(
        "Worker error:",
        error
      );


      return new Response(
        "Internal Server Error",
        {
          status: 500
        }
      );
    }
  }
};


// ==========================================
// Message Handler
// ==========================================

async function handleMessage(
  message,
  env,
  token
) {

  if (!message.chat) {
    return;
  }


  const chatId =
    String(
      message.chat.id
    );


  const userId =
    String(
      message.from?.id ??
      message.chat.id
    );


  const text =
    String(
      message.text || ""
    ).trim();


  // ========================================
  // /start
  // ========================================

  if (
    text === "/start"
  ) {

    await sendWelcome(
      token,
      chatId
    );

    return;
  }


  // ========================================
  // /new
  // ========================================

  if (
    text === "/new"
  ) {

    await startNewGame(
      env,
      token,
      chatId,
      userId,
      DEFAULT_DIFFICULTY
    );

    return;
  }


  // ========================================
  // Difficulty commands
  // ========================================

  const difficultyCommands = {

    "/easy":
      "easy",

    "/medium":
      "medium",

    "/hard":
      "hard",

    "/expert":
      "expert",

    "/master":
      "master"
  };


  if (
    difficultyCommands[text]
  ) {

    await startNewGame(
      env,
      token,
      chatId,
      userId,
      difficultyCommands[text]
    );

    return;
  }


  // ========================================
  // /game
  // ========================================

  if (
    text === "/game"
  ) {

    const game =
      await loadGame(
        env,
        chatId
      );


    if (!game) {

      await sendMessage(
        token,
        chatId,
        "هنوز بازی فعالی نداری.\n\nبرای شروع /new را بزن."
      );

      return;
    }


    await sendGameMessage(
      token,
      chatId,
      game
    );

    return;
  }


  // ========================================
  // /help
  // ========================================

  if (
    text === "/help"
  ) {

    await sendHelp(
      token,
      chatId
    );

    return;
  }
}


// ==========================================
// Welcome
// ==========================================

async function sendWelcome(
  token,
  chatId
) {

  const text = [

    "🧩 <b>Sudoku</b>",

    "",

    "به بازی سودوکو خوش آمدی!",

    "",

    "درجه سختی را انتخاب کن:"

  ].join("\n");


  await sendMessage(
    token,
    chatId,
    text,
    buildDifficultyKeyboard()
  );
}


// ==========================================
// Help
// ==========================================

async function sendHelp(
  token,
  chatId
) {

  const text = [

    "🧩 <b>راهنمای Sudoku</b>",

    "",

    "👆 ابتدا یکی از ۹ بلوک را انتخاب کن.",

    "🔲 سپس خانه موردنظر را انتخاب کن.",

    "🔢 بعد عدد موردنظر را انتخاب کن.",

    "✏️ برای Pencil حالت مداد را روشن کن.",

    "🧹 برای پاک کردن عدد استفاده کن.",

    "💡 راهنمایی یک حرکت درست انجام می‌دهد.",

    "",

    "🔒 خانه‌های اولیه قابل تغییر نیستند.",

    "",

    "👥 بازی در گروه قابل انجام است."

  ].join("\n");


  await sendMessage(
    token,
    chatId,
    text
  );
}


// ==========================================
// شروع بازی جدید
// ==========================================

async function startNewGame(
  env,
  token,
  chatId,
  userId,
  difficulty
) {

  if (
    !VALID_DIFFICULTIES.includes(
      difficulty
    )
  ) {

    difficulty =
      DEFAULT_DIFFICULTY;
  }


  let generated;


  try {

    generated =
      generateSudoku(
        difficulty
      );


  } catch (error) {

    console.error(
      "Sudoku generation error:",
      error
    );


    await sendMessage(
      token,
      chatId,
      "❌ ساخت جدول Sudoku با خطا مواجه شد."
    );


    return;
  }


  const game =
    newGame(
      difficulty,
      generated.puzzle,
      generated.solution
    );


  await saveGame(
    env,
    chatId,
    userId,
    game
  );


  await sendGameMessage(
    token,
    chatId,
    game
  );
}


// ==========================================
// ارسال بازی به صورت عکس
// ==========================================

async function sendGameMessage(
  token,
  chatId,
  game
) {

  const png =
    await renderSudokuPNG(
      game
    );


  const caption =
    createBoardText(
      game
    );


  await sendPhoto(
    token,
    chatId,
    png,
    caption,
    buildBlockKeyboard(
      game
    )
  );
}


// ==========================================
// ویرایش بازی به صورت عکس
// ==========================================

async function editGameMessage(
  token,
  message,
  game,
  keyboard = null
) {

  const png =
    await renderSudokuPNG(
      game
    );


  const caption =
    createBoardText(
      game
    );


  await editMessagePhoto(
    token,
    message.chat.id,
    message.message_id,
    png,
    caption,
    keyboard ||
      buildBlockKeyboard(game)
  );
}


// ==========================================
// Callback Handler
// ==========================================

async function handleCallbackQuery(
  callback,
  env,
  token
) {

  const callbackId =
    callback.id;


  const message =
    callback.message;


  if (!message) {

    await answerCallbackQuery(
      token,
      callbackId
    );

    return;
  }


  const chatId =
    String(
      message.chat.id
    );


  const userId =
    String(
      callback.from?.id ??
      message.chat.id
    );


  const data =
    String(
      callback.data || ""
    );


  // ========================================
  // Difficulty
  // ========================================

  if (
    data.startsWith(
      "difficulty:"
    )
  ) {

    const difficulty =
      data.split(":")[1];


    if (
      !VALID_DIFFICULTIES.includes(
        difficulty
      )
    ) {

      await answerCallbackQuery(
        token,
        callbackId,
        "درجه سختی نامعتبر است."
      );

      return;
    }


    let generated;


    try {

      generated =
        generateSudoku(
          difficulty
        );


    } catch (error) {

      console.error(
        "Sudoku generation error:",
        error
      );


      await answerCallbackQuery(
        token,
        callbackId,
        "❌ خطا در ساخت جدول."
      );


      return;
    }


    const game =
      newGame(
        difficulty,
        generated.puzzle,
        generated.solution
      );


    await saveGame(
      env,
      chatId,
      userId,
      game
    );


    /*
     * اینجا پیام قبلی متنی است
     * بنابراین editMessageText استفاده می‌شود.
     */

    await editMessageText(
      token,
      message.chat.id,
      message.message_id,
      createBoardText(game),
      buildBlockKeyboard(game)
    );


    await answerCallbackQuery(
      token,
      callbackId,
      "🎮 بازی شروع شد."
    );


    return;
  }


  // ========================================
  // Load Game
  // ========================================

  const game =
    await loadGame(
      env,
      chatId
    );


  if (!game) {

    await answerCallbackQuery(
      token,
      callbackId,
      "بازی فعالی پیدا نشد."
    );

    return;
  }


  // ========================================
  // انتخاب بلوک
  // ========================================

  if (
    data.startsWith(
      "block:"
    )
  ) {

    const block =
      Number(
        data.split(":")[1]
      );


    if (
      !Number.isInteger(block) ||
      block < 0 ||
      block > 8
    ) {

      await answerCallbackQuery(
        token,
        callbackId,
        "بلوک نامعتبر است."
      );

      return;
    }


    await editGameMessage(
      token,
      message,
      game,
      buildCellKeyboard(
        block,
        game
      )
    );


    await answerCallbackQuery(
      token,
      callbackId
    );


    return;
  }


  // ========================================
  // برگشت به بلوک‌ها
  // ========================================

  if (
    data === "action:blocks"
  ) {

    await editGameMessage(
      token,
      message,
      game,
      buildBlockKeyboard(
        game
      )
    );


    await answerCallbackQuery(
      token,
      callbackId
    );


    return;
  }


  // ========================================
  // برگشت به خانه‌ها
  // ========================================

  if (
    data === "action:cells"
  ) {

    const selected =
      Number(
        game.selectedCell
      );


    if (
      Number.isInteger(selected) &&
      selected >= 0 &&
      selected < 81
    ) {

      const row =
        Math.floor(
          selected / 9
        );


      const col =
        selected % 9;


      const block =
        Math.floor(row / 3) * 3 +
        Math.floor(col / 3);


      await editGameMessage(
        token,
        message,
        game,
        buildCellKeyboard(
          block,
          game
        )
      );


    } else {

      await editGameMessage(
        token,
        message,
        game,
        buildBlockKeyboard(
          game
        )
      );
    }


    await answerCallbackQuery(
      token,
      callbackId
    );


    return;
  }


  // ========================================
  // انتخاب خانه
  // ========================================

  if (
    data.startsWith(
      "cell:"
    )
  ) {

    const index =
      Number(
        data.split(":")[1]
      );


    if (
      !Number.isInteger(index) ||
      index < 0 ||
      index >= 81
    ) {

      await answerCallbackQuery(
        token,
        callbackId,
        "خانه نامعتبر است."
      );

      return;
    }


    selectCell(
      game,
      index
    );


    await saveGame(
      env,
      chatId,
      userId,
      game
    );


    // ======================================
    // خانه ثابت
    // ======================================

    if (
      game.puzzle[index] !== null &&
      game.puzzle[index] !== undefined
    ) {

      await editGameMessage(
        token,
        message,
        game,
        buildNumberKeyboard(
          game
        )
      );


      await answerCallbackQuery(
        token,
        callbackId,
        "🔒 این خانه ثابت است."
      );


      return;
    }


    // ======================================
    // خانه آزاد
    // ======================================

    await editGameMessage(
      token,
      message,
      game,
      buildNumberKeyboard(
        game
      )
    );


    await answerCallbackQuery(
      token,
      callbackId
    );


    return;
  }


  // ========================================
  // Pencil
  // ========================================

  if (
    data === "mode:pencil"
  ) {

    togglePencilMode(
      game
    );


    await saveGame(
      env,
      chatId,
      userId,
      game
    );


    await editGameMessage(
      token,
      message,
      game,
      buildNumberKeyboard(
        game
      )
    );


    await answerCallbackQuery(
      token,
      callbackId,
      game.pencilMode
        ? "✏️ مداد روشن شد."
        : "✏️ مداد خاموش شد."
    );


    return;
  }


  // ========================================
  // Erase
  // ========================================

  if (
    data === "mode:erase"
  ) {

    if (
      game.selectedCell === -1
    ) {

      await answerCallbackQuery(
        token,
        callbackId,
        "اول یک خانه انتخاب کن."
      );

      return;
    }


    const result =
      eraseNumber(
        game,
        game.selectedCell
      );


    await saveGame(
      env,
      chatId,
      userId,
      game
    );


    await editGameMessage(
      token,
      message,
      game,
      buildNumberKeyboard(
        game
      )
    );


    await answerCallbackQuery(
      token,
      callbackId,
      result.ok
        ? "🧹 پاک شد."
        : result.message
    );


    return;
  }


  // ========================================
  // Number
  // ========================================

  if (
    data.startsWith(
      "num:"
    )
  ) {

    if (
      game.selectedCell === -1
    ) {

      await answerCallbackQuery(
        token,
        callbackId,
        "اول یک خانه انتخاب کن."
      );

      return;
    }


    const number =
      Number(
        data.split(":")[1]
      );


    if (
      !Number.isInteger(number) ||
      number < 1 ||
      number > 9
    ) {

      await answerCallbackQuery(
        token,
        callbackId,
        "عدد نامعتبر است."
      );

      return;
    }


    const index =
      game.selectedCell;


    // ======================================
    // Pencil
    // ======================================

    if (
      game.pencilMode
    ) {

      const result =
        toggleNote(
          game,
          number
        );


      await saveGame(
        env,
        chatId,
        userId,
        game
      );


      await editGameMessage(
        token,
        message,
        game,
        buildNumberKeyboard(
          game
        )
      );


      await answerCallbackQuery(
        token,
        callbackId,
        result.ok
          ? (
              result.added
                ? `✏️ ${number} اضافه شد.`
                : `✏️ ${number} حذف شد.`
            )
          : result.message
      );


      return;
    }


    // ======================================
    // عدد اصلی
    // ======================================

    const result =
      putNumber(
        game,
        index,
        number
      );


    await saveGame(
      env,
      chatId,
      userId,
      game
    );


    // ======================================
    // برنده
    // ======================================

    if (
      result.won
    ) {

      await editGameMessage(
        token,
        message,
        game,
        buildFinishedKeyboard()
      );


      await answerCallbackQuery(
        token,
        callbackId,
        "🎉 تبریک! Sudoku حل شد."
      );


      return;
    }


    // ======================================
    // اشتباه
    // ======================================

    if (
      result.mistake
    ) {

      await editGameMessage(
        token,
        message,
        game,
        buildNumberKeyboard(
          game
        )
      );


      await answerCallbackQuery(
        token,
        callbackId,
        `❌ اشتباه! خطا: ${game.mistakes}`
      );


      return;
    }


    // ======================================
    // درست
    // ======================================

    await editGameMessage(
      token,
      message,
      game,
      buildBlockKeyboard(
        game
      )
    );


    await answerCallbackQuery(
      token,
      callbackId,
      "✅ درست!"
    );


    return;
  }


  // ========================================
  // Hint
  // ========================================

  if (
    data === "action:hint"
  ) {

    let hintResult =
      null;


    try {

      hintResult =
        getHint(
          game.board,
          game.solution
        );


    } catch (error) {

      console.error(
        "Hint error:",
        error
      );
    }


    if (
      !hintResult
    ) {

      await answerCallbackQuery(
        token,
        callbackId,
        "💡 راهنمایی در دسترس نیست."
      );

      return;
    }


    const result =
      applyHint(
        game,
        game.selectedCell,
        hintResult.index,
        hintResult.number
      );


    await saveGame(
      env,
      chatId,
      userId,
      game
    );


    if (
      result.won
    ) {

      await editGameMessage(
        token,
        message,
        game,
        buildFinishedKeyboard()
      );


      await answerCallbackQuery(
        token,
        callbackId,
        "🎉 راهنمایی باعث تکمیل جدول شد."
      );


      return;
    }


    await editGameMessage(
      token,
      message,
      game,
      buildBlockKeyboard(
        game
      )
    );


    await answerCallbackQuery(
      token,
      callbackId,
      result.message
    );


    return;
  }


  // ========================================
  // New Game
  // ========================================

  if (
    data === "action:new"
  ) {

    const freshGenerated =
      generateSudoku(
        game.difficulty
      );


    const freshGame =
      newGame(
        game.difficulty,
        freshGenerated.puzzle,
        freshGenerated.solution
      );


    await saveGame(
      env,
      chatId,
      userId,
      freshGame
    );


    /*
     * چون پیام فعلی عکس است،
     * باید عکس را ویرایش کنیم.
     */

    await editGameMessage(
      token,
      message,
      freshGame,
      buildBlockKeyboard(
        freshGame
      )
    );


    await answerCallbackQuery(
      token,
      callbackId,
      "🔄 بازی جدید ساخته شد."
    );


    return;
  }


  // ========================================
  // Unknown callback
  // ========================================

  await answerCallbackQuery(
    token,
    callbackId
  );
}


// ==========================================
// متن کپشن بازی
// ==========================================

function createBoardText(
  game
) {

  const lines = [];


  lines.push(
    "🧩 <b>Sudoku</b>"
  );


  lines.push(
    `🎯 سطح: ${getDifficultyName(
      game.difficulty
    )}`
  );


  lines.push(
    `📊 پیشرفت: ${
      getProgress(game)
    }%`
  );


  lines.push(
    `❌ اشتباه: ${
      game.mistakes || 0
    }`
  );


  lines.push(
    `💡 راهنمایی: ${
      game.hints || 0
    }`
  );


  lines.push("");


  if (
    game.status === "won"
  ) {

    lines.push(
      "🎉 <b>جدول حل شد!</b>"
    );

  } else {

    lines.push(
      "👆 یکی از ۹ بلوک را انتخاب کن."
    );
  }


  return lines.join(
    "\n"
  );
}


// ==========================================
// نام سختی
// ==========================================

function getDifficultyName(
  difficulty
) {

  const names = {

    easy:
      "🟢 آسان",

    medium:
      "🟡 متوسط",

    hard:
      "🔴 سخت",

    expert:
      "🟣 خیلی سخت",

    master:
      "⚫ استاد"

  };


  return (
    names[difficulty] ||
    difficulty
  );
}


// ==========================================
// ذخیره بازی
// ==========================================

async function saveGame(
  env,
  chatId,
  userId,
  game
) {

  if (!env.DB) {

    throw new Error(
      "D1 binding DB is missing."
    );
  }


  const now =
    Date.now();


  await env.DB
    .prepare(`
      INSERT OR REPLACE INTO games (
        chat_id,
        user_id,
        puzzle,
        solution,
        board,
        notes,
        selected_cell,
        difficulty,
        mistakes,
        hints,
        pencil_mode,
        status,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .bind(

      chatId,

      userId,

      JSON.stringify(
        game.puzzle
      ),

      JSON.stringify(
        game.solution
      ),

      JSON.stringify(
        game.board
      ),

      JSON.stringify(
        game.notes || []
      ),

      Number(
        game.selectedCell ?? -1
      ),

      game.difficulty,

      Number(
        game.mistakes || 0
      ),

      Number(
        game.hints || 0
      ),

      game.pencilMode
        ? 1
        : 0,

      game.status ||
        "playing",

      Number(
        game.createdAt ||
        now
      ),

      now

    )
    .run();
}


// ==========================================
// دریافت بازی
// ==========================================

async function loadGame(
  env,
  chatId
) {

  if (!env.DB) {

    throw new Error(
      "D1 binding DB is missing."
    );
  }


  const row =
    await env.DB
      .prepare(`
        SELECT *
        FROM games
        WHERE chat_id = ?
        LIMIT 1
      `)
      .bind(
        chatId
      )
      .first();


  if (!row) {
    return null;
  }


  return {

    puzzle:
      safeJSON(
        row.puzzle,
        []
      ),

    solution:
      safeJSON(
        row.solution,
        []
      ),

    board:
      safeJSON(
        row.board,
        []
      ),

    notes:
      safeJSON(
        row.notes,
        []
      ),

    selectedCell:
      Number(
        row.selected_cell ?? -1
      ),

    difficulty:
      row.difficulty,

    mistakes:
      Number(
        row.mistakes || 0
      ),

    hints:
      Number(
        row.hints || 0
      ),

    pencilMode:
      Boolean(
        row.pencil_mode
      ),

    status:
      row.status,

    createdAt:
      Number(
        row.created_at || 0
      ),

    updatedAt:
      Number(
        row.updated_at || 0
      )
  };
}


// ==========================================
// JSON امن
// ==========================================

function safeJSON(
  value,
  fallback
) {

  try {

    if (
      value === null ||
      value === undefined
    ) {

      return fallback;
    }


    return JSON.parse(
      value
    );


  } catch {

    return fallback;
  }
}
