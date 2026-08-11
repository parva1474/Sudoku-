// ==========================================
// src/worker.js
// Telegram Sudoku Bot
// Cloudflare Workers + D1
// ==========================================

import {
  handleUpdate
} from "./handlers.js";

export default {

  async fetch(
    request,
    env,
    ctx
  ) {

    // --------------------------------------
    // Health Check
    // --------------------------------------

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


    // --------------------------------------
    // فقط POST
    // --------------------------------------

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


    // --------------------------------------
    // بررسی Token
    // --------------------------------------

    if (
      !env.BOT_TOKEN
    ) {

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


    // --------------------------------------
    // دریافت Update
    // --------------------------------------

    let update;

    try {

      update =
        await request.json();

    } catch (error) {

      console.error(
        "Invalid Telegram update:",
        error
      );

      return new Response(
        "Invalid JSON",
        {
          status: 400
        }
      );
    }


    // --------------------------------------
    // پردازش Update
    // --------------------------------------

    try {

      await handleUpdate(
        update,
        env,
        env.BOT_TOKEN
      );

    } catch (error) {

      console.error(
        "Worker error:",
        error
      );

      /*
       * عمداً در اینجا 200 برمی‌گردانیم
       * تا Telegram دائماً همان Update
       * را دوباره ارسال نکند.
       */

      return new Response(
        "OK",
        {
          status: 200
        }
      );
    }


    return new Response(
      "OK",
      {
        status: 200
      }
    );
  }
};
