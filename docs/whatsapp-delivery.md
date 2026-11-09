# WhatsApp delivery

Auto-send can deliver a birthday or anniversary card on WhatsApp. It is **built and tested, but off** until the Meta side
below is set up. Until then a card goes by email (if they agreed) or the owner shares the link.

## How it works

1. The owner saves a person with a WhatsApp number and ticks **They agreed to get cards on WhatsApp**
   (`relationships.deliveryConsent.whatsapp`).
2. On the day the engine prepares the card and the owner reviews it (24 hours). On approval, or when the window ends,
   `dispatchScheduledSend` tries the channels in order: **WhatsApp, then email**.
3. The WhatsApp provider (`functions/src/autosend/whatsapp.ts`) posts an approved **template** to Meta's Cloud API from
   Occasio's business number. The wish says who it is from; a button opens the card.
4. If WhatsApp cannot deliver (not on WhatsApp, STOP, cap reached, Meta refuses, or any error) the card goes by email.

The wish arrives **from Occasio's number**, not from the owner's own. For the owner's own number, the review screen has
**Open WhatsApp chat with …**: a chat with the wish already written, one tap on Send (`whatsappChatUrl`). Nothing is sent
until they tap.

## Why not Evolution API or a user's own WhatsApp

Evolution API can run on the unofficial WhatsApp Web route (Baileys). Linking a person's own WhatsApp to our server
breaks WhatsApp's terms, can get their number banned, hands us access to their chats and needs an always-on server per
session. Evolution API's other mode is the same official Cloud API used here, so we call Meta directly from Functions
and keep no extra server.

## Limits

* **100 a year per user** (`WHATSAPP_YEARLY_CAP`), counted per calendar year in IST in `whatsapp_usage/{uid}_{year}`.
* **Accepted is not delivered.** `sent` means Meta accepted the message. A later failure to deliver (phone off for weeks,
  number not on WhatsApp after all) is not reported back, so email does not take over after that. Delivery receipts
  through the webhook are not handled yet.
* **Cost.** Meta charges per template message (about 0.8 to 0.9 rupees for marketing and 0.115 for utility in India in
  2026, plus GST; check Meta's pricing page). At the full 100 that is roughly 100 rupees a user a year.
* **Template category.** A birthday card from a friend is likely to be classed as *marketing*. Submit it as utility only
  if Meta agrees.

## Setup (needs the Meta and Firebase consoles)

1. **Meta Business verification** and a **WhatsApp Business Account**; add a phone number that is not on the normal
   WhatsApp app, and get its display name approved.
2. **Create the template** `occasio_wish_delivery`, language `en`:
   * Body: `Hi {{1}}, {{2}} made you a {{3}} surprise on Occasio. Tap below to open it.`
     (`{{1}}` their name, `{{2}}` who it is from, `{{3}}` `birthday` or `anniversary`; no variable at the start or end.)
   * Footer: `Reply STOP to stop these messages`
   * Button, type URL, text `Open your wish`: `https://occasio-greetings.vercel.app/c/{{1}}`
     (the button adds only the card's slug; the site address is fixed in the template, so it must match `OCCASIO_SHARE_BASE`).
3. **System-user access token** (never expiring) with `whatsapp_business_messaging`, and the **phone number ID**.
4. **Webhook**: callback URL `https://<api host>/v1/whatsapp/webhook`, verify token = `WHATSAPP_VERIFY_TOKEN`, subscribe
   to `messages`. This is how STOP is heard.
5. **Functions environment** (secrets, never committed):

   | Name | What |
   |---|---|
   | `WHATSAPP_ACCESS_TOKEN` | the system-user token |
   | `WHATSAPP_PHONE_NUMBER_ID` | the sending number's ID |
   | `WHATSAPP_APP_SECRET` | the Meta app secret; signs webhook deliveries |
   | `WHATSAPP_VERIFY_TOKEN` | a random string you choose, for the webhook address check |
   | `WHATSAPP_TEMPLATE_NAME` | optional, default `occasio_wish_delivery` |
   | `WHATSAPP_TEMPLATE_LANGUAGE` | optional, default `en` |
   | `WHATSAPP_API_VERSION` | optional, default `v23.0`; Meta retires old versions, so check |
   | `WHATSAPP_YEARLY_CAP` | optional, default `100` |

   Without the token and number ID the provider is simply absent and nothing else changes. Also set
   `OCCASIO_AUTOSEND_DISPATCH=true`.
6. **Deploy** `firestore.rules` (the `deliveryConsent` rule now allows `whatsapp`, and the new collections are server-only)
   and `functions/`. Release the app build **after** this, because its copy says cards can go on WhatsApp.
7. **Try it** with your own number: save yourself as a person with consent, arm a birthday for today, approve, and watch
   `scheduled_sends.<id>.deliveryChannelUsed`. Then reply STOP and check that `whatsapp_optouts` gains a document and the
   next send falls back to email.

## Where it lives

| What | File |
|---|---|
| Provider, cap, STOP, webhook | `functions/src/autosend/whatsapp.ts` |
| Provider order and the interface | `functions/src/autosend/providers.ts` |
| Passing the owner and sender name | `functions/src/autosend/dispatch.ts` |
| Webhook route (raw body kept for the signature) | `functions/src/index.ts` |
| Consent field, number field | `src/features/vault/ui/screens/AddPersonScreen.tsx` |
| One-tap chat | `src/features/vault/domain/scheduledSend.ts`, `ScheduledSendReviewScreen.tsx` |
| Rules for the consent key and the new collections | `firestore.rules` |
| Tests | `__tests__/functions/whatsapp.test.ts`, `__tests__/vault/` |
