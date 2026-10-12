# 06 · Apple submission pack: App Store Connect fields, guideline audit, fixes

Written on **8 Oct 2026** after reading your App Store Connect screens, Apple's current App Review Guidelines and "Offering account deletion in your app", and the code. Section 1 is the answer; the rest is the working.

**You asked me to make the app compatible, so this pass changed code** (the first pass did not). Every change is listed in §2, typechecked (`tsc` clean in the app and in `docs-site`) and covered by the existing tests (26 suites, 218 tests pass). Nothing is committed.

---

## 1. Verdict

| Area | Before | Now |
|---|---|---|
| **Account deletion in the app (5.1.1(v))** | Existed (Account → *Delete account and data*, deletes server data and the sign-in) | **Fixed gaps:** now revokes the Sign in with Apple token, warns Pro users that billing continues and offers *Manage subscription*, and the web page and policy now describe the in-app path (they said "email us") |
| **Sign in with Apple (4.8)** | Offered first on the login screen and in the soft sign-in sheet, capability and entitlement present | Compliant. Needs the Firebase Apple provider key set up for token revocation (§4) and a real-device test |
| **Placeholder / developer text (2.1)** | Five user-visible messages mentioned "RevenueCat", "rebuild", "Play products" or "coming soon"; a fake "Market Insights" toggle; a false "concierge team available 24/7" claim | **Fixed** (§2) |
| **False subscription claim (3.1.2, 2.3.1)** | "year-long links" shown to Pro users, but cards expire in 30 days | **Removed** from the app copy |
| **Reporting content (1.2)** | No way for a recipient to report a card | **Added** "Report this card" on every recipient page (needs a web redeploy) |
| **Privacy policy (5.1.1(i))** | Listed phone/SMS sign-in, omitted Apple, RevenueCat, push tokens; deletion said "email us" | **Rewritten to match the app** (needs a web redeploy) |
| **Info.plist** | Empty `NSLocationWhenInUseUsageDescription`; no `ITSAppUsesNonExemptEncryption` | **Fixed** both |
| **Metadata (2.3)** | n/a | No trademarks, prices, or unverifiable claims; screenshots show the app, labelled |

**What can still get you rejected, and only you can fix** (details in §3): no demo account in Review Information; paywall not configured with price/period/auto-renew text and Terms + Privacy links in the RevenueCat dashboard; IAP products not attached to the version; production backend not live (the project is `occasio-app-dev`); Firebase Apple provider key missing, so deletion would fail for Apple users; the support email; the landing page still shows a *Google Play internal test* button.

---

## 2. What I changed in the project

| File | Change | Guideline |
|---|---|---|
| `src/features/auth/data/authRepository.ts` | `deleteAccount()` now, for Apple users, asks the user to confirm with Apple, takes the authorization code and calls `auth().revokeToken(code)` **before** the server deletes the account | 5.1.1(v), Apple's *Offering account deletion* page |
| `src/features/auth/ui/screens/AccountHomeScreen.tsx` | Delete dialog names the right store (App Store on iOS), says billing continues, adds **Manage subscription** for Pro users; removed three switches that did nothing | 5.1.1(v), 2.1 |
| `src/features/auth/ui/components/AccountSettingsCards.tsx` | Notifications card now says it is controlled in phone settings and opens them; Privacy card links the **Privacy Policy and Terms of Service**; Help card says "Email support" and "Delete my data"; removed the "concierge team available 24/7", "Chat Now", "Help Center → privacy policy" and "coming soon" | 2.1, 1.5, 2.3.1, 3.1.2 |
| `src/features/auth/domain/accountProfile.ts` | Removed "year-long links" claim and the placeholder bio | 3.1.2, 2.3.1 |
| `src/features/create/ui/screens/PreviewScreen.tsx`, `.../AccountScreen.tsx`, `src/features/billing/application/BillingProvider.tsx` | Replaced developer messages ("Add your RevenueCat offering… and rebuild") with a plain "Plans unavailable… check your connection" | 2.1 |
| `ios/Occasio/Info.plist` | Removed empty location purpose string (the app does not use location); added `ITSAppUsesNonExemptEncryption = false` so Apple stops asking export compliance each upload | 5.1.1(ii)/(iii) |
| `docs-site/src/components/ReportCardLink.tsx` (new), `StoryPlayer.tsx`, `RecipientCardView.tsx`, `src/lib/contact.ts`, `globals.css` | "Report this card" link (bottom right) on every recipient view, opening an email with the card reference | 1.2 |
| `docs-site/content/privacy-policy.md`, `delete-account.md` | Match the real sign-in methods, data, retention and the in-app deletion path | 5.1.1(i), 5.1.1(v) |

