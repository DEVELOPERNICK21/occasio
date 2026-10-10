# 08: Reply to App Review (Guideline 2.1, "Information Needed")

Apple has not rejected the app. This is a request for information because the account is new. They will not continue until you answer **all seven items**, including a **screen recording from a physical iPhone**. Everything except the recording and two confirmations is already written for you.

## Do these in this order

| # | Step | Who | Why it matters |
|---|---|---|---|
| 1 | **Deploy `docs-site` to Vercel**, then check `https://occasio-greetings.vercel.app/api/v1/age/check` no longer returns 404 (a POST with `{"year":1990,"month":8,"day":14}` should return a token). | You | **Blocker.** On 9 Oct the endpoint returned **404 in production**: the routes `age/check`, `account/age` and `email/unsubscribe` exist in the repo but are untracked and were never deployed. A release build has no fallback (only debug builds do), so the reviewer would be stuck on the first screen, the age gate, with "Could not check right now". |
| 2 | **Upload a new build** and select it on the version. Build 1 predates the account-deletion, Sign in with Apple and age-gate work, so reviewing it would only produce a different rejection. | You (Xcode / Archive) | |
| 3 | **Confirm the demo account** in Sign-In Information signs in on that build. | You | A failed login is the most common 2.1 rejection. |
| 4 | **Record the video** (below) on a physical iPhone, from the TestFlight build. | You | Item 1 of Apple's list; the one thing I cannot do. |
| 5 | **Replace the two `[CONFIRM: …]` lines** (item 6), then paste. | You | See "Needs your word". |
| 6 | Paste `metadata/en-US/app-store-connect/10-app-review-notes.txt` into **App Review Information → Notes** (3,303 of 4,000 bytes). | You or me | Apple asked for the information in both places. |
| 7 | In **App Review → Resolution Center**, reply with `11-reply-to-app-review.txt` and attach the video, then resubmit. | You | |

I have not sent anything to Apple and have not changed App Store Connect. If you want, I can paste the Notes into the form in the built-in browser; you would sign in, attach the video and press Send yourself.

## Needs your word (I cannot know it)

- **Sounds and animations (item 6).** The app bundles five sound effects (`src/features/create/assets/sounds/`) and five Lottie animations (`…/assets/lottie/`). The repo has no licence record for them. If you made them or bought a licence, keep the sentence. If they came from a free library, name it and its licence instead, or replace them. The same answer settles the open **Content Rights** question in App Store Connect.
- **The recording list in item 1 of the reply** says what the video shows. If the video does not show something on that list, remove it from the sentence.

## Screen recording: shot list (about 4 minutes)

Record on the iPhone with Control Center → Screen Recording, with the microphone off. Use the **TestFlight build** and a **sandbox Apple ID**. Start the recording **on the home screen, then open Occasio**, because Apple wants the launch included.

1. Launch. Age check (enter 14/08/1990). Intro (go through it, or Skip).
2. **Create a card without an account:** Create tab → who → moment → photo → message → Preview → **Create the link**.
3. **Recipient view:** open the link in Safari. Scroll to the **Report this card** link (bottom right) and tap it, so the report mechanism is visible.
4. **Registration and login:** Account tab → Continue with email → create an account (use a throwaway address). Then sign out and back in, and show **Sign in with Apple** on the same screen.
5. **Vault:** save a person and a date.
6. **Paying:** create a second card in the same month to bring up the paywall. Pause on it so the video shows, for each plan, the **title, length and price**, and the **Terms and Privacy links**. Start one purchase in the sandbox sheet (you can confirm or cancel). Show **Restore purchases**.
7. **Account deletion:** Account tab → bottom → Delete account and data → Delete everything. Use the throwaway account from step 4, not the demo account.

Check before sending: the file plays, the paywall frame is readable when paused, and nothing shows a real email address or card.

## What the reply says about user-generated content

Apple's list says to show reporting **and blocking** where an app has user-generated content. Occasio has no feed, search, comments or messaging, and a recipient can only add a heart count (`api/v1/cards/[slug]/reactions` takes no text). So the reply says exactly that: cards are private one-to-one links with a **Report this card** link, and no blocking is needed because nobody can contact anybody. If you later add replies or comments, add blocking before shipping them.

## Facts I checked, so every answer is true

| Claim in the reply | Source |
|---|---|
| Services: Firebase, RevenueCat, Sign in with Apple, Google Sign-In, Resend, Vercel | `package.json`, `functions/src/email/resend.ts` (subscription confirmations), `src/shared/config/env.ts` |
| No AI services | searched `src`, `functions`, `docs-site` for the major AI SDKs: none |
| Products and prices | App Store Connect state in `06-apple-submission.md` §8 |
| Demo link, Terms, Privacy URLs | returned HTTP 200 on 9 Oct |
| Recipient can only add a count | `docs-site/src/app/api/v1/cards/[slug]/reactions/route.ts` |
| "No tracking" | App Privacy answers (not yet published, see §8 of `06`) |

**Not claimed:** that auto-send delivers a card on its own. The notes say the user reviews and the share sheet opens, which matches the app.
