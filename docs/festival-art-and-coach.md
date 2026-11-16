# Festival art and the festival coach

Two things built on the list of 51 festivals ([holidays.md](holidays.md)):

1. **Art.** Every festival has its own look: its own drawings, what Pip wears, what the recipient taps, what hangs across the page and what drifts behind it. Diwali has diyas and crackers, Christmas has Santa and a tree whose stars come on.
2. **The coach.** A set of rules that puts the right festival first for each person, finds the people in their Vault it is for, and makes one gentle suggestion when a festival is close, so one festival becomes several wishes instead of one.

## The art

### What each festival has

Every festival has a hero drawing (its face), a few more that belong to it, four things to tap in the story, a garland, drifting layers, a costume for Pip and a finale. A few examples (all 51 are in `scripts/art/festival-motifs.mjs`):

| Festival | Hero and extras | Tapped in the story | Pip wears | Finale |
|---|---|---|---|---|
| Diwali | diya, rocket, anar (flowerpot cracker), rangoli, marigold | diya (lights), rocket (bursts), anar (bursts), diya | a diya on his head | fireworks |
| Christmas | Santa, tree, star, snowflake | tree (its stars come on), star, Santa, tree | a Santa hat | snow |
| Halloween | pumpkin, ghost, bat | pumpkin (it glows), ghost, pumpkin, bat | a witch hat | stars |
| Holi | colour splash, gulal, balloon (water balloons), heart | splash, gulal, balloon, splash | colour on his cheeks | coloured powder |
| Eid and Ramadan | crescent, lantern, moon, star | lantern (lights), crescent, lantern, star | a crescent on his head | lanterns |
| Raksha Bandhan | rakhi, thali, heart | rakhi, heart, rakhi, thali | holding a rakhi | petals |
| Makar Sankranti | kite, sun, wheat | kite, sun, kite, sun | holding a kite | confetti |
| Republic and Independence Day | flag, star, balloon | flag, balloon, burst | holding the flag | fireworks |
| Lunar New Year | red lantern, red packet | lantern, packet, lantern, burst | holding a lantern | fireworks |
| Hanukkah | menorah, dreidel | menorah (flames), dreidel | holding a dreidel | stars |

### Where it shows

| Where | What |
|---|---|
| Recipient's story: the first screen | Pip in the festival's costume, the garland across the top, drawings drifting behind |
| The tap scene (replaces the balloons) | The festival's own four things: a diya lights and shows its word, a rocket bursts, a tree's stars come on. The heading follows what the first one does ("Light up Diwali", "Play Holi", "Make Republic Day sparkle", "Pop for Onam") |
| Finale | The festival's own celebration; snow and coloured powder are new |
| The app: Home row, the festival list, the nudge | The hero drawing instead of a generic icon |
| The app: card preview and the share screen | Small corner decorations on the card |