**Not changed, on purpose:** the support email (your decision), `PaywallModal.tsx` (it contains developer text but is not used anywhere), the empty `NSPrivacyCollectedDataTypes` in `PrivacyInfo.xcprivacy` (§5 says what to declare), and anything in Firebase, RevenueCat or the stores.

**After these changes you must:** rebuild the iOS app, **redeploy the docs-site to Vercel** (the report link, policy and deletion page are web changes), and test deletion with Apple on a real device (§6).

---

## 3. Guideline-by-guideline audit

✅ compliant · 🔧 fixed in this pass · ⚠️ needs you

| Guideline | Requirement | Status | Evidence / action |
|---|---|---|---|
| **5.1.1(v)** In-app account deletion | If you create accounts, let people delete them in the app; no email/phone steps; delete associated personal data and user content | ✅🔧 | Account tab → *Delete account and data*. Server removes Vault, history, scheduled sends, cards (links stop working), photos, profile and the Firebase user. Web page now leads with the in-app path |
| **5.1.1(v)** Sign in with Apple tokens | Revoke the Apple token via the Sign in with Apple REST API when deleting | 🔧 ⚠️ | Implemented client-side with Firebase `revokeToken`. **You must** add the Apple Team ID, Key ID and private key (.p8, "Sign in with Apple" enabled) to Firebase → Authentication → Sign-in method → Apple, or the call fails and Apple users cannot delete |
| **5.1.1(v)** Subscriptions | Tell the user billing continues and ask them to cancel first | 🔧 | New dialog text + *Manage subscription* button |
| **4.8** Login services | If you offer Google sign-in you must offer an equivalent privacy-preserving option | ✅ | Apple is offered first (`LoginScreen`, `SoftAuthModal`) on iOS 13+; email/password also exists |
| **3.1.1** In-app purchase | Unlock features only through IAP | ✅ | RevenueCat + StoreKit; no external purchase links |
| **3.1.2** Subscription disclosure | Paywall must show name, period, price (billed amount most prominent), auto-renew and cancellation terms, links to Terms and Privacy; Restore | ⚠️ | The paywall is RevenueCat's dashboard paywall, so this lives in **their editor**: add the auto-renew sentence and Terms/Privacy links to the template. *Restore purchases* exists in-app (Account) |
| **3.1.2(a)** | Period ≥7 days, ongoing value | ✅ | Monthly and yearly |
| **2.1** App completeness | No placeholder text, working URLs, **demo account**, backend on | 🔧 ⚠️ | Placeholder text fixed. **Demo account and live production backend are yours** (see §6, step 1) |
| **2.1(b)** IAP testable | Products reviewable in the build | ⚠️ | Products must be "Ready to Submit", attached to the version, with a paywall screenshot; Paid Apps Agreement active |
| **2.3.1** Hidden features / accuracy | Describe features in Notes; no undocumented features | 🔧 | The review notes (§6) describe auto-send, widgets, reporting. Removed the false 24/7 and year-long claims |
| **2.3.3** Screenshots | Show the app in use | ✅ | 4 of 8 frames are real app screens; recipient frames are labelled "What they open" |
| **2.3.7** Metadata | No trademarks, prices, irrelevant terms; name ≤30 | ✅ | `check-limits.py` enforces |
| **2.3.10** Other platforms | Don't reference other platforms in metadata or the app | ⚠️ | Fixed in-app strings. The Support/Marketing URL (landing page) shows **"Google Play internal test"** buttons: hide them for review |
| **1.2** User-generated content | Filtering, reporting, blocking, contact info | 🔧 ⚠️ | Added report link, published contact, Terms ban abusive content. **Not present:** pre-upload content filtering and blocking. Mitigation: private one-to-one links, no feed or search, takedown by email. Say so in review notes (already in the draft) and be ready to remove reported cards fast |
| **1.5** Developer information | Support URL with easy contact | ⚠️ | Email corrected to `developernick1@gmail.com` in the website, policy pages and app (redeploy the website). The landing page also shows Play beta buttons (2.3.10) |
| **5.1.1(i)** Privacy policy | Link in ASC and in app; says what is collected, retention, deletion | 🔧 | In-app: Login footer and Account → Privacy. Policy rewritten. Add the URL in ASC → App Information |
| **5.1.1(ii)-(iii)** Permissions | Purpose strings, minimal access | 🔧 ✅ | Camera and Photos strings are specific; removed empty location string; no contacts, mic, tracking |
| **5.1.2** Data use | ATT only if tracking | ✅ | No ad or tracking SDK (`NSPrivacyTracking = false`) |
| **4.5.4** Push | Not required; no marketing without opt-in | ✅ | App works without push; no promotional pushes. Suggest asking permission with a reason (currently asked right after sign-in) |
| **Privacy manifest / required-reason APIs** | Declare required-reason APIs and collected data | ✅ ⚠️ | Required-reason APIs declared. `NSPrivacyCollectedDataTypes` is empty; fine for upload, but align with §5 |
| **Export compliance** | | 🔧 | `ITSAppUsesNonExemptEncryption = false` (HTTPS only) |
| **Capabilities** | Sign in with Apple, Push, App Groups on the App IDs | ⚠️ | Entitlements present (`applesignin`, `group.com.occasio.ios`, `aps-environment`). Confirm all three are enabled on **both** App IDs (`com.occasio.ios` and `com.occasio.ios.widgets`) and an APNs key is uploaded to Firebase |
| **4.2 / 4.3** | Minimum functionality, spam | ✅ | Substantial native app, unique concept |
| **EU Digital Services Act** | Trader status and contact details | ⚠️ | In ASC → Business, declare trader or non-trader; if you will not publish address/phone, remove EU storefronts |
| **Agreements** | Paid Apps Agreement, tax forms, bank | ⚠️ | Required before subscriptions can be reviewed |

