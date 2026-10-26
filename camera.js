/*
   CLARITY, live camera

   A real in-app camera via getUserMedia: live
   preview, a shutter, and a front/back flip.
   Captures a frame to a canvas and hands a File
   to the same scan pipeline the file picker uses.

   Falls back to the OS file input where the live
   camera isn't available (older browsers, denied
   permission, or plain http on a phone).
*/
window.Clarity = window.Clarity || {};

Clarity.camera = (function () {
  const supported = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);

  let stream = null;
  let video = null;
  let facing = 'environment';   // back camera first, that's where the worksheet is

  async function start(videoEl) {
    if (!supported) throw new Error('This browser has no camera access.');
    video = videoEl;
    stop();
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: facing }, width: { ideal: 1920 }, height: { ideal: 1080 } },
      audio: false
    });
    video.srcObject = stream;
    video.setAttribute('playsinline', '');   // iOS: stay inline, don't go fullscreen
    await video.play().catch(() => {});
  }

  function stop() {
    if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; }
    if (video) video.srcObject = null;
  }

  async function flip() {
    facing = facing === 'environment' ? 'user' : 'environment';
    if (video) { try { await start(video); } catch (_) {} }
    return facing;
  }

  /** Grab the current frame as a JPEG File, or null if the stream isn't ready. */
  function capture() {
    if (!video || !video.videoWidth) return Promise.resolve(null);
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (facing === 'user') {           // un-mirror the selfie camera
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0);
    return new Promise((resolve) =>
      canvas.toBlob(
        (b) => resolve(b ? new File([b], 'scan.jpg', { type: 'image/jpeg' }) : null),
        'image/jpeg', 0.92
      ));
  }

  return { supported, start, stop, flip, capture };
})();
