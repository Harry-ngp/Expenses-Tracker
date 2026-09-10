# Project State & Memory: ExpenseIQ

## Current Status
- **Milestone**: 1.0 (Core Feature Complete & Release Hardened)
- **Active Focus**: Ready for release build (`eas build -p android --profile preview`) and transition to Milestone 1.1.
- **Git Branch**: `Feature_vijay`

## Key Decisions & Architecture Log
- **Offline-First Storage**: Local SQLite is the immediate source of truth. Writes never wait for network calls.
- **Dynamic Payment Default**: `AddExpenseScreen` queries the user's custom payment method list ordered by priority, selecting the 1st method as default.
- **Static Add Expense Layout**: Avoided wrapping in `ScrollView`; calculated Android keyboard offset (`55px`) dynamically to keep the "Save Expense" button fully visible.
- **Native Audio Removed**: Dropped `expo-av` due to SDK 57 crash; replaced with safe no-op functions in `src/utils/sounds.js`.
- **Target Single Architecture**: Pinned `arm64-v8a` in `eas.json` to keep release APK size under ~24MB.

## Verification Status
- `npx expo-doctor`: 21/21 checks passed.
- `npx expo export --platform android`: Clean compilation, 47 assets (14 unused fonts stripped).
- Codebase Map: All 7 documents generated under `.planning/codebase/`.
