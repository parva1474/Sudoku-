const BOT_TOKEN = '8604292634:AAHBsJ9HXgISutUw6S0qTRcOWi08nn38ZuY';
const REQUIRED_CHANNELS = ['@nwechannell', '@parvapoem'];

export default {
  async fetch(request, env, ctx) {
    if (request.method !== 'POST') {
      return new Response('Bot is running and ready!');
    }

    try {
      const update = await request.json();

      if (update.inline_query) {
        await handleInlineQuery(update.inline_query, BOT_TOKEN);
      } else if (update.callback_query) {
        await handleCallbackQuery(update.callback_query, BOT_TOKEN);
      }

      return new Response('OK');
    } catch (e) {
      console.error(e);
      return new Response(e.message, { status: 500 });
    }
  }
};

// ----------------------------------------------------
// 1. Sudoku Generator & Solver Engine
// ----------------------------------------------------
function isValid(board, row, col, num) {
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

function solveSudoku(board) {
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

function generateNewGame() {
  // تولید جدول کامل حل شده به عنوان Solution اصلی
  let solutionBoard = Array(9).fill(0).map(() => Array(9).fill(0));
  solveSudoku(solutionBoard);

  // کپی برای ساخت معما با حذف ۳۵ خانه
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

  // ساخت ساختار پیشرفته سلول‌ها بر اساس معماری مشخص‌شده
  let board = [];
  for (let r = 0; r < 9; r++) {
    let row = [];
    for (let c = 0; c < 9; c++) {
      let val = puzzleBoard[r][c];
      row.push({
        value: val !== 0 ? val : null,
        solutionValue: solutionBoard[r][c],
        given: val !== 0,
        notes: [], // یادداشت‌های مدادی
        isError: false,
        isHint: false
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

// ----------------------------------------------------
// 2. UI & Keyboard Renderers
// ----------------------------------------------------
function buildSudokuKeyboard(gameState, selectedCell = null) {
  let keyboard = [];
  const emojis = ['⬛', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣'];
  const board = gameState.board;

  for (let r = 0; r < 9; r++) {
    let row = [];
    for (let c = 0; c < 9; c++) {
      let cell = board[r][c];
      let text = '';

      if (cell.value !== null) {
        text = emojis[cell.value];
        if (cell.isError) text = '❌'; // نمایش خطا در صورت اشتباه بودن
      } else if (cell.notes && cell.notes.length > 0) {
        text = '✍️'; // نشانگر وجود یادداشت مدادی
      } else {
        text = emojis[0];
      }

      // هایلایت کردن خانه انتخاب شده
      if (selectedCell && selectedCell.r === r && selectedCell.c === c) {
        text = '📍 ' + text;
      }

      row.push({
        text: text,
        callback_data: `select_${r}_${c}`
      });
    }
    keyboard.push(row);

    // خط فاصله استاندارد بین بلوک‌های ۳ در ۳
    if (r === 2 || r === 5) {
      keyboard.push([
        { text: "🔹 🔹 🔹 🔹 🔹 🔹 🔹 🔹 🔹", callback_data: "noop" }
      ]);
    }
  }

  // اگر خانه‌ای انتخاب شده باشد و بازی در جریان باشد، کنترل‌های پایین صفحه نمایش داده می‌شوند
  if (selectedCell && gameState.status === 'PLAYING') {
    const { r, c } = selectedCell;
    const cell = board[r][c];

    // دکمه‌های حالت مداد (Toggle Pencil Mode)
    keyboard.push([
      { 
        text: gameState.pencilMode ? "✏️ حالت مداد: روشن" : "✏️ حالت مداد: خاموش", 
        callback_data: "toggle_pencil" 
      }
    ]);

    // اعداد ۱ تا ۵
    keyboard.push([
      { text: "1️⃣", callback_data: `input_${r}_${c}_1` },
      { text: "2️⃣", callback_data: `input_${r}_${c}_2` },
      { text: "3️⃣", callback_data: `input_${r}_${c}_3` },
      { text: "4️⃣", callback_data: `input_${r}_${c}_4` },
      { text: "5️⃣", callback_data: `input_${r}_${c}_5` }
    ]);
    // اعداد ۶ تا ۹ و پاک کردن
    keyboard.push([
      { text: "6️⃣", callback_data: `input_${r}_${c}_6` },
      { text: "7️⃣", callback_data: `input_${r}_${c}_7` },
      { text: "8️⃣", callback_data: `input_${r}_${c}_8` },
      { text: "9️⃣", callback_data: `input_${r}_${c}_9` },
      { text: "🗑 پاک", callback_data: `input_${r}_${c}_0` }
    ]);
  }

  // دکمه‌های کنترل کلی بازی
  keyboard.push([
    { text: "🔄 بازی جدید", callback_data: "new_game" },
    { text: `خطاها: ${gameState.mistakes}/${gameState.maxMistakes}`, callback_data: "noop" }
  ]);

  return keyboard;
}

// ----------------------------------------------------
// 3. Telegram Handlers & Game Logic Execution
// ----------------------------------------------------
async function handleInlineQuery(inlineQuery, token) {
  const queryId = inlineQuery.id;
  const gameState = generateNewGame();
  activeGames.set('inline_' + queryId, gameState);

  const keyboard = buildSudokuKeyboard(gameState, null);

  const results = [
    {
      type: 'article',
      id: 'sudoku_' + Date.now(),
      title: '🧩 شروع بازی استاندارد سودوکو',
      description: 'ارسال جدول سودوکو به گروه با رعایت کامل قوانین',
      input_message_content: {
        message_text: "🧩 **بازی سودوکو گروهی**\n\nبرای بازی روی خانه‌های جدول کلیک کنید تا انتخاب شوند، سپس عدد یا یادداشت مدادی خود را از پایین صفحه وارد کنید.\n\n⚠️ *توجه: برای بازی باید عضو کانال‌های زیر باشید:* \n@nwechannell \n@parvapoem",
        parse_mode: 'Markdown'
      },
      reply_markup: {
        inline_keyboard: keyboard
      }
    }
  ];

  await fetch(`https://api.telegram.org/bot${token}/answerInlineQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      inline_query_id: queryId,
      results: results,
      cache_time: 0
    })
  });
}

async function checkUserMembership(userId, token) {
  for (const channel of REQUIRED_CHANNELS) {
    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/getChatMember?chat_id=${channel}&user_id=${userId}`);
      const data = await res.json();
      if (!data.ok || ['left', 'kicked', 'restricted'].includes(data.result.status)) {
        return false;
      }
    } catch (e) {
      return false;
    }
  }
  return true;
}

// ذخیره‌سازی وضعیت بازی‌ها در حافظه Worker
const activeGames = new Map();
const selectedCellsMap = new Map();

async function handleCallbackQuery(callbackQuery, token) {
  const userId = callbackQuery.from.id;
  const data = callbackQuery.data;

  if (data === 'noop') {
    await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callback_query_id: callbackQuery.id })
    });
    return;
  }

  const isMember = await checkUserMembership(userId, token);
  if (!isMember) {
    await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        callback_query_id: callbackQuery.id,
        text: "⚠️ برای بازی باید ابتدا در کانال‌های @nwechannell و @parvapoem عضو شوید!",
        show_alert: true
      })
    });
    return;
  }

  await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ callback_query_id: callbackQuery.id })
  });

  let editPayload = {};
  let messageKey = '';
  if (callbackQuery.inline_message_id) {
    editPayload.inline_message_id = callbackQuery.inline_message_id;
    messageKey = callbackQuery.inline_message_id;
  } else if (callbackQuery.message) {
    editPayload.chat_id = callbackQuery.message.chat.id;
    editPayload.message_id = callbackQuery.message.message_id;
    messageKey = `${callbackQuery.message.chat.id}_${callbackQuery.message.message_id}`;
  }

  if (!activeGames.has(messageKey)) {
    activeGames.set(messageKey, generateNewGame());
  }
  let gameState = activeGames.get(messageKey);
  let selectedCell = selectedCellsMap.get(messageKey) || null;

  if (data === 'new_game') {
    gameState = generateNewGame();
    activeGames.set(messageKey, gameState);
    selectedCell = null;
    selectedCellsMap.set(messageKey, null);
  } else if (data === 'toggle_pencil') {
    gameState.pencilMode = !gameState.pencilMode;
  } else if (data.startsWith('select_')) {
    const [, r, c] = data.split('_');
    selectedCell = { r: parseInt(r), c: parseInt(c) };
    selectedCellsMap.set(messageKey, selectedCell);
  } else if (data.startsWith('input_')) {
    const [, rStr, cStr, valStr] = data.split('_');
    const r = parseInt(rStr);
    const c = parseInt(cStr);
    const val = parseInt(valStr);
    let cell = gameState.board[r][c];

    // خانه‌های Given قابل تغییر نیستند
    if (!cell.given) {
      if (gameState.pencilMode) {
        // حالت مداد (Pencil Mark)
        if (val === 0) {
          cell.notes = [];
        } else {
          if (cell.notes.includes(val)) {
            cell.notes = cell.notes.filter(n => n !== val);
          } else {
            cell.notes.push(val);
          }
        }
      } else {
        // حالت ورود عدد اصلی (Value Mode)
        if (val === 0) {
          cell.value = null;
          cell.isError = false;
        } else {
          cell.value = val;
          cell.notes = []; // پاک کردن یادداشت‌ها هنگام ورود عدد قطعی

          // تفکیک دقیق Valid Move از Correct Move
          // بررسی خطای محلی بر اساس مقادیر فعلی جدول
          let tempVals = gameState.board.map(row => row.map(cell => cell.value));
          tempVals[r][c] = null; // موقتاً خالی کنیم تا خودش با خودش مقایسه نشود
          let isValidLocal = isValid(tempVals, r, c, val);

          if (!isValidLocal) {
            cell.isError = true;
            gameState.mistakes++;
          } else if (val !== cell.solutionValue) {
            // حرکت معتبر است ولی با جواب نهایی تطابق ندارد (حالت Allow With Error)
            cell.isError = true;
            gameState.mistakes++;
          } else {
            cell.isError = false;
            // پاکسازی خودکار کاندیداهای مرتبط در صورت فعال بودن Auto Pencil Cleanup
            for (let i = 0; i < 9; i++) {
              gameState.board[r][i].notes = gameState.board[r][i].notes.filter(n => n !== val);
              gameState.board[i][c].notes = gameState.board[i][c].notes.filter(n => n !== val);
            }
            const startRow = Math.floor(r / 3) * 3;
            const startCol = Math.floor(c / 3) * 3;
            for (let br = 0; br < 3; br++) {
              for (let bc = 0; bc < 3; bc++) {
                gameState.board[startRow + br][startCol + bc].notes = gameState.board[startRow + br][startCol + bc].notes.filter(n => n !== val);
              }
            }
          }
        }
      }

      // بررسی وضعیت پایان بازی (COMPLETED یا FAILED)
      if (gameState.mistakes >= gameState.maxMistakes) {
        gameState.status = 'FAILED';
      } else {
        let isComplete = true;
        let isAllCorrect = true;
        for (let row = 0; row < 9; row++) {
          for (let col = 0; col < 9; col++) {
            let cl = gameState.board[row][col];
            if (cl.value === null) isComplete = false;
            if (cl.value !== cl.solutionValue) isAllCorrect = false;
          }
        }
        if (isComplete && isAllCorrect) {
          gameState.status = 'COMPLETED';
        }
      }
    }
  }

  editPayload.reply_markup = { inline_keyboard: buildSudokuKeyboard(gameState, selectedCell) };

  await fetch(`https://api.telegram.org/bot${token}/editMessageReplyMarkup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(editPayload)
  });
}
