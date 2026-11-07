<div align="center">

<img src="assets/images/icon.png" alt="Zenith icon" width="96" />

# Zenith — Productivity Hub

**One app for tasks, calendar, habits, notes, budget, workouts, books and goals.**
Cross-platform (Android, iOS, web) app built with React Native, Expo and TypeScript.

[**Live web demo →**](https://rork-zenith-productivity-hub.vercel.app)

![React Native](https://img.shields.io/badge/React_Native-0.81-61DAFB?logo=react&logoColor=white)
![Expo](https://img.shields.io/badge/Expo-SDK_54-000020?logo=expo&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-sync-3FCF8E?logo=supabase&logoColor=white)

</div>

---

## About

I built Zenith because my day was spread across six different apps: a to-do list, a calendar, a habit tracker, a budgeting spreadsheet, a notes app and a reading log. Zenith pulls all of them into one home screen, with Android home-screen widgets so the important things are visible without opening the app.

It is a daily-use personal project that has grown to about **25,000 lines of TypeScript** across 14 screens, 10 widgets and a set of parsing and sync utilities.

<!--
  SCREENSHOTS: add 3–4 phone screenshots to docs/screenshots/ and uncomment this block.
  <p align="center">
    <img src="docs/screenshots/home.png" width="200" />
    <img src="docs/screenshots/budget.png" width="200" />
    <img src="docs/screenshots/tasks.png" width="200" />
    <img src="docs/screenshots/widgets.png" width="200" />
  </p>
-->

## Features

| Area | What it does |
| --- | --- |
| **Home dashboard** | Top-5 priorities, today's habits, schedule, pinned notes and a mood log on one screen |
| **Tasks** | Custom lists, priorities, due dates, Today / Upcoming / Overdue views, local reminders |
| **Calendar** | Month view, holidays, and one-way sync from Google / Apple / Outlook calendars via iCal (no OAuth setup needed) |
| **Natural-language quick add** | Type or speak *"remind me to take medicine at 8am"* or *"schedule dentist next Tuesday at 2pm"* and it becomes a task, note or event |
| **Brain dump** | Paste a messy paragraph of thoughts; it is split into sentences and turned into clean, suggested tasks |
| **Budget** | Income/expense tracking, monthly and quarterly metrics, debt and savings trackers, and **bank-statement import from CSV or PDF** with automatic categorisation |
| **Habits & workouts** | Habit streaks and a workout log |
| **Notes** | Categorised notes with pinning, search and PIN-locked notes |
| **Books** | Reading list, currently reading, and a yearly reading goal |
| **Gifts** | PIN-protected gift ideas per person |
| **Goal bingo** | A yearly goals bingo card |
| **Widgets** | 10 Android home-screen widgets plus lock-screen widget support on Samsung One UI |
| **Cloud sync** | Optional Supabase sync so phone and web share the same data |

## Technical highlights

- **Statement parsing without a server.** `utils/pdfExtractor.ts` reads PDF bank statements on-device: it decompresses PDF content streams with `pako`, extracts the text, then `utils/budgetHelpers.ts` detects the statement's date range, infers the year for each transaction, auto-detects CSV column layouts across different banks, and categorises merchants.
- **Rule-based natural-language parser.** `utils/nlpParser.ts` turns free text into a typed command (`task | note | priority | event`) with dates, times and priority, with no external AI API calls. The same parser powers deep links (`rork-app:///voice-add?cmd=…`) so Google Assistant routines can add tasks.
- **Custom Expo config plugin.** `plugins/withLockScreenWidget.js` edits the generated Android manifest and widget XML at build time to fix Android 12+ widget export rules and enable Samsung lock-screen widgets.
- **Platform-specific code paths.** Widget handlers are split into `.android.ts`, `.ios.ts` and `.web.ts` files so one codebase builds for all three targets.
- **Offline-first data.** All data lives in local storage through a single typed `DataContext`; Supabase sync is opt-in and keyed by device or a shared sync key.
- **Web deployment.** Exported with `expo export --platform web` and deployed on Vercel (Netlify config also included).

## Tech stack

**App:** React Native 0.81 · Expo SDK 54 · Expo Router · TypeScript
**State & data:** React Context · TanStack Query · AsyncStorage
**Backend / sync:** Supabase
**Native features:** expo-notifications · expo-location · expo-image-picker · expo-document-picker · react-native-android-widget
**Deploy:** Vercel (web) · EAS Build (Android/iOS)

## Project structure

```
app/          Screens (Expo Router file-based routing): tasks, calendar, budget, notes, …
components/   Shared UI components
contexts/     DataContext: the app's single source of truth
utils/        NLP parser, PDF/CSV statement import, notifications, calendar & cloud sync
widgets/      Android home/lock-screen widgets + per-platform handlers
plugins/      Custom Expo config plugin for lock-screen widgets
types/        Shared TypeScript types
```

## Running locally

Requires Node.js 20+ (and [Bun](https://bun.sh), or use npm).

```bash
git clone https://github.com/Dani2395/rork-zenith-productivity-hub.git
cd rork-zenith-productivity-hub
bun install            # or: npm install

bun run start-web      # run in the browser
bun run start          # then press "a" for Android or "i" for iOS
```

Home-screen widgets need a native Android build (`npx expo run:android` or an EAS build); they don't run in Expo Go.

## How it was built

I designed the features, made the product decisions and tested the app daily on my own phone. I used AI-assisted development tools ([Rork](https://rork.com) and Claude) to help write and refactor code, and I directed, reviewed and debugged the changes, which is why some commits are authored by those tools.

## Roadmap

- [ ] Two-way calendar sync
- [ ] iOS widgets (WidgetKit)
- [ ] Automated tests for the statement parser and NLP parser
