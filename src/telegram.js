export async function sendSudokuPhoto(token, chatId, svgString, replyMarkup) {
  // تبدیل SVG به فرمت قابل ارسال (می‌توان به عنوان فایل باینری ارسال کرد)
  const formData = new FormData();
  formData.append('chat_id', chatId);
  
  const blob = new Blob([svgString], { type: 'image/svg+xml' });
  formData.append('photo', blob, 'sudoku.svg');
  formData.append('caption', '🧩 جدول سودوکو کلاسیک\nخانه مورد نظر را انتخاب کرده و عدد خود را وارد کنید.');
  if (replyMarkup) {
    formData.append('reply_markup', JSON.stringify(replyMarkup));
  }

  const res = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
    method: 'POST',
    body: formData
  });
  return await res.json();
}

export async function updateSudokuPhoto(token, chatId, messageId, svgString, replyMarkup) {
  const formData = new FormData();
  formData.append('chat_id', chatId);
  formData.append('message_id', messageId);

  const blob = new Blob([svgString], { type: 'image/svg+xml' });
  formData.append('media', JSON.stringify({
    type: 'photo',
    media: 'attach://sudoku',
    caption: '🧩 جدول سودوکو کلاسیک'
  }));
  formData.append('sudoku', blob, 'sudoku.svg');

  if (replyMarkup) {
    formData.append('reply_markup', JSON.stringify(replyMarkup));
  }

  const res = await fetch(`https://api.telegram.org/bot${token}/editMessageMedia`, {
    method: 'POST',
    body: formData
  });
  return await res.json();
}

export async function answerCallback(token, callbackQueryId, text = '') {
  await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ callback_query_id: callbackQueryId, text: text })
  });
}
