"""Turns the source photos and videos in media/home into web-ready files in public/media.

Run with `npm run media`. Sources are never changed, and the output folder can be
deleted and rebuilt at any time.

Needs ffmpeg on PATH, plus Python with Pillow and numpy.
"""

import json
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
VIDEO = ROOT / "media" / "home" / "vedio-clean"
PHOTO = ROOT / "media" / "home" / "photo"
OUT = ROOT / "public" / "media"

PRODUCTS = {
    "aldine-coat": "Aldine Coat",
    "sola-dress": "Sola Dress",
    "mira-trouser": "Mira Trouser",
    "verel-overcoat": "Verel Overcoat",
    "arlo-blazer": "Arlo Blazer",
    "soren-knit": "Soren Knit",
}

X264 = ["-c:v", "libx264", "-preset", "slow", "-pix_fmt", "yuv420p", "-an", "-movflags", "+faststart"]


def run(*args):
    subprocess.run(["ffmpeg", "-y", "-v", "error", *map(str, args)], check=True)


def size_mb(path):
    return path.stat().st_size / 1024 / 1024


def poster(video, target, quality=78):
    """Saves the first frame of a finished video, so a still can swap to it with no jump."""
    with tempfile.TemporaryDirectory() as tmp:
        frame = Path(tmp) / "frame.png"
        run("-i", video, "-frames:v", 1, frame)
        Image.open(frame).convert("RGB").save(target, "WEBP", quality=quality, method=6)


def hero_desktop():
    """Hero arch, then the coat hem, then the only strap-free stretch of Hero walk, then back to the start.

    The first second of Hero arch is repeated at the end and trimmed from the start,
    so the last dissolve lands on the exact frame the file opens on.
    """
    fade = 0.7
    arch = 7.8
    hem = 4.6
    walk = 1.4 * 1.6  # slowed down from 1.4s
    t1 = arch - fade
    t2 = t1 + hem - fade
    t3 = t2 + walk - fade
    graph = (
        f"[0:v]trim=0:{arch},setpts=PTS-STARTPTS,format=yuv420p,scale=1600:900:flags=lanczos,fps=24[a];"
        f"[1:v]trim=0.6:{0.6 + hem},setpts=PTS-STARTPTS,format=yuv420p,scale=1600:900:flags=lanczos,fps=24[b];"
        f"[2:v]trim=5.7:7.1,setpts=1.6*(PTS-STARTPTS),scale=1600:900:flags=lanczos,"
        f"minterpolate=fps=24:mi_mode=mci:mc_mode=aobmc:me_mode=bidir,format=yuv420p[c];"
        f"[0:v]trim=0:1.0,setpts=PTS-STARTPTS,format=yuv420p,scale=1600:900:flags=lanczos,fps=24[d];"
        f"[a][b]xfade=transition=fade:duration={fade}:offset={t1}[ab];"
        f"[ab][c]xfade=transition=fade:duration={fade}:offset={t2}[abc];"
        f"[abc][d]xfade=transition=fade:duration={fade}:offset={t3}[all];"
        f"[all]trim=start=1.0,setpts=PTS-STARTPTS[out]"
    )
    target = OUT / "hero" / "film-desktop.mp4"
    run(
        "-i", VIDEO / "Hero arch.mp4", "-i", VIDEO / "Hero hem.mp4", "-i", VIDEO / "Hero walk.mp4",
        "-filter_complex", graph, "-map", "[out]", "-crf", 24, "-g", 48, *X264, target,
    )
    poster(target, OUT / "hero" / "poster-desktop.webp")


def hero_phone():
    """A tall crop of the woman in Hero arch, then Hero phone cropped below the falling leaves."""
    fade = 0.7
    arch = 7.8
    walk = 2.8
    t1 = arch - fade
    t2 = t1 + walk - fade
    crop_arch = "crop=608:1080:541:0,scale=720:1280:flags=lanczos,fps=24,format=yuv420p"
    graph = (
        f"[0:v]trim=0:{arch},setpts=PTS-STARTPTS,{crop_arch}[a];"
        f"[1:v]trim=2.3:{2.3 + walk},setpts=PTS-STARTPTS,crop=756:1344:162:576,"
        f"scale=720:1280:flags=lanczos,fps=24,format=yuv420p[b];"
        f"[0:v]trim=0:1.0,setpts=PTS-STARTPTS,{crop_arch}[c];"
        f"[a][b]xfade=transition=fade:duration={fade}:offset={t1}[ab];"
        f"[ab][c]xfade=transition=fade:duration={fade}:offset={t2}[all];"
        f"[all]trim=start=1.0,setpts=PTS-STARTPTS[out]"
    )
    target = OUT / "hero" / "film-phone.mp4"
    run(
        "-i", VIDEO / "Hero arch.mp4", "-i", VIDEO / "Hero phone.mp4",
        "-filter_complex", graph, "-map", "[out]", "-crf", 25, "-g", 48, *X264, target,
    )
    poster(target, OUT / "hero" / "poster-phone.webp")


def backdrop_rgb(video):
    """Average colour of the top corners of a clip's final frame."""
    with tempfile.TemporaryDirectory() as tmp:
        frame = Path(tmp) / "frame.png"
        run("-sseof", -0.1, "-i", video, "-update", 1, "-frames:v", 1, frame)
        pixels = np.asarray(Image.open(frame).convert("RGB"), dtype=np.float32)
    height, width, _ = pixels.shape
    corner = int(width * 0.14)
    patches = [pixels[20:corner, 20:corner], pixels[20:corner, width - corner:width - 20]]
    return np.concatenate([p.reshape(-1, 3) for p in patches]).mean(axis=0)


