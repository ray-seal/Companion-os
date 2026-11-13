# CLIVE local voice listener

This optional local service listens for **"Hey Clive"**, **"Hi Clive"** and **"Here Clive"**. Wake-word detection and speech recognition happen on the Pi using Vosk. Audio is not streamed to a cloud speech-recognition service.

The service binds only to `127.0.0.1:8765`. The CLIVE web app connects to it locally. After a wake phrase, CLIVE says **"I'm listening"**, pauses the listener while he speaks, then captures the request. A completed transcript is passed to the existing `/api/chat` flow.

The service also checks for an input microphone and a Linux webcam device (`/dev/video*`). Webcam detection is a hardware-presence check only; camera vision is a later feature and no video is captured or uploaded by this listener.

## Install on Raspberry Pi OS

Run this in a terminal on the Pi:

```bash
curl -fsSL https://raw.githubusercontent.com/ray-seal/Companion-os/main/pi/install-listener.sh | bash
```

The installer downloads the small English Vosk model (roughly 40–50 MB), creates a Python virtual environment and enables a per-user systemd service.

## Useful commands

```bash
systemctl --user status clive-listener
journalctl --user -u clive-listener -f
systemctl --user restart clive-listener
systemctl --user disable --now clive-listener
```

## Hardware notes

- Connect the USB microphone or webcam microphone before starting the service.
- A webcam is detected when Linux exposes a `/dev/video*` device.
- The listener requests mono 16 kHz audio from the default ALSA/PulseAudio input.
- The service is designed for a local device, not remote access.
- Raspberry Pi Zero W uses ARMv6 and has only 512 MB RAM. Vosk may not have a compatible prebuilt Python package for ARMv6, and running the model alongside Chromium can be tight. The installer prints a warning on ARMv6. A Pi 3B or newer is the more realistic host for always-on local recognition.
- If the microphone cannot open, check `arecord -l` and select a working default input in Raspberry Pi OS sound settings.

## Privacy

The microphone audio is processed locally by Vosk. Only the recognised text is sent to CLIVE's existing chat endpoint when a wake phrase has been heard. The camera is not opened by this service; it only checks whether a video device exists.
