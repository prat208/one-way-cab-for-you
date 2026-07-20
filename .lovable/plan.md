## Plan: WhatsApp booking notifications via Meta Cloud API

### What we will build
1. Add a **WhatsApp Cloud API channel** to `src/lib/notify.server.ts` that sends a new-booking alert to the admin WhatsApp number `9699025918` (formatted as `919699025918`).
2. Add three new project secrets to hold the client's WhatsApp credentials.
3. Create a standalone **WHATSAPP_SETUP.md** guide that the client can follow to get their own credentials.
4. Test the end-to-end booking notification flow after the client has entered their credentials.

### Why Meta Cloud API is the right "direct" option
- It is WhatsApp's official API, not a third-party BSP.
- The first 1,000 business-initiated conversations per month are free.
- It only needs a phone number, a Meta Business account, and an access token.
- No per-message cost for the small volume of cab-booking alerts this app generates.

### Credentials needed (all belonging to the client)
| Secret | Where it comes from | Format |
|--------|--------------------|--------|
| `WHATSAPP_PHONE_NUMBER_ID` | WhatsApp Business Account → API Setup → Phone Number ID | Numeric string, e.g. `123456789012345` |
| `WHATSAPP_ACCESS_TOKEN` | Meta Business Settings → System Users → WhatsApp Business Management API token | Long token starting with `EAAG...` |
| `WHATSAPP_ADMIN_RECIPIENT` | The admin mobile number that should receive alerts | E.164, e.g. `919699025918` |

### Implementation details
- Add a new `whatsappChannel` in `src/lib/notify.server.ts` next to Slack/Telegram.
- Send to `https://graph.facebook.com/v18.0/{PHONE_NUMBER_ID}/messages`.
- Use a **pre-approved template message** (`new_booking_alert`) to avoid the 24-hour session window.
- The template will include variables: customer name, booking reference, route, phone, and pickup date.
- The channel will only fire when `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_ACCESS_TOKEN`, and `WHATSAPP_ADMIN_RECIPIENT` are all set.
- Keep existing Slack and in-app channels untouched; WhatsApp becomes an additional channel.

### Client setup guide (WHATSAPP_SETUP.md)
The guide will cover:
1. Creating a Meta Business Account.
2. Adding a WhatsApp Business Account and verifying the phone number.
3. Creating a Meta Business System User and generating a permanent access token.
4. Copying the **Phone Number ID** and the **Access Token** into the project secrets.
5. Creating a WhatsApp message template (`new_booking_alert`) with the required variables and submitting it for Meta approval.
6. Setting the admin recipient number.
7. Testing by creating a booking.

### Testing plan
1. After secrets are set, create a booking on `/book`.
2. Verify the server logs show the WhatsApp API response.
3. Confirm the admin receives the WhatsApp message.
4. If Meta rejects the template, fall back to in-app + Slack alerts until the template is approved.

### Notes
- A WhatsApp Cloud API template must be approved before it can be used outside the 24-hour session window.
- The template creation step is the only part that requires Meta review (usually minutes to a few hours).
- The app will not crash if WhatsApp credentials are missing; it will simply skip the WhatsApp channel and keep using Slack/in-app notifications.