/*
   CLARITY, getting text off a photo

   Tesseract runs locally in the browser and reads the page
   on-device, so the photo never leaves the device.
*/
window.Clarity = window.Clarity || {};

Clarity.ocr = (function () {
  const TESSERACT_CDN = 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js';
  const MAX_EDGE = 2600;      // higher res helps OCR read small textbook print

  /* file → downscaled JPEG */
  function fileToImage(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("That file doesn't look like an image.")); };
      img.src = url;
    });
  }

  function prepare(img) {
    const scale = Math.min(1, MAX_EDGE / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.round(img.naturalWidth * scale);
    const h = Math.round(img.naturalHeight * scale);

    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, w, h);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.86);
    return { canvas, dataUrl, base64: dataUrl.split(',')[1], mediaType: 'image/jpeg' };
  }

  /* local OCR */
  let tessLoading = null;

  function loadTesseract() {
    if (window.Tesseract) return Promise.resolve(window.Tesseract);
    if (tessLoading) return tessLoading;
    tessLoading = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = TESSERACT_CDN;
      s.async = true;
      s.onload = () => window.Tesseract
        ? resolve(window.Tesseract)
        : reject(new Error('The text reader loaded but did not start.'));
      s.onerror = () => reject(new Error(
        'Could not download the on-device text reader. Connect to the internet once to cache it, ' +
        'or paste the text in by hand.'));
      document.head.appendChild(s);
    });
    return tessLoading;
  }

  /* Boost a photo for OCR with adaptive (local) thresholding. A photo of a
     page usually has uneven lighting — brighter at the top, dimmer/blurrier at
     the bottom — so a single global contrast curve leaves the bottom unreadable.
     Comparing each pixel to the average of its own neighbourhood binarises the
     whole page evenly, which fixes the bottom and makes word gaps crisp (so
     fewer words get merged). */
  function preprocessForOcr(src) {
    let w = src.width, h = src.height;
    const up = Math.min(1.6, Math.max(1, 1500 / Math.max(w, h))); // only upscale small images
    w = Math.round(w * up); h = Math.round(h * up);
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const ctx = c.getContext('2d');
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(src, 0, 0, w, h);
    const im = ctx.getImageData(0, 0, w, h);
    const d = im.data;
    const n = w * h;

    // grayscale
    const gray = new Float32Array(n);
    for (let i = 0, p = 0; p < n; i += 4, p++) {
      gray[p] = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    }
    // integral image (summed-area table) for O(1) local means
    const iw = w + 1;
    const integ = new Float64Array(iw * (h + 1));
    for (let y = 0; y < h; y++) {
      let rs = 0;
      const row = (y + 1) * iw, prow = y * iw;
      for (let x = 0; x < w; x++) {
        rs += gray[y * w + x];
        integ[row + x + 1] = integ[prow + x + 1] + rs;
      }
    }
    const rad = Math.max(10, Math.round(Math.min(w, h) / 55)); // neighbourhood size
    const C = 9;                                               // how much darker than local mean = ink
    for (let y = 0; y < h; y++) {
      const y0 = y - rad < 0 ? 0 : y - rad;
      const y1 = y + rad >= h ? h - 1 : y + rad;
      const r0 = y0 * iw, r1 = (y1 + 1) * iw;
      for (let x = 0; x < w; x++) {
        const x0 = x - rad < 0 ? 0 : x - rad;
        const x1 = x + rad >= w ? w - 1 : x + rad;
        const area = (x1 - x0 + 1) * (y1 - y0 + 1);
        const sum = integ[r1 + x1 + 1] - integ[r0 + x1 + 1] - integ[r1 + x0] + integ[r0 + x0];
        const mean = sum / area;
        const p = y * w + x;
        const v = gray[p] < mean - C ? 0 : 255;
        const di = p * 4;
        d[di] = d[di + 1] = d[di + 2] = v;
      }
    }
    ctx.putImageData(im, 0, 0);
    return c;
  }

  /** Local OCR. Returns the text AND per-word boxes (for the scan animation). */
  async function localRecognize(canvas, onProgress) {
    const T = await loadTesseract();
    const worker = await T.createWorker('eng', 1, {
      logger: (m) => {
        if (m.status === 'recognizing text' && onProgress) onProgress(m.progress);
      }
    });
    try {
      try { await worker.setParameters({ preserve_interword_spaces: '1' }); } catch (e) {}
      const ocrInput = preprocessForOcr(canvas);
      const { data } = await worker.recognize(ocrInput);
      // normalise word boxes to 0..1 of the source canvas so the UI can scale them
      const words = (data.words || [])
        .filter(w => w.text && w.text.trim() && w.confidence > 40 && w.bbox)
        .map(w => ({
          text: w.text,
          x: w.bbox.x0 / ocrInput.width,
          y: w.bbox.y0 / ocrInput.height,
          w: (w.bbox.x1 - w.bbox.x0) / ocrInput.width,
          h: (w.bbox.y1 - w.bbox.y0) / ocrInput.height
        }));
      return { text: data.text || '', words };
    } finally {
      await worker.terminate();
    }
  }

  /**
   * @param {File} file
   * @param {object} cb   { onStage(msg,pct), onImage(dataUrl,w,h) }
   * @returns {Promise<{text, thumb, engine, words, imageW, imageH}>}
   */
  async function read(file, cb) {
    const { onStage = () => {}, onImage = () => {} } = cb || {};
    onStage('Opening the photo…', null);

    const img = await fileToImage(file);
    const { canvas, dataUrl, base64, mediaType } = prepare(img);
    onImage(dataUrl, canvas.width, canvas.height);   // hand the frozen frame to the scan view

    // small thumbnail to show in the library
    const t = document.createElement('canvas');
    const ts = Math.min(1, 220 / Math.max(canvas.width, canvas.height));
    t.width = Math.round(canvas.width * ts); t.height = Math.round(canvas.height * ts);
    t.getContext('2d').drawImage(canvas, 0, 0, t.width, t.height);
    const thumb = t.toDataURL('image/jpeg', 0.6);
    const base = { thumb, imageW: canvas.width, imageH: canvas.height };

    onStage('Reading the page on this device…', 0);
    const { text, words } = await localRecognize(canvas, (p) => onStage('Reading the page on this device…', p));

    if (text.trim().length < 8) {
      throw new Error('No text found in that photo. Try more light, hold the camera flat, and fill the frame with the page.');
    }
    return { text, engine: 'local', words, ...base };
  }

  return { read, prepare, fileToImage };
})();
