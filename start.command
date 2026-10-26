#!/bin/bash
# Double-click this file to run Clarity on your computer.
cd "$(dirname "$0")"
echo ""
echo "  ✦ Starting Clarity…"
echo "  ✦ When it says 'Serving HTTP', open this in your browser:"
echo ""
echo "        http://localhost:4599"
echo ""
echo "  ✦ Leave this window open while you use the app."
echo "  ✦ Close this window (or press Control-C) to stop."
echo ""
sleep 1
# open the browser automatically after a moment
( sleep 2 && open "http://localhost:4599" ) &
python3 -m http.server 4599