---

## 4. Sign in with Apple and deletion, step by step

1. **Apple Developer → Identifiers:** App ID `com.occasio.ios` has *Sign in with Apple*, *Push Notifications*, *App Groups* (`group.com.occasio.ios`). The widget App ID `com.occasio.ios.widgets` has *App Groups*.
2. **Apple Developer → Keys:** create a key with *Sign in with Apple* enabled; download the `.p8`; note **Key ID** and **Team ID**.
3. **Firebase → Authentication → Sign-in method → Apple:** enable. Under the OAuth code flow configuration, add Team ID, Key ID and the `.p8` contents. (A Services ID is only needed for web flows.)
4. **Firebase → Project settings → Cloud Messaging:** upload an APNs auth key.
5. **Test on a real iPhone (not the Simulator):** sign in with Apple → Account → *Delete account and data* → expect the Apple confirmation sheet, then deletion. Sign in with Apple again: Apple should treat you as a **new** user (the token is revoked).
6. If revoke fails with an `auth/…` error, the Apple provider key in step 3 is missing or wrong. **Do not ship until this passes**, because a failing revoke blocks deletion for Apple users, which is itself a 5.1.1(v) rejection.

---

## 5. App Store Connect, field by field

### Product Page Information (the screens you pasted)

| Field / slot | What to enter | File |
|---|---|---|
| **App Previews and Screenshots → iPhone with Dynamic Island (medium display)** | Upload the 8 screenshots in order. This slot accepts **1206×2622** (and 1179×2556, 2622×1206, 2556×1179), so use the 6.3″ set | `images/app-store/iphone-6.3/01…08` |
| Larger iPhone display (via *View all sizes in Media Manager*) | Optional; Apple scales down from it | `images/app-store/iphone-6.9/01…08` (1320×2868) |
| iPhone Duo | Skip; Apple scales | n/a |
| iPad 13″ | **Not required:** the app is iPhone-only (`TARGETED_DEVICE_FAMILY = 1`). If ASC marks it required, check the uploaded build's device family | n/a |
| Apple Watch | There is no Watch app; ignore | n/a |
| App Preview (0 of 3) | Optional; 886×1920, 15–30 s, captured from the app. Script in `04-listing.md` §C3 | n/a |
| **Header and Search Results → Header** | Optional, new (iOS 27+). 3840×1646 or 5244×2950 | `images/app-store/header-and-search/header-*` |
| **Header and Search Results → Search Results** | Optional. 3840×2560, 1920×1280 or 5244×2950. If skipped, your screenshots and previews are used | `images/app-store/header-and-search/search-*` |
| Promotional Text (170) | | `metadata/en-US/app-store-connect/03-promotional-text.txt` |