def loop_filter(gains=None):
    """Plays a clip backward then forward, so it opens and closes on its final frame."""
    grade = ""
    if gains is not None:
        r, g, b = gains
        grade = f",colorchannelmixer=rr={r:.4f}:gg={g:.4f}:bb={b:.4f}"
    return (
        f"[0:v]scale=720:1280:flags=lanczos{grade},setsar=1,split[f][b];"
        f"[b]reverse[r];[r][f]concat=n=2:v=1,trim=end_frame=375,setpts=PTS-STARTPTS[out]"
    )


def products():
    """Evens out the studio backdrops, then builds a looping clip and a matching still."""
    samples = {key: backdrop_rgb(VIDEO / f"{name}.mp4") for key, name in PRODUCTS.items()}
    # The Aldine backdrop has window shadows, so it is left out of the target colour.
    target = np.mean([v for k, v in samples.items() if k != "aldine-coat"], axis=0)
    report = {}
    for key, name in PRODUCTS.items():
        gains = np.clip(target / samples[key], 0.90, 1.10)
        out = OUT / "edit" / f"{key}.mp4"
        run(
            "-i", VIDEO / f"{name}.mp4", "-filter_complex", loop_filter(gains), "-map", "[out]",
            "-crf", 25, "-g", 48, *X264, out,
        )
        poster(out, OUT / "edit" / f"{key}.webp")
        report[key] = [round(float(g), 3) for g in gains]
    print("backdrop target", np.round(target, 1), "gains", json.dumps(report))


def panels():
    for key, name in (("women", "Women panel"), ("men", "Men panel")):
        out = OUT / "panels" / f"{key}.mp4"
        run("-i", VIDEO / f"{name}.mp4", "-filter_complex", loop_filter(), "-map", "[out]",
            "-crf", 24, "-g", 48, *X264, out)
        poster(out, OUT / "panels" / f"{key}.webp")


def lookbook():
    jobs = {
        "steps": ("Lookbook, steps.png", None, 1672),
        "walking": ("Lookbook, walking.png", None, 1024),
        "silk": ("Lookbook, silk detail.png", None, 1672),
        # The approved portrait came out 4:3, so it is cropped to 3:4 around him.
        "portrait": ("Lookbook, portrait.png", (360, 0, 1174, 1086), 814),
        "courtyard": ("courtyard.png", None, 1536),
        # Trimmed from the left so the two of them fill more of the frame.
        "arrival": ("Hero start, wide.png", (360, 0, 1672, 941), 1312),
        "dress": ("Women panel.png", None, 1024),
    }
    for key, (name, box, width) in jobs.items():
        image = Image.open(PHOTO / name).convert("RGB")
        if box:
            image = image.crop(box)
        if image.width > width:
            image = image.resize((width, round(image.height * width / image.width)), Image.LANCZOS)
        image.save(OUT / "lookbook" / f"{key}.webp", "WEBP", quality=82, method=6)


def fabric_sequence(name, folder, size, count, quality):
    """Saves frames picked at equal amounts of motion, so scrolling feels even.

    The clip slows down near the end, so evenly spaced frames would feel uneven under the scroll.
    """
    width, height = size
    target = OUT / "craft" / folder
    target.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        tmp = Path(tmp)
        run("-i", VIDEO / name, "-vf", f"scale={width}:{height}:flags=lanczos", tmp / "%04d.png")
        files = sorted(tmp.glob("*.png"))
        gray = [np.asarray(Image.open(f).convert("L").resize((160, 90)), dtype=np.float32) for f in files]
        motion = np.array([np.abs(b - a).mean() for a, b in zip(gray, gray[1:])])
        travelled = np.concatenate([[0], np.cumsum(motion)])
        marks = np.linspace(0, travelled[-1], count)
        picks = np.searchsorted(travelled, marks).clip(0, len(files) - 1)
        for index, pick in enumerate(picks, start=1):
            Image.open(files[pick]).convert("RGB").save(target / f"{index:03d}.webp", "WEBP", quality=quality, method=4)
    total = sum(f.stat().st_size for f in target.glob("*.webp")) / 1024 / 1024
    print(f"{folder}: {count} frames, {total:.1f} MB, unique source frames {len(set(picks.tolist()))}")


def main():
    if not VIDEO.exists():
        sys.exit(f"Missing source folder: {VIDEO}")
    if OUT.exists():
        shutil.rmtree(OUT)
    for sub in ("hero", "edit", "panels", "lookbook", "craft"):
        (OUT / sub).mkdir(parents=True)
    steps = [hero_desktop, hero_phone, products, panels, lookbook]
    for step in steps:
        print("->", step.__name__, flush=True)
        step()
    print("-> fabric", flush=True)
    fabric_sequence("Fabric.mp4", "desktop", (1440, 810), 80, 62)
    fabric_sequence("Fabric phone.mp4", "phone", (720, 1280), 60, 60)
    for path in sorted(OUT.rglob("*.mp4")):
        print(f"{path.relative_to(OUT)}  {size_mb(path):.1f} MB")


if __name__ == "__main__":
    os.chdir(ROOT)
    main()
