#!/usr/bin/env bash
set -euo pipefail

BASE="$HOME/.local/share/clive-listener"
MODEL_DIR="$BASE/vosk-model-small-en-us-0.15"
SERVICE_DIR="$HOME/.config/systemd/user"

echo "Installing CLIVE's local microphone and webcam listener…"
ARCH="$(uname -m)"
if [[ "$ARCH" == "armv6l" ]]; then
  echo "NOTE: This is a Raspberry Pi Zero-class ARMv6 system."
  echo "The Vosk Python package may not provide a compatible prebuilt binary."
  echo "The listener is more comfortable on a Raspberry Pi 3B or newer."
fi

sudo apt-get update
sudo apt-get install -y python3-venv python3-pip libportaudio2 portaudio19-dev curl unzip

mkdir -p "$BASE" "$SERVICE_DIR"
curl -fsSL "https://raw.githubusercontent.com/ray-seal/Companion-os/main/pi/clive_listener.py" -o "$BASE/clive_listener.py"

python3 -m venv "$BASE/.venv"
"$BASE/.venv/bin/pip" install --upgrade pip
"$BASE/.venv/bin/pip" install vosk sounddevice websockets

if [[ ! -d "$MODEL_DIR" ]]; then
  TMP="$BASE/model.zip"
  curl -fL "https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip" -o "$TMP"
  unzip -q "$TMP" -d "$BASE"
  rm -f "$TMP"
fi

cat > "$SERVICE_DIR/clive-listener.service" <<'UNIT'
[Unit]
Description=CLIVE local wake word and hardware listener
After=default.target

[Service]
Type=simple
ExecStart=%h/.local/share/clive-listener/.venv/bin/python %h/.local/share/clive-listener/clive_listener.py --model %h/.local/share/clive-listener/vosk-model-small-en-us-0.15
Restart=on-failure
RestartSec=5

[Install]
WantedBy=default.target
UNIT

systemctl --user daemon-reload
systemctl --user enable --now clive-listener.service

echo
echo "CLIVE listener installed and started."
echo "Check it with: systemctl --user status clive-listener"
echo "Follow its log with: journalctl --user -u clive-listener -f"