**On the header and search assets:** Apple had not published pixel specs when I checked, the sizes come from your console, and Apple's own Figma/Photoshop templates ("Explore templates" in ASC) define the safe areas. I kept all text in the left half and inside the centre ~84%, but **lay one over Apple's template before uploading.** Every asset shown on the App Store must suit a **4+** rating, which these do.

### Version page

| Field | Enter | Note |
|---|---|---|
| Name · Subtitle | `Occasio: Birthday Cards` · `Remember dates. Send wishes.` | App Information tab; `01-name.txt`, `02-subtitle.txt` |
| Description | file `05-description.txt` | Fill `[PRICE]` ×2 and `[SUPPORT EMAIL]` first |
| **Keywords (100)** | `reminder,anniversary,greeting,ecard,personalized,surprise,interactive,photo,thank,congrats,widget` | 97 bytes; `04-keywords.txt` |
| **Support URL** | `https://occasio-greetings.vercel.app` | Must show real contact info (1.5). Fix the email and hide the Play beta buttons first |
| Marketing URL | `https://occasio-greetings.vercel.app` | Optional |
| Privacy Policy URL | `https://occasio-greetings.vercel.app/privacy` | App Information tab |
| **Version** | `1.0` | Matches `MARKETING_VERSION` |
| **Copyright (200)** | `2026 Nick Kubde` | Year then owner; Apple adds the © symbol, **do not type it**. Must match the seller name on your developer account |
| Routing App Coverage File | Leave empty | Only for routing apps |
| App Clip · iMessage App | None | |
| **Build** | Select the build you uploaded (shows version 1.0 and build number) | Export compliance will not ask again |
| Included Assets → App Icon | Comes from the build (the 1024×1024 icon in the asset catalog; `images/app-store/app-icon-1024.png` is the same artwork, opaque) | Game Center: leave off |

### App Review Information

| Field | Enter |
|---|---|
| **Sign-in required** | **Tick it.** Guests can browse, but the Vault, history and subscription need an account, and Apple requires a demo account when there is a login (2.1) |
| User name / Password | A dedicated **email + password** account, because reviewers cannot use your Apple or Google login. Create it in the app, add two **fictional** people to the Vault, and keep it from expiring |
| Contact | First name `Nick`, last name `Kubde`, email `[SUPPORT EMAIL]`, phone in international format with `+` (for example `+91…`; numbers without `+` are rejected) |
| **Notes (4,000 bytes)** | `metadata/en-US/app-store-connect/10-app-review-notes.txt` (2,756 bytes). Fill `[DEMO EMAIL]`, `[DEMO PASSWORD]`, `[SUPPORT EMAIL]`, and confirm the two `[OWNER…]` items |
| **Attachment (optional)** | A 30-second screen recording from a real iPhone: create → share → open the link in Safari → Vault → delete account. Reviewers cannot always see the recipient web experience, and this removes the doubt |

