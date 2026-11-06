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


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--scope", choices=("all", "create-character", "generator"), default="all")
    args = parser.parse_args()
    images = 0
    videos = 0
    max_image_bytes = 0
    max_video_bytes = 0
    seen = set()
    for item in load_plan(args.scope):
        target = resolve_public(item["target"])
        if target in seen:
            continue
        seen.add(target)
        if not target.is_file():
            raise FileNotFoundError(target)
        size = target.stat().st_size
        if item["kind"] == "image":
            with Image.open(target) as image:
                if image.format != "WEBP" or image.width > int(item["maxWidth"]):
                    raise RuntimeError(f"invalid optimized image: {target}")
            images += 1
            max_image_bytes = max(max_image_bytes, size)
            continue
        if size > int(item["maxBytes"]):
            raise RuntimeError(f"video exceeds budget: {target}")
        with av.open(str(target)) as container:
            stream = container.streams.video[0]
            if stream.codec_context.name != "h264" or stream.height > int(item["maxHeight"]):
                raise RuntimeError(f"invalid optimized video: {target}")
        atoms = target.read_bytes()
        moov = atoms.find(b"moov")
        mdat = atoms.find(b"mdat")
        if moov < 0 or mdat < 0 or moov > mdat:
            raise RuntimeError(f"video is not fast-start: {target}")
        videos += 1
        max_video_bytes = max(max_video_bytes, size)
    print(json.dumps({
        "status": "ok",
        "images": images,
        "videos": videos,
        "maxImageBytes": max_image_bytes,
        "maxVideoBytes": max_video_bytes,
    }))


if __name__ == "__main__":
    main()
