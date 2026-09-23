import re
from pathlib import Path

p = Path("server.py")
src = p.read_text(encoding="utf-8")

if "calibre_env" in src:
    print("ALREADY_PATCHED")
    raise SystemExit(0)

pat = re.compile(
    r"(?P<i>[ \t]*)result\s*=\s*subprocess\.run\(\s*"
    r"\[CALIBRE_CONVERTER,\s*str\(input_path\),\s*str\(normalized_pdf\),\s*"
    r"\"--output-profile\",\s*\"tablet\"\],\s*"
    r"capture_output=True,\s*"
    r"text=True,\s*"
    r"timeout=30\s*\*\s*60,\s*"
    r"\)",
    re.DOTALL,
)

m = pat.search(src)
if not m:
    print("PATTERN_NOT_FOUND")
    i = src.find("result = subprocess.run")
    if i >= 0:
        print("CTX:", repr(src[max(0, i-100):i+400]))
    raise SystemExit(1)

indent = m.group("i")
env_block = (
    f"{indent}calibre_env = os.environ.copy()\n"
    f"{indent}calibre_env[\"QTWEBENGINE_CHROMIUM_FLAGS\"] = "
    f"\"--no-sandbox --disable-gpu --headless --disable-dev-shm-usage\"\n"
    f"{indent}calibre_env[\"QT_QPA_PLATFORM\"] = \"offscreen\"\n"
    f"{indent}calibre_env[\"LIBGL_ALWAYS_SOFTWARE\"] = \"1\"\n"
)
new_call = (
    f"{indent}result = subprocess.run(\n"
    f"{indent}    [CALIBRE_CONVERTER, str(input_path), str(normalized_pdf), "
    f"\"--output-profile\", \"tablet\"],\n"
    f"{indent}    capture_output=True,\n"
    f"{indent}    text=True,\n"
    f"{indent}    timeout=30 * 60,\n"
    f"{indent}    env=calibre_env,\n"
    f"{indent})"
)

src2 = src[:m.start()] + env_block + new_call + src[m.end():]

if not re.search(r"^import os\b", src2, re.MULTILINE):
    src2 = re.sub(r"^(import hashlib\b)", r"import os\n\1", src2, count=1, flags=re.MULTILINE)

p.write_text(src2, encoding="utf-8", newline="\n")
print("PATCH_OK")