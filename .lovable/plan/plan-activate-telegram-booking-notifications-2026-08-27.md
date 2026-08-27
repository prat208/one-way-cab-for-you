# Plan: Activate Telegram booking notifications

The Telegram alert channel is already coded in `src/lib/notify.server.ts` (sends full lead/booking details — customer, route, fare, coupon, map link — via the Lovable Telegram connector). It stays silent only because one piece is missing: **your Telegram chat ID** (`TELEGRAM_ADMIN_CHAT_ID`). Without it, `telegramChannel.isEnabled()` returns false and nothing is sent.

## Steps

1. **Get your chat ID**
   - Call Telegram `getUpdates` through the connector gateway (one-off call, no code changes).
   - This reads the latest messages sent to your bot (@One_way_cabbot) and extracts your chat ID.
   - Prerequisite: you must have sent at least one message (e.g. `/start`) to the bot. If `getUpdates` comes back empty, I'll ask you to message the bot first.

2. **Store the chat ID**
   - Save it as the `TELEGRAM_ADMIN_CHAT_ID` project secret (never hardcoded in the repo).

3. **Send a live test notification**
   - Trigger a real `sendMessage` to your chat with a sample booking payload (same HTML format the app uses) so you can confirm it arrives and looks right.

4. **Verify end-to-end**
   - Check server logs to confirm the channel is enabled and there are no gateway errors.
   - Optionally walk through a real booking in the preview to confirm the full flow fires.

## Technical details

- No new code required — only the secret + a test call.
- Existing behavior unchanged: in-app admin notifications keep working; the old Railway webhook stays disabled as you requested.
- Telegram messages are sent with `parse_mode: HTML` and include the Google Maps route link when available.
