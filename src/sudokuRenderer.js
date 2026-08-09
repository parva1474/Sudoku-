export function renderSudokuSVG(gameState, selectedCell = null) {
  const size = 900;
  const cellSize = size / 9;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">`;
  svg += `<rect width="${size}" height="${size}" fill="#ffffff"/>`;

  // هایلایت‌ها
  if (selectedCell) {
    const sr = selectedCell.r;
    const sc = selectedCell.c;
    const boxStartR = Math.floor(sr / 3) * 3;
    const boxStartC = Math.floor(sc / 3) * 3;

    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        let isSelected = (r === sr && c === sc);
        let isRowCol = (r === sr || c === sc);
        let isBox = (r >= boxStartR && r < boxStartR + 3 && c >= boxStartC && c < boxStartC + 3);

        let fill = 'none';
        if (isSelected) {
          fill = '#bbdefb';
        } else if (isRowCol || isBox) {
          fill = '#f5f5f5';
        }

        if (fill !== 'none') {
          svg += `<rect x="${c * cellSize}" y="${r * cellSize}" width="${cellSize}" height="${cellSize}" fill="${fill}/>`;
        }
      }
    }
  }

  // رسم محتوا (اعداد و مداد)
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      let cell = gameState.board[r][c];
      let x = c * cellSize + cellSize / 2;
      let y = r * cellSize + cellSize / 2 + 18;

      if (cell.value !== null) {
        let fontWeight = cell.given ? 'bold' : 'normal';
        let fill = cell.isError ? '#d32f2f' : (cell.given ? '#000000' : '#1976d2');
        svg += `<text x="${x}" y="${y}" font-family="sans-serif" font-size="56" font-weight="${fontWeight}" fill="${fill}" text-anchor="middle">${cell.value}</text>`;
      } else if (cell.notes && cell.notes.length > 0) {
        let noteSize = cellSize / 3;
        for (let n of cell.notes) {
          let num = n - 1;
          let nr = Math.floor(num / 3);
          let nc = num % 3;
          let nx = c * cellSize + nc * noteSize + noteSize / 2;
          let ny = r * cellSize + nr * noteSize + noteSize / 2 + 8;
          svg += `<text x="${nx}" y="${ny}" font-family="sans-serif" font-size="20" fill="#666666" text-anchor="middle">${n}</text>`;
        }
      }
    }
  }

  // خطوط داخلی نازک
  for (let i = 1; i < 9; i++) {
    if (i % 3 !== 0) {
      let pos = i * cellSize;
      svg += `<line x1="${pos}" y1="0" x2="${pos}" y2="${size}" stroke="#b0bec5" stroke-width="2"/>`;
      svg += `<line x1="0" y1="${pos}" x2="${size}" y2="${pos}" stroke="#b0bec5" stroke-width="2"/>`;
    }
  }

  // خطوط ضخیم بلوک‌های ۳ در ۳ و کادر پیرامون
  for (let i = 0; i <= 9; i += 3) {
    let pos = i * cellSize;
    let w = (i === 0 || i === 9) ? 6 : 5;
    svg += `<line x1="${pos}" y1="0" x2="${pos}" y2="${size}" stroke="#212121" stroke-width="${w}"/>`;
    svg += `<line x1="0" y1="${pos}" x2="${size}" y2="${pos}" stroke="#212121" stroke-width="${w}"/>`;
  }

  svg += `</svg>`;
  return svg;
}
