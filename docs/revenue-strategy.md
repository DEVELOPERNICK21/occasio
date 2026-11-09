# Revenue and market strategy

Written 2026-11-04. It builds on `prd-trd.md` (pricing, tiers), `store-assets/03-positioning.md` and `05-growth-plan.md`
(store listing, tests, calendar) and what has been built since: invitations, photo scenes, WhatsApp delivery. It does not
repeat them. Numbers that come from the project are marked **(repo)**; numbers from outside are marked **(vendor)** or
**(report)** and are weak evidence, because I found no independent India data. Everything marked **(assumption)** is
there to be tested, not believed.

---

## 0. The short version

1. **We cannot earn reliably yet.** Cloud Functions are not deployed, so billing sync never writes the paid tier and the
   single-wish credit is never spent (a card can be reused for free). The production website is also behind the repo: the
   invitation photo scenes and new link previews are not live. Fixing this is step zero and nothing below matters until it
   is done.
2. **The best money is in events, not subscriptions.** A wedding invitation is worth far more than a $0.99 wish, and we
   currently sell it at exactly that price because an invitation uses the same card allowance and paywall as a card. Sell
   it per event, in rupees.
3. **Pro stays, as the "remember it for me" product**: the Vault, reminders and auto-send with WhatsApp. It is the retention
   engine and the repeat revenue, but at Indian prices it is the smaller number.
4. **Distribution comes from the people on the other end.** One wedding invitation reaches 100 to 500 relatives in the right
   age band. That is the strongest loop in the product, and it has no "make your own" door today.
5. **A business segment is the upside, not the plan**: agents, shops and clinics that send customers birthday and
   anniversary wishes. Test it by hand with ten customers before building anything.

---

## 1. Where we really are

| Area | Today | Consequence |
|---|---|---|
| **Products** (App Store Connect) | `occasio_pro_monthly` $2.99, `occasio_pro_yearly` $19.99, `occasio_wish_single` $0.99 (repo) | Prices are in dollars; the PRD's rupee plan (Personal ₹149 a month or ₹999 a year, one-off ₹49 to 99) was never applied |
| **Tiers in code** | One entitlement, `occasio_pro`, mapped to "personal" (5 Vault people, 24 cards a year, 365-day links). No Family tier exists (repo) | The PRD's Family tier is a plan, not a product |
| **Free** | 1 card for life, 30-day links, 1 saved person (repo) | Reasonable hook; the invitation uses the same one card |
| **Invitations** | Wedding, engagement, anniversary (3 photo designs) and 5 party occasions, with a WhatsApp reply. They share the card pipeline, allowance and paywall (`docs/invitations.md`) | A wedding invitation costs the host a $0.99 credit or a slice of Pro |
| **Billing plumbing** | Functions not deployed; billing sync, `consume-credit` and the RevenueCat webhook unverified (`production-readiness.md`) | Revenue leaks and Pro cannot unlock server features |
| **Website in production** | Behind the repo: the invitation photo files return 404, so the old drawn scenes and plain link previews are what people see | Redeploy before any invitation marketing |
| **Auto-send** | Built; email real if Resend is set; WhatsApp built and tested but off until Meta is set up (`whatsapp-delivery.md`) | Do not sell it, or put it on the store page, until verified live |
| **Analytics** | Firebase sink wired, behind consent (repo) | We can measure; there are no dashboards or targets yet |
| **Ratings** | No in-app review prompt (repo) | Reviews will come from angry users first |
| **Language** | English only (repo) | Real ceiling in India; Hindi is the next biggest unlock after launch |

---

## 2. What the market says (and how much to trust it)

