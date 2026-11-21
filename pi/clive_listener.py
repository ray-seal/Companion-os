#!/usr/bin/env python3
"""Local CLIVE wake-word and device bridge. Binds to loopback only."""

import argparse
import asyncio
import glob
import json
import os
import queue
import sys
from pathlib import Path

import sounddevice as sd
import websockets
from vosk import KaldiRecognizer, Model

HOST = "127.0.0.1"
PORT = 8765
SAMPLE_RATE = 16000
WAKE_PHRASES = ["clive"]


def select_input_device():
    """Prefer the USB webcam microphone, then fall back to the OS default input."""
    try:
        devices = sd.query_devices()
    except Exception:
        return None, None

    inputs = [(index, device) for index, device in enumerate(devices) if device.get("max_input_channels", 0) > 0]
    if not inputs:
        return None, None

    requested = os.getenv("CLIVE_INPUT_DEVICE", "").strip()
    if requested:
        if requested.isdigit():
            wanted = int(requested)
            for index, device in inputs:
                if index == wanted:
                    return index, device.get("name", "Input device")
        else:
            for index, device in inputs:
                if requested.lower() in device.get("name", "").lower():
                    return index, device.get("name", "Input device")

    preferred_words = ("webcam", "usb camera", "camera", "usb microphone", "usb audio")
    for index, device in inputs:
        name = device.get("name", "").lower()
        if any(word in name for word in preferred_words):
            return index, device.get("name", "USB microphone")

    try:
        default_index = sd.default.device[0]
        for index, device in inputs:
            if index == default_index:
                return index, device.get("name", "Default microphone")
    except Exception:
        pass
    index, device = inputs[0]
    return index, device.get("name", "Input microphone")


def device_status(input_device_name=None):
    input_index, detected_name = select_input_device()
    microphone = input_index is not None
    webcam = bool(glob.glob("/dev/video*"))
    return {"microphone": microphone, "microphone_name": input_device_name or detected_name, "webcam": webcam}


async def main(model_path: Path):
    if not model_path.exists():
        raise RuntimeError(f"Vosk model folder not found: {model_path}")

    print("Loading local speech model…", flush=True)
    model = Model(str(model_path))
    wake_recognizer = KaldiRecognizer(model, SAMPLE_RATE, json.dumps(WAKE_PHRASES))
    command_recognizer = KaldiRecognizer(model, SAMPLE_RATE)
    audio_queue = queue.Queue(maxsize=40)
    input_device_index, input_device_name = select_input_device()
    if input_device_index is None:
        raise RuntimeError("No microphone input device found. Check the USB webcam microphone and run arecord -l.")
    print(f"Using microphone: {input_device_name} (device {input_device_index})", flush=True)
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
        await websocket.send(json.dumps({"type": "status", **device_status(input_device_name)}))
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
                state["mode"] = "wake"
                state["resume_mode"] = "wake"
                wake_recognizer.Reset()
                command_recognizer.Reset()

    print("Starting microphone stream…", flush=True)
    with sd.RawInputStream(
        samplerate=SAMPLE_RATE,
        blocksize=4000,
        dtype="int16",
        channels=1,
        device=input_device_index,
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
                        if "clive" in phrase.split() and state["client"] is not None:
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
