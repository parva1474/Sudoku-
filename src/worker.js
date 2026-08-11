// ==========================================
// src/worker.js
// Telegram Sudoku Bot
// Cloudflare Workers + D1
// ==========================================

import { handleUpdate } from "./handlers.js";

export default {
  async fetch(request, env) {
    if (request.method === "GET") {
      return new Response(
        "🧩 Sudoku Bot is running.",
        {
          status: 200
        }
      );
    }

    if (request.method !== "POST") {
      return new Response(
        "Method Not Allowed",
        {
          status: 405
        }
      );
    }

    try {
      const update = await request.json();
      const token = env.BOT_TOKEN;

      if (!token) {
        console.error("BOT_TOKEN is missing.");
        return new Response(
          "BOT_TOKEN is missing.",
          {
            status: 500
          }
        );
      }

      // هدایت آپدیت‌ها به فایل handlers.js
      await handleUpdate(update, env, token);

      return new Response(
        "OK",
        {
          status: 200
        }
      );

    } catch (error) {
      console.error("Worker error:", error);
      return new Response(
        "Internal Server Error",
        {
          status: 500
        }
      );
    }
  }
};
