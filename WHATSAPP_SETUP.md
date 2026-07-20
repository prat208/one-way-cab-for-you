# WhatsApp Booking Notifications — Setup Guide for OneWayCabs

This guide walks you through connecting your own WhatsApp Business account to the OneWayCabs website so that every new cab booking instantly sends a WhatsApp alert to the admin number.

## What this gives you
- A WhatsApp message on your admin phone for every new booking.
- The message includes: customer name, booking reference, route (Pickup → Drop), customer phone, and pickup date.
- No per-message charges from us; only Meta's free WhatsApp Cloud API tier applies (1,000 business-initiated conversations per month are free).

## Credentials you will collect
The website needs three values from your Meta account. Keep them in a safe place (a password manager is best).

| Secret | What it looks like | Where to find it |
|--------|-------------------|------------------|
| `WHATSAPP_PHONE_NUMBER_ID` | A long number, e.g. `123456789012345` | Meta Business → WhatsApp → API Setup |
| `WHATSAPP_ACCESS_TOKEN` | A long token starting with `EAAG...` | Meta Business → System Users → Tokens |
| `WHATSAPP_ADMIN_RECIPIENT` | Your admin mobile with country code, e.g. `919699025918` | Already configured as your number |

## Step 1 — Create a Meta Business Account
1. Go to [business.facebook.com](https://business.facebook.com/).
2. Click **Create account** and follow the prompts.
3. Verify your business email and phone number.

## Step 2 — Add a WhatsApp Business Account
1. Inside Meta Business Suite, open **WhatsApp Manager** or go to [business.facebook.com/wa/manage](https://business.facebook.com/wa/manage/).
2. Click **Add account** → **Create a new WhatsApp Business Account**.
3. Give it a name (e.g. `OneWayCabs`).
4. Add the phone number you want to use for WhatsApp Business alerts. This can be the same business number you already show on the website.
5. **Verify the phone number** by entering the OTP Meta sends to it.

> Important: This phone number must not already be active on a personal WhatsApp app. If it is, you will need to move it to WhatsApp Business or use a different number.

## Step 3 — Get the Phone Number ID
1. In **WhatsApp Manager**, select your WhatsApp Business Account.
2. Go to the **API Setup** section.
3. You will see a box called **Phone Number ID**. Copy that number.
4. This is your `WHATSAPP_PHONE_NUMBER_ID`.

## Step 4 — Create a permanent access token
1. In Meta Business Suite, open **Business Settings** (gear icon).
2. Go to **Users** → **System Users**.
3. Click **Add** to create a new system user named `OneWayCabs Notifications`.
4. Select the user, click **Generate new token**.
5. Choose the WhatsApp Business Management API and the WhatsApp Business App you created in Step 2.
6. Select these permissions:
   - `whatsapp_business_messaging`
   - `whatsapp_business_management`
7. Copy the token. It starts with `EAAG...` and is very long. This is your `WHATSAPP_ACCESS_TOKEN`.

> Keep this token private. Never share it in chat, email, or screenshots.

## Step 5 — Create the WhatsApp message template
Because admin booking alerts are "business-initiated" messages, WhatsApp requires a pre-approved template.

1. In **WhatsApp Manager**, go to **Account tools** → **Message templates**.
2. Click **Create template**.
3. Choose:
   - Category: `Transaction`
   - Name: `new_booking_alert` (must be exactly this name)
   - Language: `English`
   - Body type: `Text`
4. Paste this exact body text:

```
New booking from {{1}}.

Booking Ref: {{2}}
Route: {{3}}
Phone: {{4}}
Date: {{5}}

Please contact the customer soon.
```

5. The `{{1}}` through `{{5}}` are variables. Do not change them.
6. Submit the template for approval. Approval usually takes a few minutes but can take up to 24 hours.
7. Once approved, the website can send WhatsApp alerts.

## Step 6 — Add the credentials to the website
1. Open the OneWayCabs project in Lovable.
2. Go to the secure secrets form and add:
   - `WHATSAPP_PHONE_NUMBER_ID` = the number from Step 3
   - `WHATSAPP_ACCESS_TOKEN` = the token from Step 4
3. The admin recipient number (`WHATSAPP_ADMIN_RECIPIENT`) is already set to `919699025918`. If you want alerts to go to a different number, update that secret too.

## Step 7 — Test it
1. Open the website and go to `/book`.
2. Fill in a test booking with your own details.
3. Submit the booking.
4. Check the admin WhatsApp number. You should receive a message like:

> New booking from Rahul Sharma.
>
> Booking Ref: OWC-A1B2C3D4
> Route: Pune → Mumbai
> Phone: 9876543210
> Date: 2025-08-15
>
> Please contact the customer soon.

## Troubleshooting

### No message received
- Check that the template `new_booking_alert` is approved in WhatsApp Manager.
- Make sure the phone number in `WHATSAPP_ADMIN_RECIPIENT` includes the country code (for India: `91` followed by the 10-digit number, e.g. `919699025918`).
- Verify the access token has not expired. Tokens created in Meta Business Settings can be set to never expire.

### Error: "Template does not exist"
- The template name must be exactly `new_booking_alert` and it must be approved.
- Wait until Meta shows the status as **Active** before testing.

### Error: "Recipient is not on WhatsApp"
- The admin phone number must have an active WhatsApp account.
- The country code must be correct.

### Want to use a different template name?
- If you already have an approved template, tell the developer the exact template name and the variable order, and the code can be updated to match.

## Security reminders
- Never share `WHATSAPP_ACCESS_TOKEN` in screenshots, chat, or email.
- If the token is ever leaked, revoke it immediately in Meta Business Settings and generate a new one.
- The website stores these credentials as encrypted secrets, so they are never visible in the code or to end users.
