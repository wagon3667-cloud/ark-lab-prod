from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
from urllib.parse import urljoin
from urllib.request import Request, urlopen


BASE_DIR = Path(__file__).resolve().parent


def load_env_file(path: Path) -> None:
  if not path.exists():
    return

  for raw_line in path.read_text(encoding="utf-8").splitlines():
    line = raw_line.strip()
    if not line or line.startswith("#") or "=" not in line:
      continue
    key, value = line.split("=", 1)
    os.environ.setdefault(key.strip(), value.strip())


load_env_file(BASE_DIR / ".env")

BOT_TOKEN = os.getenv("ARK_LAB_BOT_TOKEN", "").strip()
CHAT_ID = os.getenv("ARK_LAB_TELEGRAM_CHAT_ID", "").strip()
PUBLIC_URL = os.getenv("ARK_LAB_PUBLIC_URL", "").strip().rstrip("/")


def api_call(method: str, payload: dict) -> dict:
  if not BOT_TOKEN:
    raise RuntimeError("ARK_LAB_BOT_TOKEN is not configured")

  url = f"https://api.telegram.org/bot{BOT_TOKEN}/{method}"
  request = Request(
    url,
    data=json.dumps(payload).encode("utf-8"),
    headers={"Content-Type": "application/json"},
    method="POST",
  )

  with urlopen(request, timeout=20) as response:
    data = json.loads(response.read().decode("utf-8"))

  if not data.get("ok"):
    raise RuntimeError(f"{method} failed: {data}")
  return data


def get_web_app_url() -> str:
  if not PUBLIC_URL:
    raise RuntimeError("ARK_LAB_PUBLIC_URL is empty. Deploy first and put a public https URL into .env")
  if not PUBLIC_URL.startswith("https://"):
    raise RuntimeError("ARK_LAB_PUBLIC_URL must start with https:// for Telegram Mini Apps")
  return urljoin(f"{PUBLIC_URL}/", "mini-app/")


def configure_menu(web_app_url: str) -> None:
  api_call(
    "setChatMenuButton",
    {
      "menu_button": {
        "type": "web_app",
        "text": "Open ARK LAB",
        "web_app": {
          "url": web_app_url,
        },
      }
    },
  )


def configure_commands() -> None:
  api_call(
    "setMyCommands",
    {
      "commands": [
        {"command": "start", "description": "Open ARK LAB intro"},
        {"command": "app", "description": "Open ARK LAB mini app"},
      ]
    },
  )


def send_launch_message(web_app_url: str) -> None:
  if not CHAT_ID:
    print("ARK_LAB_TELEGRAM_CHAT_ID is empty; skipping launch message")
    return

  api_call(
    "sendMessage",
    {
      "chat_id": CHAT_ID,
      "text": "ARK LAB mini app is ready. Open it from the button below or from the bot menu.",
      "reply_markup": {
        "inline_keyboard": [
          [
            {
              "text": "Open ARK LAB",
              "web_app": {
                "url": web_app_url,
              },
            }
          ]
        ]
      },
    },
  )


def print_summary(web_app_url: str) -> None:
  print("Telegram bot configured")
  print(f"Mini app URL: {web_app_url}")
  if CHAT_ID:
    print(f"Launch message sent to chat_id {CHAT_ID}")


def main() -> None:
  parser = argparse.ArgumentParser(description="Configure Telegram bot to open ARK LAB mini app")
  parser.add_argument("--skip-message", action="store_true", help="Do not send a launch message to the configured chat")
  args = parser.parse_args()

  web_app_url = get_web_app_url()
  configure_menu(web_app_url)
  configure_commands()
  if not args.skip_message:
    send_launch_message(web_app_url)
  print_summary(web_app_url)


if __name__ == "__main__":
  main()
