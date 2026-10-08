# 03 · Positioning

One line of reasoning follows each major choice.

---

## 1. Positioning statement

> **For people who care about the dates that matter but forget them, or don't have the words, Occasio is the birthday-card app that remembers the date and turns your photo and a few words into a card they *play*, sent as a private link with no app or account needed on their side.**

*Why this wording:* it names the user's real problem (forgetting, and not knowing what to say), the category the store understands (birthday cards), the two things competitors split between them (remembering vs. personal), and the one fact that removes friction (the recipient needs nothing).

## 2. Core promise (stated as a user benefit)

> **Be the one who remembered, with a card they'll want to open.**

*Why:* the benefit is how the *sender* feels and is seen ("remembered"), not how the card is made. It is true today without relying on unverified auto-send, and it is short enough to sit in screenshot 1.

## 3. Three supporting pillars (each backed by something in the app)

| Pillar | Proof the user can see | Where it shows up |
|---|---|---|
| **They play it, not just read it.** | Pip at the gate, balloons to pop, candles to blow out, a 3D gift, a wax-sealed letter, stickers | Screenshots 1, 2, 5, 6, 7 |
| **Quick and free to start.** | "Most cards take under two minutes", no account to create or share, 1 free card a month | Screenshots 4, 8; first lines of every description |
| **Remembers for you.** | Vault with birthdays and anniversaries, "Coming up" on Create, home-screen widgets | Screenshot 3; Description section "Remember every date" |

*Why three:* a store page is read in seconds; three ideas with visible proof beat ten features. The pillars map one-to-one onto the first three screenshots, which are the only ones most people see in search results.

## 4. Who we are talking to, and the line each audience hears

| Audience | Their moment | Headline we lead with |
|---|---|---|
| **Forgetful but caring** (25–45; parents' birthdays, anniversaries) | The reminder fires, they have five minutes | "Never miss their day" |
| **Expressive partner or friend** (18–30; India-first) | They want a surprise, not a forwarded image | "Cards they'll want to open" |
| **Long-distance family and friends** | Distance, time zones, a link that works anywhere | "A card they can open anywhere" (Custom Product Page, `05-growth-plan.md` §3) |

## 5. Claims gate: what the listing may say today

Occasio's boldest idea, **auto-send**, is built but not verified end to end. Delivery to WhatsApp/SMS is mocked, email needs Resend configured, and the blueprint lists verification as outstanding. Store copy must not promise what the server may not do on launch day.

| Say today (verified in code) | Hold back until you have verified it live |
|---|---|
| "Make a card from your photos and words" | "Occasio sends it for you" / "auto-send" / "sent automatically" |
| "Share a private link by text or any messaging app" | Any mention of WhatsApp, SMS or email *delivery* by Occasio |
| "Recipients need no app and no account" | "Pushes you on their birthday" as a guaranteed feature (needs Pro + armed + the daily job live) |
| "Save birthdays and anniversaries; see who's next; home-screen widgets" | "Links last a year" (manual cards expire after 30 days today) |
| "1 free card a month; Pro is unlimited" | "Priority support" |
| "You can delete your account in the app" | Any number of users, cards sent, ratings, or "loved by" claims (none exist) |

**If auto-send is verified live at launch,** use the *"On their day"* blocks marked **[ADD AFTER VERIFIED]** in `04-listing.md`. They are written, character-checked and ready. The wording stays honest even then: *we prepare it, you approve it, you send the link* (that is what the review screen does), and *never* "we message them for you" unless the dispatch flag is on and a real provider is configured.

*Why gate:* a "never miss a birthday, we send it" promise that fails on one birthday produces exactly the 1-star reviews the PRD calls the existential risk, and both stores can remove listings for claims the product does not meet.

## 6. Three alternative angles for A/B testing

Each changes **one idea**, so a test can be read cleanly. The recommended listing is Angle 0.

| | Angle | Headline (screenshot 1) | Subtitle (iOS) | Hero visual | Hypothesis | Best for |
|---|---|---|---|---|---|---|
| **0** | **Surprise / play** (recommended) | Cards they'll want to open | Remember dates. Send wishes. | Pip at the gate + native Create home | A recipient-reaction story is more distinctive in a category of static card art | General store traffic |
| **A** | **Memory / reminder** | Never miss a birthday again | Birthday reminders & cards | Vault with "Birthday in 3 days" + widget | People searching "birthday reminder" convert on utility, not play | Reminder-intent keywords, Apple Search Ads exact match on "birthday reminder" |
| **B** | **Effortless / free** | A thoughtful card in two minutes | Free to start. No account. | Three-step create flow (pick, add, share) | Friction-averse installers respond to speed and "no account" more than to delight | Paid social, first-time card senders |
| **C** | **Relationship** | For Mom. For them. For you. | Cards for the people you love | Audience tiles (Mom, Dad, Partner, Best friend, Family) with a hand-written card | Naming the person (Mom, Dad) beats naming the occasion in family-heavy markets (Mother's/Father's Day windows) | Seasonal campaigns, India family occasions |

*Why these three:* they are the three reasons a stranger might install (I'm forgetful, I'm short of time, I want to say it to a specific person), and each is already backed by a real screen.

## 7. Voice

| Do | Don't |
|---|---|
| Plain, warm, specific: "Add a photo and your words." | Hype: "amazing", "unlock", "supercharge", "revolutionary" |
| Benefit first, mechanism second | Lead with technology (Firebase, 3D engine, "AI") |
| Show playfulness in screenshots (Pip, "No" reacts) | Fill descriptions with emoji or exclamation marks |
| State limits plainly ("1 card a month on Free") | Hide the free limit until the paywall |
| "They open a link" | "Download the app to receive" (false) |

Store listings use no emoji in titles or subtitles (Play prohibits them) and none in the description, which also matches the project's own copy rules (`product-principles.md` §7).
