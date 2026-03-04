from __future__ import annotations

import argparse
import csv
import json
import mimetypes
import os
import uuid
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit, unquote
from urllib.request import Request, urlopen

BASE_DIR = Path(__file__).resolve().parent
LEADS_DIR = BASE_DIR / "incoming"
LEADS_CSV_PATH = LEADS_DIR / "leads.csv"
LEADS_DIR.mkdir(parents=True, exist_ok=True)


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
CONTACT_HANDLE = os.getenv("ARK_LAB_CONTACT_HANDLE", "").strip()
CONTACT_HINT = os.getenv("ARK_LAB_CONTACT_HINT", "").strip()


def build_lead_id() -> str:
  return uuid.uuid4().hex[:8].upper()


def save_payload(payload: dict, lead_id: str, created_at: str) -> Path:
  timestamp = created_at.replace(":", "").replace("-", "")
  path = LEADS_DIR / f"{timestamp}-{lead_id.lower()}.json"
  path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
  return path


def append_csv_row(payload: dict) -> None:
  header = [
    "lead_id",
    "status",
    "created_at",
    "source",
    "client_name",
    "client_username",
    "client_contact",
    "solution",
    "estimate_from",
    "estimate_to",
    "request_text",
  ]
  file_exists = LEADS_CSV_PATH.exists()
  with LEADS_CSV_PATH.open("a", encoding="utf-8", newline="") as file:
    writer = csv.DictWriter(file, fieldnames=header)
    if not file_exists:
      writer.writeheader()
    writer.writerow(
      {
        "lead_id": payload.get("lead_id", ""),
        "status": payload.get("status", ""),
        "created_at": payload.get("created_at", ""),
        "source": payload.get("source", ""),
        "client_name": payload.get("client_name", ""),
        "client_username": payload.get("client_username", ""),
        "client_contact": payload.get("contact", ""),
        "solution": payload.get("solution", ""),
        "estimate_from": (payload.get("estimate") or {}).get("priceFrom", ""),
        "estimate_to": (payload.get("estimate") or {}).get("priceTo", ""),
        "request_text": payload.get("requestText", ""),
      }
    )


def send_telegram_message(text: str) -> dict:
  if not BOT_TOKEN or not CHAT_ID:
    raise RuntimeError("Telegram bot credentials are not configured")

  url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"
  body = {
    "chat_id": CHAT_ID,
    "text": text,
    "disable_web_page_preview": True,
  }

  request = Request(
    url,
    data=json.dumps(body).encode("utf-8"),
    headers={"Content-Type": "application/json"},
    method="POST",
  )

  with urlopen(request, timeout=15) as response:
    return json.loads(response.read().decode("utf-8"))


