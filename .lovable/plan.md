Add a Slack notification channel so every new cab booking instantly posts full customer + trip details to an admin Slack channel, alongside the existing in-app admin bell.

## What we'll build

1. **Slack connector setup**
   - Link the Slack App connector to this project (opens the connector picker so you can choose/create a Slack workspace connection).
   - After linking, the project gets `SLACK_API_KEY` and gateway access.

2. **New notification event: `booking.created`**
   - Extend `src/lib/notify.server.ts` to support a `booking.created` event type.
   - Payload includes: customer name, phone, email, pickup city, drop city, pickup date/time, vehicle, trip type, estimated fare, distance, booking reference, and notes.

3. **Slack channel implementation**
   - Add a `slack` channel to `CHANNELS` in `src/lib/notify.server.ts`.
   - Post a formatted message to a configurable Slack channel (default `#bookings`, overridable via `SLACK_BOOKINGS_CHANNEL` secret).
   - Use the Lovable connector gateway: `https://connector-gateway.lovable.dev/slack/api/chat.postMessage`.
   - Include a clean booking summary block with customer contact details and trip info.

4. **Trigger on booking creation**
   - In `src/lib/booking.functions.ts`, after `createBooking` succeeds, call `dispatch({ type: "booking.created", payload: { ... } })`.
   - The dispatcher already fetches admin recipients and runs all enabled channels, so no new admin lookup logic is needed.

5. **Admin dashboard visibility**
   - Ensure the existing in-app admin bell / admin notifications table still shows the booking alert, so Slack is not the only channel.

6. **Testing / verification**
   - Run a booking submission in the preview.
   - Confirm the Slack message arrives in the chosen channel and the in-app admin notification is created.

## Technical details

- Gateway endpoint: `POST https://connector-gateway.lovable.dev/slack/api/chat.postMessage`
- Required headers: `Authorization: Bearer ${LOVABLE_API_KEY}`, `X-Connection-Api-Key: ${SLACK_API_KEY}`, `Content-Type: application/json`
- Environment variables needed: `SLACK_API_KEY` (linked automatically), optional `SLACK_BOOKINGS_CHANNEL`.
- The Slack connector bot must be invited to the target channel if it is private; public channels are accessible by default.

## User action required before implementation

You need to create or link a Slack connection. During the build step I will call `standard_connectors--connect` for Slack, which opens the connector dialog for you to complete.