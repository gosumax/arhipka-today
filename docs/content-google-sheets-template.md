# Google Sheets template for service content

This project supports a minimal content layer from Google Sheets for service cards and service data.

## 1) Required columns

Use exactly these column names in row 1:

- `id`
- `slug`
- `title`
- `short_title`
- `category`
- `price_from`
- `price_text`
- `duration_text`
- `short_description`
- `full_description`
- `includes`
- `schedule_text`
- `image_key`
- `image_url`
- `cta_text`
- `cta_url`
- `is_active`
- `sort_order`
- `updated_at`

## 2) Which fields are required

Minimum required fields per row:

- `id` or `slug` (at least one must be filled)

Recommended to always fill:

- `title`
- `price_text`
- `duration_text`
- `short_description`
- `is_active`
- `sort_order`

## 3) Example rows (2-3 rows)

Example format:

```csv
id,slug,title,short_title,category,price_from,price_text,duration_text,short_description,full_description,includes,schedule_text,image_key,image_url,cta_text,cta_url,is_active,sort_order,updated_at
classic-boat-1h,classic-boat-1h,Классическая морская прогулка,Катер 1 час,Море,2000,"Взрослый 2200 ₽, детский 1200 ₽, малыш 700 ₽",1 час,"Спокойная прогулка на катере для семьи.","Спокойный формат с фото-остановками и купанием по погоде.","катер; фото-остановки; купание по погоде","По расписанию",classicBoat,,Узнать расписание,,true,10,2026-05-07T12:00:00Z
speed-boat-2h,speed-boat-2h,Скоростная морская прогулка 2 часа,Скоростная 2 часа,Море,3000,"Взрослый 3200 ₽, детский 2100 ₽, малыш 1200 ₽",2 часа,"Быстрый формат на 2 часа с несколькими локациями.","Насыщенный маршрут с остановками и купанием по погоде.","скоростной катер; фото-остановки","По расписанию",speedBoat,,Узнать расписание,,true,20,2026-05-07T12:05:00Z
quad-25-3h,quad-25-3h,Квадроциклы 2.5-3 часа,Квадро 2.5-3,Квадро/Эндуро,9000,9000 ₽,2.5-3 часа,"Продолжительный активный маршрут.","Больше рельефа и остановок, чем в коротком формате.","квадроцикл; инструктаж; сопровождение","По согласованию",quad,,Узнать детали,,false,90,2026-05-07T12:10:00Z
```

## 4) How to hide a card

Set `is_active` to `false`.

Accepted true/false values:

- `true`, `1`, `yes`, `да`
- `false`, `0`, `no`, `нет`

Value matching is case-insensitive, so `TRUE/FALSE` also work.

## 5) How to change price

Change:

- `price_text` for display text on site
- `price_from` for numeric base price (optional helper field)

## 6) How to change card order

Set `sort_order`:

- lower number = shown earlier
- higher number = shown later

## 7) Includes format

`includes` supports one of:

- semicolon list: `item 1; item 2; item 3`
- pipe list: `item 1 | item 2 | item 3`
- multiline text (one item per line)

## 8) Google Sheets URL

Use a public export URL (CSV or JSON). Example CSV format:

- `https://docs.google.com/spreadsheets/d/<SHEET_ID>/gviz/tq?tqx=out:csv&sheet=<SHEET_NAME>`
- or `https://docs.google.com/spreadsheets/d/<SHEET_ID>/export?format=csv&gid=<GID>`

Set in environment:

- `GOOGLE_SHEETS_CONTENT_URL=...`
- Optional refresh interval for Node runtime server: `GOOGLE_SHEETS_REFRESH_MS=120000`

No Google account connection and no private keys are required for this minimal integration.
