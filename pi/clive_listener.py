#!/usr/bin/env python3
"""Local CLIVE wake-word and device bridge. Binds to loopback only."""

import argparse
import asyncio
import glob
import json
import queue
import sys
from pathlib import Path

import sounddevice as sd
import websockets
from vosk import KaldiRecognizer, Model

HOST = "127.0.0.1"
PORT = 8765
SAMPLE_RATE = 16000
WAKE_PHRASES = ["hey clive", "hi clive", "here clive"]


def device_status():
    try:
        microphone = sd.query_devices(kind="input") is not None
    except Exception:
        microphone = False
    webcam = bool(glob.glob("/dev/video*"))
    return {"microphone": microphone, "webcam": webcam}


async def main(model_path: Path):
    if not model_path.exists():
        raise RuntimeError(f"Vosk model folder not found: {model_path}")

    print("Loading local speech model…", flush=True)
    model = Model(str(model_path))
    wake_recognizer = KaldiRecognizer(model, SAMPLE_RATE, json.dumps(WAKE_PHRASES))
    command_recognizer = KaldiRecognizer(model, SAMPLE_RATE)
    audio_queue = queue.Queue(maxsize=40)
    state = {"mode": "wake", "resume_mode": "wake", "client": None}

    def audio_callback(indata, frames, time_info, status):
        if status:
            print(f"Audio: {status}", file=sys.stderr, flush=True)
        try:
            audio_queue.put_nowait(bytes(indata))
        except queue.Full:
            pass

    async def send(payload):
        client = state["client"]
        if client is not None:
            try:
                await client.send(json.dumps(payload))
            except websockets.ConnectionClosed:
                state["client"] = None

    async def handler(websocket):
        state["client"] = websocket
        await websocket.send(json.dumps({"type": "status", **device_status()}))
        try:
            async for raw in websocket:
                try:
                    command = json.loads(raw)
                except json.JSONDecodeError:
                    continue
                action = command.get("command")
                if action == "pause":
                    if state["mode"] != "paused":
                        state["resume_mode"] = state["mode"]
                    state["mode"] = "paused"
                elif action == "resume":
                    state["mode"] = state["resume_mode"]
                    if state["mode"] == "capture":
                        command_recognizer.Reset()
                elif action == "start_capture":
                    state["mode"] = "capture"
                    state["resume_mode"] = "capture"
                    command_recognizer.Reset()
                    await websocket.send(json.dumps({"type": "capture_started"}))
        finally:
            if state["client"] is websocket:
                state["client"] = None

    print("Starting microphone stream…", flush=True)
    with sd.RawInputStream(
        samplerate=SAMPLE_RATE,
        blocksize=4000,
        dtype="int16",
        channels=1,
        callback=audio_callback,
    ):
        async with websockets.serve(handler, HOST, PORT, ping_interval=20, ping_timeout=20):
            print(f"CLIVE local listener ready at ws://{HOST}:{PORT}", flush=True)
            while True:
                audio = await asyncio.to_thread(audio_queue.get)
                mode = state["mode"]
                if mode == "wake":
                    if wake_recognizer.AcceptWaveform(audio):
                        result = json.loads(wake_recognizer.Result())
                        phrase = (result.get("text") or "").lower().strip()
                        if phrase in WAKE_PHRASES:
                            state["mode"] = "paused"
                            state["resume_mode"] = "capture"
                            command_recognizer.Reset()
                            await send({"type": "wake", "phrase": phrase})
                elif mode == "capture":
                    if command_recognizer.AcceptWaveform(audio):
                        result = json.loads(command_recognizer.Result())
                        transcript = (result.get("text") or "").strip()
                        if transcript:
                            state["mode"] = "wake"
                            state["resume_mode"] = "wake"
                            wake_recognizer.Reset()
                            await send({"type": "transcript", "text": transcript})
                # While paused, audio is deliberately discarded so CLIVE
                # cannot transcribe his own acknowledgement or spoken reply.


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", required=True, help="Path to an extracted Vosk model")
    args = parser.parse_args()
    try:
        asyncio.run(main(Path(args.model).expanduser()))
    except KeyboardInterrupt:
        pass
    except Exception as exc:
        print(f"CLIVE listener stopped: {exc}", file=sys.stderr)
        sys.exit(1)
