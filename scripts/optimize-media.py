import argparse
import json
import shutil
import subprocess
from pathlib import Path

import av
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"


def load_plan(scope):
    npm = shutil.which("npm") or shutil.which("npm.cmd")
    if not npm:
        raise RuntimeError("npm is required to export the media plan")
    result = subprocess.run(
        [npm, "exec", "tsx", "scripts/export-media-plan.ts"],
        cwd=ROOT,
        check=True,
        capture_output=True,
        text=True,
        encoding="utf-8",
    )
    payload = json.loads(result.stdout)
    if scope == "create-character":
        return payload["createCharacter"]
    if scope == "generator":
        return payload["generator"]
    return [*payload["createCharacter"], *payload["generator"]]


def resolve_public(url):
    return PUBLIC.joinpath(*str(url).lstrip("/").split("/"))


def optimize_image(source, target, max_width):
    target.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(source) as image:
        image = image.convert("RGB")
        if image.width > max_width:
            height = max(1, round(image.height * max_width / image.width))
            image = image.resize((max_width, height), Image.Resampling.LANCZOS)
        image.save(target, format="WEBP", quality=82, method=6)


def video_dimensions(stream, max_height):
    height = min(stream.height, max_height)
    width = round(stream.width * height / stream.height)
    width -= width % 2
    height -= height % 2
    return max(2, width), max(2, height)


def encode_video(source, target, max_height, max_bytes, bitrate_scale):
    with av.open(str(source)) as input_container:
        input_stream = input_container.streams.video[0]
        duration = float(input_stream.duration * input_stream.time_base) if input_stream.duration else 5.0
        rate = input_stream.average_rate or 24
        width, height = video_dimensions(input_stream, max_height)
        target.parent.mkdir(parents=True, exist_ok=True)
        with av.open(str(target), "w", format="mp4", options={"movflags": "+faststart"}) as output_container:
            output_stream = output_container.add_stream("libx264", rate=rate)
            output_stream.width = width
            output_stream.height = height
            output_stream.pix_fmt = "yuv420p"
            output_stream.bit_rate = max(180_000, int(max_bytes * 8 / max(duration, 1.0) * 0.82 * bitrate_scale))
            output_stream.options = {"preset": "veryfast"}
            for frame in input_container.decode(video=0):
                frame = frame.reformat(width=width, height=height, format="yuv420p")
                for packet in output_stream.encode(frame):
                    output_container.mux(packet)
            for packet in output_stream.encode():
                output_container.mux(packet)


def optimize_video(source, target, max_height, max_bytes):
    scale = 1.0
    for _ in range(4):
        encode_video(source, target, max_height, max_bytes, scale)
        size = target.stat().st_size
        if size <= max_bytes:
            return
        scale *= max(0.35, max_bytes / size * 0.9)
    raise RuntimeError(f"video exceeds budget after optimization: {target} ({target.stat().st_size} > {max_bytes})")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--force", action="store_true")
    parser.add_argument("--scope", choices=("all", "create-character", "generator"), default="all")
    args = parser.parse_args()
    plan = load_plan(args.scope)
    written = 0
    skipped = 0
    for item in plan:
        source = resolve_public(item["source"])
        target = resolve_public(item["target"])
        if not source.is_file():
            raise FileNotFoundError(source)
        budget = int(item.get("maxBytes") or 0)
        if not args.force and target.is_file() and target.stat().st_mtime >= source.stat().st_mtime and (not budget or target.stat().st_size <= budget):
            skipped += 1
            continue
        if item["kind"] == "image":
            optimize_image(source, target, int(item["maxWidth"]))
        else:
            optimize_video(source, target, int(item["maxHeight"]), budget)
        written += 1
    print(json.dumps({"status": "ok", "written": written, "skipped": skipped, "assets": len(plan)}))


if __name__ == "__main__":
    main()
