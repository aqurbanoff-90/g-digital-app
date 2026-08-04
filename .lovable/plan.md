# План: Главный экран DigiG — Pakhlava Tea House

Реализую главный экран как мобильный React-компонент в TanStack Start. Светлый минимализм Material/iOS с luxury-оттенком.

## Дизайн-токены (src/styles.css)

- Фон: `#F8F9FA`, карточки белые с тенью `0 8px 24px rgba(0,0,0,0.04)` и ring `rgba(0,0,0,0.05)`
- Текст: `#0A0A0A` / вторичный `#6B7280`
- Акцент: `#1A73E8`
- Скругление карточек: 28–32px
- Шрифт: Inter Variable через `@fontsource-variable/inter`, привязан к `--font-sans` в `@theme inline`

## Структура (`src/routes/index.tsx`)

Контейнер: `max-w-[430px]`, центр, `min-h-screen`, фон `#F8F9FA`, padding 20px.

```text
┌─────────────────────────────────┐
│  ☰    Али Гурбанов         👤   │  TopBar (без панели)
│       Шеф-Бармен                │
│       PAKHLAVA TEA HOUSE        │
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │
│ │  ⏰ analog  │   Июнь 2026   │ │  LuxuryWidget
│ │  12 3 6 9   │ Пн Вт..Вс +   │ │
│ │             │ сетка дней    │ │
│ └─────────────────────────────┘ │
├─────────────────────────────────┤
│ ┌────────┐  ┌────────┐          │
│ │ Приход │  │Продажи │          │  ModuleGrid 2×3
│ ├────────┤  ├────────┤          │
│ │Списания│  │ Долги  │          │
│ ├────────┤  ├────────┤          │
│ │ Склад  │  │ Итоги  │          │
│ └────────┘  └────────┘          │
├─────────────────────────────────┤
│   🔍       ●🧮         💬       │  BottomNav
└─────────────────────────────────┘
```

## Компоненты

1. **TopBar** — слева `Menu`, в центре стек (имя + роль + название заведения uppercase синим акцентом), справа `User`. Без фоновой панели.
2. **LuxuryWidget** — белая капсула rounded-[32px], две колонки с вертикальным разделителем:
   - **AnalogClock** — SVG 160×160, тонкие деления, жирные цифры 12/3/6/9 (Inter 700), стрелки часы/минуты графитовые, секундная синяя, обновление `setInterval(1s)`.
   - **CalendarMini** — заголовок «Месяц Год», строка Пн–Вс, сетка дней; сегодня — синий круг `#1A73E8` с белым текстом.
3. **ModuleCard / ModuleGrid** — 6 квадратных карточек 2 в ряд: иконка в круглой подложке с акцентом 8% сверху, название снизу. Иконки: `ArrowDownToLine`, `TrendingUp`, `Trash2`, `Wallet`, `Package`, `BarChart3`.
4. **BottomNav** — три кнопки без панели: слева `Search`, центр `Calculator` в синем круге 64px с цветной тенью, справа `MessageCircle`.

## Технические детали

- `bun add @fontsource-variable/inter`, импорт в `src/styles.css` в верхнем блоке `@import`, регистрация `--font-sans` в `@theme inline`.
- Иконки — `lucide-react` (уже есть).
- Виджет превью — mobile.
- `head()` в index: title «DigiG — Pakhlava Tea House», описание Luxury Business Suite.

## Файлы

- Изменить: `src/styles.css`, `src/routes/index.tsx`
- Создать: `src/components/home/{TopBar,LuxuryWidget,AnalogClock,CalendarMini,ModuleCard,ModuleGrid,BottomNav}.tsx`

После реализации проверю скриншотом Playwright на 390×844.