Not done yet: the 3D gift wrap (it still uses the generic patterns in the festival's colours), the link-preview image, and corner decorations on the plain (non-story) web card. Pip has no festival-specific face or pose, only costumes.

### How it is made

All drawings are small flat illustrations on a 100 by 100 canvas, written as shapes in **`scripts/art/festival-motifs.mjs`**. The same script writes four JSON files, so the app and the recipient's page always draw the same pictures:

| File | Used by |
|---|---|
| `src/shared/ui/art/festivalMotifs.json` | the app (react-native-svg, `FestivalArt.tsx`) |
| `docs-site/src/lib/festivalMotifs.json` | the web (`FestivalArt.tsx`) |
| `src/features/create/domain/festivalArtData.json` | the app's festival to drawings mapping (`festivalArt.ts`) |
| `docs-site/src/lib/festivalArtData.json` | the web's copy of that mapping |

A drawing can have a **lit** part (a flame, a glow, a tree's stars) and a **dim** part (shown only when switched off). A diya is lit when someone taps it in the story.

To **see every drawing**, run the docs-site and open `/dev/festival-art` (not available in production). To **change or add** one: edit the script, run `node scripts/art/festival-motifs.mjs`, look at the gallery. The script refuses to write if a festival names a drawing that does not exist, or lists anything but four taps. `festivalArt.test.ts` fails if the copies differ or are out of date, if any festival lacks art, and if a "light up" tap names a drawing with nothing to light.

Pip's costume is either a named one (`santa_hat`, `witch_hat`, `bunny_ears`, `holi_colour`, plus the older ones) or any drawing worn on the head (`head:diya`) or held (`held:flag`).

## The coach

It is plain rules in `src/features/create/domain/festivalCoach.ts`, on the device, with no server and no model. Nothing about the Vault or the history leaves the phone for it.

### Ranking: which festival first

A festival's score, 0 to 100, is:

```
score = 100 x ( 0.34 x timing + 0.22 x reach + 0.20 x affinity + 0.24 x value ) x freshness x regionFactor
```

| Part | What it is |
|---|---|
| **timing** | How near: 1 on the day, 0.95 tomorrow, 0.88 within 3 days, 0.75 within a week, 0.55 within two, 0.35 within a month, 0.15 within two. A festival from yesterday is 0.5, so a late wish is still offered |
| **reach** | How widely it is kept: 0.85 for the festivals marked for Home, 0.4 for the rest, scaled by how common that kind of festival is where the device is (India, the US, elsewhere). The region comes from the phone's locale and is only a guess |
| **affinity** | What this person has shown they keep: 1 if they sent this festival in the last 14 months, 0.7 if longer ago, 0.55 if they sent a festival of its kind, a little if they have sent anything |
| **value** | How many people in the Vault it is for. Mother's Day is for "Mom", Raksha Bandhan for siblings, Valentine's Day for a partner; most festivals are for anyone. More people means more worth in starting it |
| **freshness** | 0.25 once everyone it is for has had a wish this time, so it stops asking |
| **regionFactor** | 0.4 to 1 by region, but **1 as soon as there is any evidence** (a festival sent before, its kind, or people it is for). Where someone lives is a first guess that personal history overrides |

Festivals under 20 are not shown. Festivals the person snoozed this year are left out. Home shows the best six.

### Who to wish

For a festival the coach lists people from the Vault who have not had it this time (it looks at cards made within 45 days of the day), best first: people it is specifically for (+3), people who got it a year ago (+2.5), and people who have gone longest without any card (up to +2). A festival meant for one kind of person only suggests that kind. Up to four. It matches names by first name too, so "Priya" and "Priya Sharma" are one person.

On Home this shows as a line under the festival's date ("For Mom, Priya and 2 more"), and tapping the festival starts a card for the first of them with their name and the audience already set. After a festival card is shared, the share screen offers "Wish someone else this Diwali" with the next people as buttons; one tap starts the next card.

### When to say something

A nudge card appears at the top of Home only when all of these hold:

- the festival is within 7 days (or was yesterday);
- it scores 55 or more (70 if the person has no wish left to spend);
- it is a widely kept festival, or one this person has sent before. "Everyone in the Vault fits it" is true of every festival, so it is never reason enough;
- it has been shown fewer than twice this year (once if there is nothing to spend);
- at least 36 hours have passed since the last nudge for anything else.

A nudge that appears stays for that day and counts as one showing. When someone has no wish left, a plan prompt can take the nudge's place and the nudge stays quiet for the day (see [home-plan.md](home-plan.md)); both are drawn by `ReminderCard`. **Not now** silences that festival until next year. The words are calm and say what is on offer ("Diwali is in 2 days. Mom and Priya are in your Vault. A photo and a few words is enough."); a test fails on exclamation marks, emoji, "don't forget", "last chance" or "hurry". What was shown and snoozed is kept on the device per account.

### Push notifications: not built

Everything above is inside the app. Reminders that arrive when the app is closed are not built, on purpose:

- they need the person's explicit opt-in (the existing notification permission is for the auto-send review, and a festival reminder is a different thing);
- they need a server job (the Functions are not deployed), a "Festival reminders" switch in Account, and a way to open the app on the right festival;
- they would send nothing personal unless the server reads the Vault, which this design avoids.

The plan is ready in the code: `reminderTimes` gives three days before and the day itself, at 10:00 and 09:00 on the person's own clock, never in the night. A server version would use the same dates (`festivalArtData.json` and the festival list carry them), send one generic line ("Diwali is in 3 days. A photo and a few words is enough."), and respect the same limits (twice a festival, not within 36 hours of another).

### Measuring it

Events: `festival_nudge_shown` (with the festival, its score and how many people it found), `festival_nudge_tapped`, `festival_nudge_dismissed`, `festival_next_person_tapped`, plus the existing `holiday_selected` with a `source` of `create_home`, `festival_nudge`, `occasion` or the list. The plan prompt has its own events, in [home-plan.md](home-plan.md). The number to watch is cards made per festival per person: the coach is working if "next person" taps follow a first card.

### Tuning

The numbers are constants at the top of `festivalCoach.ts` (`COACH_WINDOW_DAYS`, `MIN_SHOWN_SCORE`, `NUDGE_MIN_SCORE`, `NUDGE_WITHIN_DAYS`, `NUDGE_MAX_PER_FESTIVAL`, `NUDGE_MIN_GAP_HOURS`) and the weights in `scoreOne`. `festivalCoach.test.ts` pins the behaviour (ranking, the region guess, who is suggested, every nudge limit), so a change to a number shows exactly which promise it breaks.

## What has and has not been seen

- **Seen:** the recipient's story for Christmas, Diwali, Halloween and Holi, in the browser (gate, garland, drifting drawings, the tap scene lighting and bursting, the colour-powder finale); the festival tiles on Home, in the real app, on the emulator's release build (52.1 MB, so the art added about 50 KB).
- **Tested but not seen:** the coach with real data. A nudge needs a signed-in account with people in the Vault and festival history; 31 tests cover the rules, the saved state and the cards, but the nudge card, the "For Mom, Priya" lines and the "Wish someone else" buttons have not been looked at on a device.
- **Not seen in the app:** the corner decorations on the card preview and share screen.

## A trap this found

Metro resolves an import with no extension by trying `.js`, then `.json`, then `.ts`. A `festivalArt.json` beside `festivalArt.ts` made `import … from './festivalArt'` load the JSON in the built app (so `festivalArtFor` was undefined and Home crashed), while Jest and TypeScript, which prefer `.ts`, passed everything. The data files are now `festivalArtData.json` and `festivalMotifs.json`, and `__tests__/architecture/importNames.test.ts` fails if any JSON file in `src/` shares a name with a source file.