### App Store Version Release

**Manually release this version.** *Why:* for 1.0 you want to confirm that the production backend, IAP products and the web deploy are live before the listing goes public, and to line the launch up with Play. Switch to *Automatically release* for later updates.

### Other ASC pages you must complete (they block submission)

| Page | Answer |
|---|---|
| **App Privacy** (nutrition label) | Declare, all **linked to the user**, **not used for tracking**: **Contact Info** (email address; name if shared by Apple/Google; the names, emails or phone numbers of people the user saves in the Vault), **User Content** (photos, card messages), **Identifiers** (user ID, device token for push), **Purchases** (purchase history). Add **Usage Data** and **Diagnostics** only when you actually wire analytics and crash reporting (the current build has neither) |
| **Age rating** (new questionnaire) | Answer honestly. Cards are user-generated and shared by private link, so say *user-generated content: yes*. No unrestricted web access, gambling, or mature content. Expect 4+; accept 12+ if the form says so |
| **Content rights** | The app does not show third-party content; users supply their own |
| **Pricing and availability** | Free app; countries: start with India and the US. Remove EU storefronts if you will not publish trader details |
| **In-App Purchases and Subscriptions** | Group `Occasio Pro`; products `occasio_pro_monthly`, `occasio_pro_yearly`, consumable `occasio_wish_single`. Names and descriptions from `04-listing.md` §C5; set prices per country; add a **review screenshot of the paywall** to each; localise the group name; every product "Ready to Submit" and **added to the version** |
| **Agreements, Tax, Banking** | Paid Apps Agreement active; Indian bank details; US tax form (W-8BEN). Without these, IAP cannot be tested |
| **App Information** | Primary **Lifestyle**, secondary **Entertainment**; Privacy Policy URL; the *License Agreement*: use Apple's standard EULA, and keep the Terms link in the description |

### RevenueCat paywall checklist (this is the 3.1.2 rejection risk)

In the RevenueCat dashboard paywall for the current offering, make sure the template shows: the plan name (**Occasio Pro**), the **period** (monthly / yearly), the **price** from the store (billed amount largest), **"Payment will be charged to your Apple ID… renews automatically unless cancelled at least 24 hours before the end of the current period"**, a **Restore purchases** button, and footer links to **Terms of Use** (`…/terms`) and **Privacy Policy** (`…/privacy`). Do not mention "365-day links" or "priority support".

---

## 6. Pre-submission smoke test (do all of it on a real iPhone from TestFlight)

1. **Backend:** the app points at the Firebase project `occasio-app-dev` and `https://occasio-greetings.vercel.app`. Confirm Firestore rules, Functions and the Vercel API deployed from the **current** code are live, and create the **demo account** now.
2. Fresh install → onboarding shows, **Skip** works.
3. As a guest: Create → photo → words → Preview → *Create the link* → share. Open the link in Safari: Pip gate, balloons, candle, gift, letter, finale. Tap **Report this card**: your mail app opens with the card reference.
4. Sign in with **Apple** (hide-my-email on) → Vault → add a person → close and reopen: still there.
5. Sign in with **email** using the demo account → Vault shows the two seeded people.
6. Create a second card in the same month → **paywall** appears, with price, period, auto-renew text, Terms and Privacy links.
7. Sandbox purchase of monthly → Account shows **OCCASIO PRO** → Restore purchases works on a second install.
8. Buy *One Extra Wish* → the second card goes through.
9. Account → *Delete account and data* with a subscription active → dialog mentions billing and offers *Manage subscription*.
10. Delete with the **Apple** account → Apple confirmation sheet → deleted → signing in with Apple again creates a **new** account.
11. Delete with the demo-style email account → deleted; the old card link now shows "not found".
12. Deny notification permission → the app still works. Deny photos → clear message, no crash.
13. Open `…/privacy`, `…/terms`, `…/delete-account`: all load and match the app.
14. Airplane mode on the paywall → "Plans unavailable… check your connection" (no developer text).
15. Check the iOS **widgets** appear in the widget gallery and open the app.

