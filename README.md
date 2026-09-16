# Yuxia Bio Link

Адаптивная bio-link страница с живыми счётчиками Telegram и TikTok на Cloudflare Workers.

## Локальный запуск

```bash
npm install
npm run dev
```

## Живые счётчики

Worker получает публичные значения со страниц:

- Telegram: `https://t.me/yuxiazx`
- TikTok: `https://www.tiktok.com/@yuxiazxc`

Ответ API хранится в Cloudflare KV и обновляется каждые 10 минут, чтобы страницы соцсетей не запрашивались при каждом открытии сайта. Если внешний источник временно недоступен, Worker отдаёт последние успешные данные, а в интерфейсе дополнительно остаются резервные значения из HTML.

Токены и секреты не требуются. Binding `STATS_KV` настроен в `wrangler.jsonc`.
