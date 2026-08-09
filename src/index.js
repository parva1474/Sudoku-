import { generateNewGame, isValid } from './sudoku.js';
import { renderSudokuSVG } from './sudokuRenderer.js';
import { sendSudokuPhoto, updateSudokuPhoto, answerCallback } from './telegram.js';
import { buildControlKeyboard } from './utils.js';

const BOT_TOKEN = '8604292634:AAHBsJ9HXgISutUw6S0qTRcOWi08nn38ZuY';
const activeGames = new Map();
const selectedCellsMap = new Map();

export default {
  async fetch(request, env, ctx) {
    if (request.method !== 'POST') {
      return new Response('Sudoku Bot is running!');
    }

    try {
      const update = await request.json();

      if (update.message && update.message.text === '/start') {
        const chatId = update.message.chat.id;
        const gameState = generateNewGame();
        const sessionKey = `chat_${chatId}`;
        
        activeGames.set(sessionKey, gameState);
        selectedCellsMap.set(sessionKey, null);

        const svg = renderSudokuSVG(gameState, null);
        const keyboard = buildControlKeyboard(gameState, null);

        await sendSudokuPhoto(BOT_TOKEN, chatId, svg, keyboard);
      } else if (update.callback_query) {
        const cq = update.callback_query;
        const chatId = cq.message.chat.id;
        const messageId = cq.message.message_id;
        const sessionKey = `chat_${chatId}`;

        if (!activeGames.has(sessionKey)) {
          activeGames.set(sessionKey, generateNewGame());
        }

        let gameState = activeGames.get(sessionKey);
        let selectedCell = selectedCellsMap.get(sessionKey) || null;
        const data = cq.data;

        if (data === 'noop') {
          await answerCallback(BOT_TOKEN, cq.id);
          return new Response('OK');
        }

        if (data === 'new_game') {
          gameState = generateNewGame();
          activeGames.set(sessionKey, gameState);
          selectedCell = null;
          selectedCellsMap.set(sessionKey, null);
        } else if (data === 'toggle_pencil') {
          gameState.pencilMode = !gameState.pencilMode;
        } else if (data === 'deselect') {
          selectedCell = null;
          selectedCellsMap.set(sessionKey, null);
        } else if (data.startsWith('cell_')) {
          const [, r, c] = data.split('_');
          selectedCell = { r: parseInt(r), c: parseInt(c) };
          selectedCellsMap.set(sessionKey, selectedCell);
        } else if (data.startsWith('input_') && selectedCell) {
          const val = parseInt(data.split('_')[1]);
          const { r, c } = selectedCell;
          let cell = gameState.board[r][c];

          if (!cell.given) {
            if (gameState.pencilMode) {
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
              if (val === 0) {
                cell.value = null;
                cell.isError = false;
              } else {
                cell.value = val;
                cell.notes = [];

                let tempVals = gameState.board.map(row => row.map(cell => cell.value));
                tempVals[r][c] = null;
                let isValidLocal = isValid(tempVals, r, c, val);

                if (!isValidLocal || val !== cell.solutionValue) {
                  cell.isError = true;
                  gameState.mistakes++;
                } else {
                  cell.isError = false;
                }
              }
            }

            // بررسی وضعیت برد
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

        await answerCallback(BOT_TOKEN, cq.id);

        const svg = renderSudokuSVG(gameState, selectedCell);
        const keyboard = buildControlKeyboard(gameState, selectedCell);

        await updateSudokuPhoto(BOT_TOKEN, chatId, messageId, svg, keyboard);
      }

      return new Response('OK');
    } catch (e) {
      console.error(e);
      return new Response(e.message, { status: 500 });
    }
  }
};