---

## 7. Likely reviewer questions and the answer you already have

| Question | Answer |
|---|---|
| "Where is the card the recipient sees? I can't find it in the app." | The recipient opens a web link by design; notes include an example URL, and the screenshots are labelled "What they open" |
| "Do you filter or let people report content?" | Cards are private, one-to-one links with no public feed; every card page has *Report this card*; reported cards are removed on request; Terms prohibit abuse |
| "Why Sign in with Apple *and* email?" | Apple is first, so 4.8 is met; email is for people without Google or Apple |
| "Can I delete my account?" | Yes, in the app; Apple tokens revoked |
| "How do I test the subscription?" | Free plan includes one card in total; create a second card or open Account → See Occasio Pro |
| "What does *auto-send* do?" | Notes describe it in specific terms (2.3.1). Keep the description identical to production behaviour |

---

## 8. What was entered in App Store Connect (8 Oct 2026, app "Occasio: Gift & Wish Reminder", Apple ID 6817678311)

Entered through the built-in browser after you signed in. **Nothing is submitted, and App Privacy is not published.**

| Area | State |
|---|---|
| Version 1.0 text | Promo, keywords (97 bytes), URLs, **description with real prices** ($2.99 / $19.99, no placeholders), **Copyright `2026 Nikhil Kubde`**, **App Review Notes** (2,698 of 4,000 bytes), sign-in required with demo credentials, contact info. Release type left on **Automatic** (your choice) |
| Screenshots · header | 8 iPhone screenshots and 1 header asset were already uploaded by you |
| App Information | Subtitle `Never forget. Send a surprise.`, primary **Lifestyle**, secondary changed **Social Networking → Entertainment** |
| Age Rating | Set up: user-generated content **yes**, everything else no/none → calculated **4+**, no override |
| App Privacy | 8 data types set up (name, email, phone, photos, other user content, user ID, device ID, purchase history): all *App Functionality*, *linked to user*, *no tracking*. **Not yet published** |
| Pricing and Availability | App price **Free ($0.00)**, **175 countries or regions**. Mac App Store and Vision Pro boxes left ticked (your choice) |
| Subscription group | **Occasio Pro**, display name set (uses the app name) |
| `occasio_pro_monthly` | 1 month, **$2.99**, all countries, "Occasio Pro Monthly / 24 cards a year. Save up to 5 people." |
| `occasio_pro_yearly` | 1 year, **$19.99**, all countries, "Occasio Pro Yearly / 24 cards a year. Save up to 5 people." |
| `occasio_wish_single` | Consumable, **$0.99**, all countries, "One Extra Wish / One more card beyond your free monthly card." |

Apple converts the US prices into local prices automatically (for example, $2.99 shows as $3.99 in Canada and Albania, so check India and your other markets under *Subscription Pricing → All Prices and Currencies* before launch).

### Still open in App Store Connect

1. **Content Rights:** deliberately not answered. The app ships 5 sound effects and 5 Lottie animations with no licence record. If any came from a library, answer *"Yes, it contains third-party content, and I have the necessary rights"*; if you made them all, *"No"*.
2. **Review screenshot for each of the 3 products** (a paywall screenshot; Apple will not mark a product ready without it) and, optionally, review notes per product.
3. **App Privacy → Publish.**
4. **Upload a new build** (the attached build 1 predates the compliance fixes) and select it on the version page.
5. **Age rating vs. Terms:** the Terms say users must be 13+, while the rating is 4+. Either override the rating to 13+ (Age Rating → Age Categories and Override) or change the Terms.
6. **EU trader status** (Business), since the app is available in the EU.
7. **Add for Review → Submit to App Review**, only after the outside-the-browser items in §1 and §4 are done.