| Finding | Source quality | What it means for us |
|---|---|---|
| Template video wedding invites in India are sold by studios from about ₹2,500 to ₹5,000, with marketplace listings from ₹500 to ₹40,000 and a few hundred rupees for a plain e-card ([Happiffie](https://www.happiffie.com/pune/premium-animated-wedding-video-invitations), [WedMeGood vendors](https://www.wedmegood.com/vendors/delhi-ncr/wedding-cards/)) | **Vendor claims.** Unclear if per invite or per package | A host already expects to pay hundreds to thousands of rupees. A $0.99 wish prices an invitation like a sticker |
| Evite sells per event ($15.99 up to 15 guests, $32.99 up to 40) and a Pro plan near $250 a year; Paperless Post charges per send ("coins") and sells a Pro plan ([Evite vs Paperless Post](https://www.usecarly.com/blog/evite-vs-paperless-post/), [alternatives](https://rsvpify.com/top-paperless-post-alternatives/)) | Blogs, often disagreeing | **Per event is the norm in invitations.** Our $19.99 a year Pro is far below the category |
| Canva Pro is about $120 a year ([source](https://dupple.com/learn/best-free-invitation-makers)) | Blog | Anyone can design an invitation; our edge is the finished, Indian, interactive result in minutes |
| Hard-paywall apps convert about 11% of users to paid, freemium about 2%; lower-priced apps keep 36% of users against 23% for high-priced ones ([RevenueCat 2026](https://www.contentgrip.com/subscription-app-market-2026-growth/)) | **Report**, all categories | Plan on 2 to 4% for a freemium card app (the PRD says 3 to 6%). A high-intent event purchase should convert far better; test it |
| Entry subscription plans in India sit well under $5 a month and conversion falls near $10 ([Solidgate](https://solidgate.com/blog/payment-methods-in-india/)); card use is low and UPI AutoPay is how recurring payments work ([Vmobify](https://vmobify.com/blog/upi-autopay-app-subscriptions)); Apple was reported not to offer UPI AutoPay for App Store subscriptions ([TechCrunch](https://techcrunch.com/?p=2442628)) | **Vendor blogs and one news report** | Price in rupees and low. Android is likely the easier place to sell subscriptions. Confirm Google Play's current India billing options before deciding |
| India's app spending reached about $345 million in Q2 2026, up 35% a year (Sensor Tower, quoted by [Cobo](https://agenticwallet.cobo.com/agentic-wallet/news/india-s-app-market-shows-record-willingness-to-pay-as-q2-revenue-hits-al)) | Secondary quote | The market is paying, and growing |
| Indian CRMs for insurance agents list birthday and anniversary wishes from about ₹999 (period unclear); an approved WhatsApp wish costs about ₹0.96 to ₹1.20 ([Techjockey](https://www.techjockey.com/detail/smartagent), [RichAutomate](https://richautomate.in/blog/whatsapp-birthday-anniversary-wishes-automation-india-2026)) | Listings and a vendor guide | A paying business segment exists for exactly what the Vault and auto-send do |

**Not found:** an independent India ARPU, the annual-plan share, or the number of weddings addressable. Do not put any of
these in a plan until you have your own data.

---

## 3. The strategy: three revenue engines and one growth engine

### Engine 1: Events (invitations), sold per event

The most valuable thing we have, and the least charged for. Hosts have a date, a budget and a reason to share with
hundreds of people.

* **Sell it as its own product**, a consumable per event, not a card credit. Wedding and engagement highest, then
  anniversary, then every other gathering.
* **Include what a host cares about**: no "made with" footer, 365-day link (it must outlive the wedding by a long way),
  unlimited guests, the WhatsApp reply, every design of that occasion.
* **The free card still works for one invitation**, with the footer. A free invitation that reaches 200 relatives is the
  best advertisement we can buy, and the host has seen the product work before paying.
* **Add what the research on Indian weddings says is missing** (appendix): a "with the blessings of" block (parents and
  grandparents), ritual names with a line of meaning, and a tradition choice (Punjabi, Gujarati, Bengali, South Indian,
  Marathi, nikah, Anand Karaj). That is what a Western tool cannot copy.
* **Later paid add-ons**: a guest and RSVP tracker for the host (needs stored guest data; opt-in, with DPDP review) and
  WhatsApp delivery of the invitation to the guest list (cost per message, so priced per guest).

### Engine 2: Pro (remember it for me)

The Vault, reminders, auto-send (WhatsApp then email), 24 cards a year, 365-day links, no footer. It is the repeat
revenue and the reason someone opens the app on a day other than a wedding. Keep it simple: one Pro, annual-led. Do not
build the PRD's Family tier until Pro retention is measured.

### Engine 3: Business and professionals (test, do not build)

Insurance agents, jewellers, clinics, coaching centres and realtors sending customers birthday and anniversary wishes.
The product already does the hard part (dates, a prepared card, review, WhatsApp). What is missing is branding (their
name and logo), a contact list import, and consent they can show. Approach: run it by hand for **ten** customers for a
month, charging ₹499 to ₹999 a month, and learn the consent and template problems before writing code. Message cost is
small next to that price at 1,000 wishes a year (about ₹1,000 a year of messages). **Meta's rules for marketing
templates and each customer's consent decide whether this is allowed at all.**

### Growth engine: the other person

| Loop | How it works | What to build |
|---|---|---|
| **Guest to host** | 100 to 500 guests open an invitation. Some are about to host something | A calm "Make an invitation like this" door on a free invitation (it exists as a small link at the end; make it a real, tracked step). Count taps as the PRD's recipient-to-sender metric |
| **Recipient to sender** | A card's recipient is surprised and shares a story frame | Built (story frame). Add WhatsApp Status sizing and festival packs; Status probably reaches more Indian users than Instagram |
| **Vendors** | Planners, photographers, mehendi artists and card printers talk to hosts first | A vendor link with a code that gives the host a small discount and the vendor a share (start 20%). A QR on a printed card that opens the digital invitation for relatives who live far away |
| **Festivals** | Diwali, Eid, Christmas, Holi, New Year: people send one greeting to many | A "greeting to many" use of the invitation link, free with the footer; the paid version removes it |
| **Search** | "Digital wedding invitation", "e-invite", by community and city | Pages on the website with a live demo link each; the demo links already exist |

Referral rewards ("give a wish, get a wish") wait for the device checks in `occasio-free-card-abuse`; a reward multiplies
abuse.

---

## 4. Pricing proposal (to test, in rupees)

Choose the nearest store price point for each; do not rely on automatic conversion from dollars.

| Product | Proposal | Test | Why |
|---|---|---|---|
| Free | 1 card or invitation for life, 30-day link, footer, 1 saved person | none | The free invitation is the loop |
| Single wish (cards) | ₹49 | ₹49 / ₹79 | PRD range ₹49 to 99; low enough to be a ladder to Pro |
| **Event: wedding** | **₹499** | ₹499 / ₹799 / ₹999 | Studios charge ₹2,500+ **(vendor)**; Evite about $16 to $33 **(blog)** |
| **Event: engagement, anniversary** | **₹299** | ₹299 / ₹399 | Same product, smaller occasion |
| Event: other gathering | ₹99 | ₹99 / ₹149 | Birthday, baby shower, housewarming, graduation, party |
| **Pro** | **₹149 a month, ₹999 a year**, annual first | ₹799 / ₹999 / ₹1,299 a year | PRD plan; low price keeps retention higher **(report)** |
| Family | not yet | | Needs Pro data first |
| Business | ₹499 to ₹999 a month by hand | | Only after the ten-customer test |

**Where the paywall appears** (one calm ask each, no pressure, as in `onboarding-funnel.md`):
1. Sharing a second card or a second invitation (the free one has been used).
2. Sharing an invitation without the footer, for a wedding or engagement.
3. Arming auto-send, or saving a second person.
4. A hard limit is never shown before the user has seen the card working.

No free trial at first: the free card is the trial, card use is low in India, and trials depend on recurring payments
that are weaker on iOS there. Revisit after the first 500 paid events.

---

## 5. What has to be true

Net of a 15% store fee **(repo, PRD)**:

| Sold | Net each |
|---|---|
| Wedding event ₹499 | about ₹424 |
| Engagement or anniversary ₹299 | about ₹254 |
| Pro year ₹999 | about ₹849 |
| Single wish ₹49 | about ₹42 |

| Net per month | Wedding events alone | Or Pro years alone |
|---|---|---|
| ₹1 lakh | about 236 | about 118 |
| ₹5 lakh | about 1,180 | about 590 |
| ₹25 lakh | about 5,900 | about 2,950 |

At the 2% freemium benchmark **(report)**, 590 new Pro years a month needs about 29,500 installs a month. That is why
events come first: a host who needs an invitation this month has far more intent than someone who might want a reminder.

**Costs that scale:** WhatsApp wishes at about ₹1 each, capped at 100 a year per user, so at most about ₹100 a user a year
against ₹999 of Pro **(repo cap, vendor price)**. Firebase and storage stay small until volume is large (PRD: ₹2,000 to
₹9,000 a month before scale).

---

## 6. Roadmap

Dates assume today is 4 Nov 2026. Diwali is near 8 Nov (check) and the main wedding season runs roughly November to
February, so the timing favours the invitation work, not a Diwali card pack.

### Now to day 14: make the money real (blocks everything)
| Do | Who |
|---|---|
| Upgrade Firebase to Blaze with a budget alert, deploy `functions/` and the Firestore rules, set the RevenueCat and Resend secrets | you (console), me (checks) |
| Redeploy the website so the photo scenes, the age check and the new previews are live | you |
| Point the RevenueCat webhook at `/v1/billing/webhook`; re-run the probes; confirm `consume-credit` spends a credit | me |
| Apply rupee prices on App Store Connect and Play for the existing products | you |
| Close the App Store submission blockers from my notes of 9 Oct (sounds and animation licence, App Privacy published, a new build, review answers); re-check the list first, since some may be done | you, me |
| Add the in-app review prompt (second share) and one dashboard for the funnel in section 8 | me |

### Days 14 to 60: events
| Do | Who |
|---|---|
| New per-event consumable products and the paywall copy; footer on free invitations; "Make yours" door tracked | me |
| The blessings block, ritual meanings and tradition choice (the pending research decision) | me |
| Link lifetime for events (365 days, with a check that it outlives the date) | me |
| Ten real weddings or engagements from people you know, free, for photos and feedback; use them as demos | you |
| Ten vendors (planners, photographers, printers) with the vendor link and code | you |
| Reels and Status clips from the three invitation gates; website pages by community | you, me |

### Days 60 to 150: remember it for me
| Do | Who |
|---|---|
| Meta business verification, the number, the template; turn WhatsApp auto-send on and verify end to end | you, me |
| Reminders ("Maya's birthday is in 3 days"), festival packs, Status sizing | me |
| Hindi for the invitation page, the top festival cards and the paywall | me |
| First A/B tests of the store page (order in `05-growth-plan.md`) once there is traffic | you |

### Days 150 to 270: widen
| Do | Who |
|---|---|
| Business pilot with ten customers by hand; build only what they ask for | you, me |
| Guest and RSVP tracker with consent, if hosts ask | me |
| Referral rewards after the device checks | me |
| Family tier only if Pro retention supports it | me |

---

## 7. First experiments

| # | Test | Success looks like | Wait for |
|---|---|---|---|
| 1 | Wedding price ₹499 vs ₹799 vs ₹999 (one per cohort, not shown together) | Highest **revenue per invitation started**, not highest purchase rate | 300 starts per arm |
| 2 | Free invitation with footer vs without | Footer taps per 100 guest views, and installs from them | 20 invitations |
| 3 | Paywall after the preview vs before it | Purchases per invitation started | 300 starts |
| 4 | Vendor code vs no code | Share of events from vendors, and their refunds | 10 vendors, 8 weeks |
| 5 | Pro ₹799 vs ₹999 vs ₹1,299 a year | Revenue per 100 paywall views and month-3 retention | 1,000 paywall views |
| 6 | Hindi vs English invitation page for the same link | Replies per 100 guest views | 30 invitations |
| 7 | Android UPI AutoPay vs card for Pro (if Play allows) | Share of annual plans started that renew | 200 subscribers |
| 8 | Business message by hand to ten agents | Number who pay after a month, and their message template trouble | 10 customers |

Run one pricing test at a time per store, whole weeks, and read activation and retention beside conversion.

---

## 8. What to measure

Define the north star as **paid events plus active Pro subscribers per week**.

| Stage | Metric |
|---|---|
| Acquire | Installs by source; cost per install by channel; store conversion |
| Activate | Installers who share a first card or invitation within a day |
| Pay | Invitation started to paid; paywall shown to purchase; revenue per invitation started |
| Loop | Guest views per invitation; "Make yours" taps per 100 views; installs from them |
| Retain | Vault attach; D7 and D30; Pro month-3 retention; auto-send approved vs cancelled; delivery success (PRD bar above 98%) |
| Trust | 1-star share; refunds; "expired" or "paywall" in reviews; link failures on a wedding date (zero is the target) |
| Cost | WhatsApp cost per active Pro user; support emails per 100 installs |

Rule for paid acquisition: do not start it before the rating is at least 4.3 (`05-growth-plan.md` §4). Then cap cost per
paid event at 40% of net first purchase value.

---

## 9. Risks and guardrails

| Risk | Guardrail |
|---|---|
| **A link that fails on someone's wedding day** | Monitor every invitation link; keep event links for a year; an alert for any failure; a human reply within hours |
| Promising what is not live | Keep WhatsApp, "we send it for you" and auto-send out of store copy until verified (`03-positioning.md` §5) |
| WhatsApp account quality or bans | Official Cloud API only, consent, STOP honoured, 100 a year cap. Never a user's own WhatsApp |
| Store rules on in-app purchases | Keep digital purchases inside the stores' billing; do not steer buyers to the web to avoid the fee |
| Free-card abuse draining the free hook | Finish the device checks in `occasio-free-card-abuse` before any referral reward |
| Data protection | Do not store guest replies without consent and a review under India's DPDP Act; keep numbers and tokens out of logs |
| Seasonality (weddings) | Cards, Vault and festivals fill the rest of the year |
| Underpricing | Pricing tests above; keep a floor above the ₹99 other-gathering price for anything with a guest list |
| Dark patterns | The onboarding rules stand: nothing pre-selected, no fake discounts or timers, free path always visible |

---

## 10. Decisions needed from you

1. **Prices**: agree the ladder in section 4, or give me your own. I will wire the products and paywall once you do.
2. **Who owns the Meta business account** and the WhatsApp number (it needs your business documents).
3. **Make events the lead** in the store listing and the first screenshots, with cards second? It changes
   `03-positioning.md` (today birthday-first).
4. **Vendors**: are you willing to give a 20% share and a discount code?
5. **Business segment**: do you want to run the ten-customer test, and who are the first ten?
6. **The pending research choice**: start with the blessings and lineage layer on the invitations (my recommendation).

---

## Appendix: what the Indian wedding research says

From search results, not full-page reads; mostly wedding-industry blogs. It informs the blessings layer in Engine 1.

* **The emotional peaks are the departure and the giving away**: *vidaai* (the bride leaves her parents' home, throwing puffed
  rice that her mother catches in her sari) and *kanyadaan*; tears also come at the haldi, mehendi, sindoor and seven
  pheras ([WeddingWire](https://weddingwire.in/wedding-tips/vidaai-ceremony--c9873), [StyleCraze](https://www.stylecraze.com/trending/vidaai-moments-from-real-weddings), [Ramit Batra](https://www.ramitbatra.com/blog/bidaai-in-indian-weddings-all-about-the-rituals/)).
* **Invitations open with gratitude and lineage**: "with the blessings of our parents and elders", grandparents named,
  elders first, "Shubh Vivaah" or "Aayushman Bhava" ([Wezoree](https://wezoree.com/inspiration/hindu-wedding-invitations-guide)).
* **One generic flow feels wrong**: Bengali *shubho drishti*, Gujarati garba, Punjabi chooda and kalire, the nikah's
  *ijab-e-qubul*, Sikh Anand Karaj ([Cultural India](https://www.culturalindia.net/weddings/regional-weddings)).
* **Milestones are gratitude occasions**: *Shashtipurti* (60th birthday) and the silver anniversary are usually organised
  by children for their parents ([Wikipedia](https://en.wikipedia.org/wiki/Shashthipurti)); also godh bharai,
  griha pravesh, annaprashan, naamkaran. These are new occasions to price at the event ladder.
* **Gaps**: nothing found on the night before the wedding, little on Christian customs, thin detail on 50th
  anniversaries. Check wording with real families before shipping.

---

## Sources

* [Evite vs Paperless Post (Carly)](https://www.usecarly.com/blog/evite-vs-paperless-post/) · [Paperless Post alternatives (RSVPify)](https://rsvpify.com/top-paperless-post-alternatives/) · [Free invitation makers and prices (Dupple)](https://dupple.com/learn/best-free-invitation-makers)
* [Premium animated wedding video invitations (Happiffie)](https://www.happiffie.com/pune/premium-animated-wedding-video-invitations) · [WedMeGood wedding card vendors](https://www.wedmegood.com/vendors/delhi-ncr/wedding-cards/)
* [RevenueCat State of Subscription Apps 2026, summarised (ContentGrip)](https://www.contentgrip.com/subscription-app-market-2026-growth/)
* [Payment methods in India (Solidgate)](https://solidgate.com/blog/payment-methods-in-india/) · [UPI AutoPay for app subscriptions (Vmobify)](https://vmobify.com/blog/upi-autopay-app-subscriptions) · [TechCrunch on App Store billing in India](https://techcrunch.com/?p=2442628)
* [India app spending, Sensor Tower via Cobo](https://agenticwallet.cobo.com/agentic-wallet/news/india-s-app-market-shows-record-willingness-to-pay-as-q2-revenue-hits-al)
* [Smart Agent (Techjockey)](https://www.techjockey.com/detail/smartagent) · [WhatsApp birthday and anniversary wishes in India, 2026 (RichAutomate)](https://richautomate.in/blog/whatsapp-birthday-anniversary-wishes-automation-india-2026)