class ArkLabHandler(BaseHTTPRequestHandler):
  server_version = "ARKLAB/1.0"

  def log_message(self, format: str, *args) -> None:  # noqa: A003
    return

  def end_headers(self) -> None:
    self.send_header("Access-Control-Allow-Origin", "*")
    self.send_header("Access-Control-Allow-Headers", "Content-Type")
    self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    super().end_headers()

  def do_OPTIONS(self) -> None:
    self.send_response(204)
    self.end_headers()

  def do_GET(self) -> None:
    path = urlsplit(self.path).path

    if path == "/api/health":
      self.send_json(
        200,
        {
          "ok": True,
          "botConfigured": bool(BOT_TOKEN and CHAT_ID),
          "contactHandle": CONTACT_HANDLE,
          "contactHint": CONTACT_HINT,
        },
      )
      return

    self.serve_static(path)

  def do_POST(self) -> None:
    path = urlsplit(self.path).path

    if path not in {"/api/brief", "/api/lead"}:
      self.send_json(404, {"ok": False, "error": "Not found"})
      return

    try:
      length = int(self.headers.get("Content-Length", "0"))
    except ValueError:
      self.send_json(400, {"ok": False, "error": "Invalid content length"})
      return

    raw_body = self.rfile.read(length)
    try:
      payload = json.loads(raw_body.decode("utf-8"))
    except json.JSONDecodeError:
      self.send_json(400, {"ok": False, "error": "Invalid JSON"})
      return

    request_text = str(payload.get("requestText", "")).strip()
    if not request_text:
      self.send_json(400, {"ok": False, "error": "Request text is required"})
      return

    created_at = datetime.now(timezone.utc).isoformat()
    lead_id = build_lead_id()
    telegram_user = payload.get("telegramUser") or {}
    client_name = " ".join(
      part
      for part in [telegram_user.get("first_name", ""), telegram_user.get("last_name", "")]
      if part
    ).strip()
    client_username = str(telegram_user.get("username", "")).strip()
    contact = str(payload.get("contact", "")).strip() or client_username

    lead_payload = {
      **payload,
      "lead_id": lead_id,
      "status": "new",
      "created_at": created_at,
      "client_name": client_name,
      "client_username": client_username,
      "contact": contact,
    }

    save_payload(lead_payload, lead_id, created_at)
    append_csv_row(lead_payload)

    estimate = payload.get("estimate") or {}
    selections = payload.get("selections") or {}
    summary_lines = [
      f"Lead ID: {lead_id}",
      f"Status: new",
      f"Source: {payload.get('source', 'mini-app')}",
      f"Client: {client_name or '-'}",
      f"Telegram: {client_username or '-'}",
      f"Contact: {contact or '-'}",
      f"Telegram user id: {telegram_user.get('id', '-')}",
      "",
      "Запрос клиента:",
      request_text,
      "",
      f"Формат решения: {payload.get('solution', '-')}",
      f"Estimate: {estimate.get('priceFrom', '?')}-{estimate.get('priceTo', '?')}k / {estimate.get('daysFrom', '?')}-{estimate.get('daysTo', '?')} дней",
      f"Core: {(selections.get('core') or {}).get('title', '-')}",
      f"Goal: {(selections.get('goal') or {}).get('title', '-')}",
      f"Module: {(selections.get('module') or {}).get('title', '-')}",
      f"Mode: {(selections.get('mode') or {}).get('title', '-')}",
    ]

    message = "ARK LAB / new lead\n\n" + "\n".join(summary_lines)

    try:
      telegram_response = send_telegram_message(message)
    except Exception as exc:
      self.send_json(502, {"ok": False, "error": f"Failed to send Telegram message: {exc}"})
      return

    self.send_json(
      200,
      {
        "ok": True,
        "telegram": telegram_response.get("ok", False),
        "leadId": lead_id,
        "status": "new",
      },
    )

  def serve_static(self, raw_path: str) -> None:
    request_path = unquote(raw_path)

    if request_path == "/":
      target = BASE_DIR / "index.html"
    elif request_path in {"/mini-app", "/mini-app/"}:
      target = BASE_DIR / "mini-app" / "index.html"
    else:
      target = (BASE_DIR / request_path.lstrip("/")).resolve()
      if not str(target).startswith(str(BASE_DIR.resolve())):
        self.send_json(403, {"ok": False, "error": "Forbidden"})
        return
      if target.is_dir():
        target = target / "index.html"

    if not target.exists() or not target.is_file():
      self.send_json(404, {"ok": False, "error": "Not found"})
      return

    content_type, _ = mimetypes.guess_type(str(target))
    self.send_response(200)
    self.send_header("Content-Type", content_type or "application/octet-stream")
    self.send_header("Content-Length", str(target.stat().st_size))
    self.end_headers()
    self.wfile.write(target.read_bytes())

  def send_json(self, status: int, payload: dict) -> None:
    encoded = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    self.send_response(status)
    self.send_header("Content-Type", "application/json; charset=utf-8")
    self.send_header("Content-Length", str(len(encoded)))
    self.end_headers()
    self.wfile.write(encoded)


def main() -> None:
  parser = argparse.ArgumentParser(description="ARK LAB production server")
  parser.add_argument("--host", default=os.getenv("HOST", "0.0.0.0"))
  parser.add_argument("--port", type=int, default=int(os.getenv("PORT", "8787")))
  args = parser.parse_args()

  server = ThreadingHTTPServer((args.host, args.port), ArkLabHandler)
  print(f"ARK LAB server running on http://{args.host}:{args.port}")
  try:
    server.serve_forever()
  except KeyboardInterrupt:
    pass
  finally:
    server.server_close()


if __name__ == "__main__":
  main()
