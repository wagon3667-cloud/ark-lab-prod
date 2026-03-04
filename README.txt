ARK LAB production bundle

Что внутри:
- index.html                -> production landing
- shared.css               -> общая тема для landing и mini app
- config.js                -> контакты и ссылки
- landing.js               -> reveal и CTA-логика
- server.py                -> zero-dependency backend + Telegram bridge + static hosting
- configure_bot.py         -> настройка Telegram bot menu button и launch message
- mini-app/index.html      -> production mini app shell
- mini-app/app.js          -> flow, estimate, brief, Telegram WebApp hooks
- .env                     -> локальные секреты бота и chat_id
- .env.example             -> шаблон переменных

Перед деплоем:
1. Секреты уже вынесены в ark_lab_prod/.env
2. Если позже сменишь бота или chat_id, обнови:
   - ARK_LAB_BOT_TOKEN
   - ARK_LAB_TELEGRAM_CHAT_ID
   - ARK_LAB_PUBLIC_URL
3. Если хочешь публичную кнопку контакта, добавь свой @username:
   - ARK_LAB_CONTACT_HANDLE
4. При необходимости подправь config.js

Как открывать локально:
- landing:   open '/Users/mironfedorovich/Downloads/Архив (1)/ark_lab_prod/index.html'
- mini app:  open '/Users/mironfedorovich/Downloads/Архив (1)/ark_lab_prod/mini-app/index.html'

Как запускать как настоящий продукт:
- из корня проекта:
  python3 -m ark_lab_prod.server --host 127.0.0.1 --port 8787
- после этого:
  http://127.0.0.1:8787/
  http://127.0.0.1:8787/mini-app/

Как деплоить:
- подними ark_lab_prod.server как обычный Python web process
- landing работает из корня
- mini app живет по пути /mini-app/
- этот же URL /mini-app/ ставишь в Telegram bot как WebApp URL
- backend endpoint /api/brief отправляет brief напрямую в твой Telegram chat

Как привязать mini app к Telegram bot:
1. Деплой bundle на публичный https домен
2. Запиши домен в ark_lab_prod/.env:
   - ARK_LAB_PUBLIC_URL=https://your-domain.example.com
3. Запусти:
   - python3 -m ark_lab_prod.configure_bot
4. Скрипт:
   - поставит chat menu button типа web_app
   - добавит команды /start и /app
   - отправит тебе в Telegram тестовое сообщение с кнопкой открытия mini app

Важно:
- Telegram Mini App не откроется из бота с localhost или file://
- нужен именно публичный https URL

Что уже готово без backend:
- интерактивный flow
- rough estimate
- draft brief
- copy / share
- Telegram WebApp ready hooks через sendData
