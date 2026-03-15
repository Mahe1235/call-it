# Called It — Banter & Copy Library
### MVP · All in-app copy, team banter, and rivalry lines

---

## How This File Is Used

This file is the **complete copy source** for the Called It app. Every piece of banter, every confirmation line, every empty state pulls from here. When building the app:

- Friend names in `[BRACKETS]` are **placeholder names** — replace with actual group member names at onboarding or in config
- Banter lines rotate — show one at a time, cycle on tap
- `{TEAM}` = the user's chosen team short code
- `{PLAYER}` = a specific player name from the prediction card
- `{POINTS}` = numeric point value
- `{FRIEND}` = a random group member name (not the current user)

### Placeholder Friend Names Used In This File
| Placeholder | Character | Team |
|-------------|-----------|------|
| `[ARJUN]` | Overconfident. Never wrong in his own head. | MI |
| `[PRIYA]` | Methodical. Has a system. The system works. | CSK |
| `[DEEPA]` | Analytical. Spreadsheet. Will not be rattled. | KKR |
| `[RAHUL]` | Recently won something and won't stop mentioning it. | RCB |
| `[MEERA]` | Loyal to a fault. Has suffered. Keeps going. | PBKS |
| `[KARAN]` | Romantic about cricket. Statistically sound. Emotionally rich. | RR |
| `[NISHA]` | Unbothered. Trusts the process. Inexplicably calm. | SRH |
| `[SANA]` | Quietly confident. Always right. Barely explains herself. | GT |
| `[VIKRAM]` | Has been doing this since before the rebrand. Still waiting. | DC |
| `[ROHAN]` | New fan. No trauma. Pure chaos energy. | LSG |

---

## Section 1: UI Copy — System Messages

### Prediction Card
| State | Copy |
|-------|------|
| Card open (morning) | "Today's card is open. {TEAM_A} vs {TEAM_B}. Lock it in before the first ball." |
| Card open (close to match) | "Match starts in {X} minutes. Card's still open. [ARJUN]." |
| 30 mins to lock | "30 minutes left. [ARJUN] still hasn't filled his card." |
| 10 mins to lock | "10 minutes. This is your last warning and also [PRIYA]'s first." |
| 5 mins to lock | "5 minutes. Pick something. Anything. [ARJUN]." |
| Lock countdown (live) | "{HH}:{MM}:{SS} until lock" |
| Card locked | "Card locked 🔒 You're on record." |
| Card locked (missed) | "Card didn't make it in time. The {TEAM} fan excuse is ready when you are." |
| Results pending | "Match done. Scoring in progress. Should land in a few minutes." |
| Results posted | "Scores are in. Brace yourself." |

### Pick Confirmation Lines (after selecting a team/player)
| Pick | Copy |
|------|------|
| Match Winner — user's team | "Loyal. Possibly correct. [ARJUN] picked the same, for what it's worth." |
| Match Winner — opponent | "Going against your own team? Bold. [PRIYA] will ask questions." |
| Match Winner — neutral pick | "Locked. [DEEPA] picked the other side. One of you is having a good night." |
| The Call — Yes/Over | "You went over. [KARAN] went under. One of you studied the venue stats." |
| The Call — No/Under | "Playing it safe? Or do you know something? [NISHA] picked the same." |
| The Call — team pick | "Backing {TEAM}. [ARJUN] backed the other side. The card is set." |
| Villain Pick — selected | "Villain locked: {PLAYER}. [ARJUN] villain-picked someone different. May the worse prediction win." |
| Villain Pick — big name | "You villain-picked {PLAYER}. That's either genius or career-ending. No middle ground." |
| Villain Pick — skipped | "No villain pick. Playing it clean tonight. [DEEPA] did not play it clean." |
| Chaos Ball — Yes | "Yes on the Chaos Ball. [PRIYA] also said yes. One of you is guessing." |
| Chaos Ball — No | "No on the Chaos Ball. The safe pick. Except it's a Chaos Ball so nothing is safe." |

### Scoring / Results
| Outcome | Copy |
|---------|------|
| Perfect card (all 4 correct) | "Clean sweep. All 4. [PRIYA] is going to hear about this." |
| 3 of 4 | "3 out of 4. You know which one. It's always the one you were sure about." |
| 2 of 4 | "2 out of 4. Respectable. [ARJUN] got 1. You're allowed to mention this." |
| 1 of 4 | "1 out of 4. The match winner, at least? No? Okay." |
| 0 of 4 | "0 points. It happens. [VIKRAM] has been here before and he survived. Barely." |
| Match Winner correct | "Called it. +10." |
| Match Winner wrong | "Didn't land. The group is split on whether this was brave or foolish." |
| The Call correct | "The Call landed. +10. [DEEPA] is recalculating." |
| The Call wrong | "The Call missed. [KARAN] got it. He has a tab for this." |
| Villain Pick correct | "Your villain pick landed. {PLAYER} scored {X}. Under 10. +15 pts. Ruthless." |
| Villain Pick — scored 30+ | "{PLAYER} scored 30+. −5 pts. Villain Pick backfired. [RAHUL] warned you." |
| Villain Pick — neutral | "{PLAYER} scored {X}. Not under 10. Not 30+. No points. No penalty. Unsatisfying for everyone." |
| Villain Pick — didn't play | "{PLAYER} didn't play. Villain Pick voided. 0 pts. Pick someone who shows up next time." |
| Chaos Ball correct | "Chaos Ball landed. +12. Nobody planned for this. [ROHAN] claims he did." |
| Chaos Ball wrong | "Chaos Ball missed. 0 pts. It was chaos. That's the point." |
| H2H — won this match | "You beat [PRIYA] by {N} points this match. +10 H2H bonus. She knows." |
| H2H — lost this match | "[DEEPA] outscored you this match. She gets the +10. {N} matches left in the cycle." |

---

## Section 2: Empty States & Edge Cases

| State | Copy |
|-------|------|
| No matches today | "Rest day. Either revisit yesterday's damage or argue about it. Both valid." |
| Nobody filled their card yet | "Nobody's filled their card yet. Classic. The match starts in {X} hours." |
| Only user filled card | "You're the first one in. Now sit with the uncertainty for a few hours." |
| All filled | "Everyone's in. May the best prediction win. May [ARJUN]'s be wrong." |
| Friend hasn't filled card | "[ARJUN] hasn't filled their card. The match is in {X} minutes. Classic [ARJUN]." |
| Season predictions not filled | "Season predictions aren't locked yet. Sort that out before Match 1." |
| H2H this cycle — winning | "You're up on [PRIYA] this month. Don't mention it. Mention it." |
| H2H this cycle — losing | "[DEEPA] has 3 more points this month. The cycle resets in {N} days." |
| Leaderboard — last place | "Last place. Early season. [VIKRAM] has been here before and he always comes back." |
| Leaderboard — first place | "Top of the table. [ARJUN] is 4 points back and not sleeping." |

---

## Section 3: Team Fan Banter

*8 lines per team. Cycle on tap. Shown in the "Fan Banter" tab on team card.*

### CSK — Chennai Super Kings
1. CSK fans have never experienced a rebuild. They don't know what one is. They've heard of it. They remain unbothered.
2. [PRIYA] prepared a winner's dinner menu in February. It's March. The menu has not changed.
3. Ruturaj Gaikwad is the new Dhoni except Dhoni is still also there. The CSK succession plan is just 'two of them now.'
4. Dhoni's been 'retiring soon' for 6 years. [PRIYA] has developed a full immunity to retirement announcements.
5. CSK were banned for 2 years. Came back. Won immediately. The message was delivered without any subtlety whatsoever.
6. The Chepauk crowd doesn't cheer. They conduct a ceremony. 50,000 people in yellow doing one single vibe.
7. 5 titles, same captain for most of them, zero drama. Meanwhile [ARJUN] is still explaining the Hardik situation.
8. CSK's death overs are a spiritual experience. You know Dhoni's finishing it. You cannot stop it. You can only witness.

**Roast footer:** "vs MI: 'Both 5 titles. Only one of us had a clean transfer window.' (Dhoni is still at CSK.)"

---

### MI — Mumbai Indians
1. [ARJUN] doesn't say 'if we win' — he says 'when we're in the knockouts' from Match 1. Overconfidence? No. Pattern recognition.
2. The Hardik saga: MI bought him back, gave him the captaincy, had a complicated year. Classic MI chaos management.
3. Rohit Sharma batting at 5 and still being MI's most reliable batter is genuinely cricket's greatest unsolved mystery.
4. Bumrah is bowling. The opposition's batting average drops by 40. This is not hyperbole. This is a Cricinfo stat.
5. Wankhede on a playoff night is the most hostile 3 acres of real estate in Indian sport. [ARJUN] has a seat in the front row.
6. The even-year title cycle broke in 2023. [ARJUN] is processing this the way you process a family trauma. Quietly and incorrectly.
7. MI's 'rebuild' since 2023 is the most expensive rebuild in IPL history. Suryakumar is still there. [ARJUN] says it's fine.
8. Jasprit Bumrah exists and MI just get to have him. Every other fanbase has accepted this and it still stings every single season.

**Roast footer:** "vs CSK: 'The Southern Derby is healthy competition between equals.' (Both 5 titles. Zero respect on either side.)"

---

### RCB — Royal Challengers Bengaluru
1. June 3rd, 2025. Virat Kohli on his knees at Ahmedabad. Crying. 18 years. [RAHUL] hasn't been the same since and he means that positively.
2. [RAHUL] spent 17 years saying 'ee sala cup namde.' He was simply 13 years early. The patience was always the point.
3. The 2025 final was RCB vs PBKS — two teams that had never won. One of them had to finally escape. The universe chose correctly.
4. Virat Kohli stayed loyal to RCB for 18 IPL seasons when literally any other franchise would have won him a title faster. The emotional damage this caused [RAHUL] is irreversible and he loves it.
5. RCB became insufferable THE MOMENT they won. Previously unbearably tragic. Now unbearably smug. Both modes at full volume.
6. The Chinnaswamy crowd intimidated teams for 17 years with zero title. Now with one, they are genuinely unreasonable about it.
7. The '18' jersey trend after the 2025 win was peak RCB. Crying immediately. Branding it within hours. Merch by midnight. [RAHUL] has three.
8. [RAHUL] is now the person who says 'as defending champions' in a casual conversation about IPL. He's getting worse not better.

**Roast footer:** "Both were called chokers. One escaped. [MEERA] did not escape. [MEERA] will not be taking questions."

---

### KKR — Kolkata Knight Riders
1. KKR won the 2024 title with a squad most analysts wrote off in January. [DEEPA] was not one of those analysts. [DEEPA] never is.
2. SRK posts a celebration reel within minutes of any KKR win. It gets 3 million likes. It is always ready. It is always edited. It is always on time.
3. You villain-picked Rinku Singh once. [DEEPA] recorded this. She has filed it. It will be deployed at exactly the right moment.
4. Eden Gardens at night with 66,000 people in purple and gold is cricket's most theatrical stage. KKR have used it well.
5. 3 titles and [DEEPA] still carries an underdog chip. The most well-decorated persecution complex in Indian sport.
6. Phil Salt and Sunil Narine opening in 2024 was the most absurd power move in IPL. [DEEPA] called it in the auction preview.
7. Andre Russell doing something physically impossible is now a baseline expectation. [DEEPA] stopped being surprised in 2016.
8. KKR released Shubman Gill before 2024. Won the title anyway. The message was clear. [DEEPA] delivered it personally.

**Roast footer:** "Post-2024 title, [DEEPA] has been insufferable. A measured, statistical insufferable. Somehow the worst kind."

---

### DC — Delhi Capitals
1. DC have produced Prithvi Shaw, Shreyas Iyer, Rishabh Pant, and Axar Patel. Three of them now win titles somewhere else. The pipeline is impeccable. The retention is a disaster.
2. Rishabh Pant returned from a near-fatal accident to play IPL cricket again. [VIKRAM]'s hope meter has been reset to factory settings.
3. 2020 was the year. DC had a squad that should have won. Got to the final. Then didn't win. Then dismantled everything. Classic Delhi.
4. [VIKRAM] has been a fan since they were Delhi Daredevils. He's seen 3 name changes and 0 title changes.
5. DC's approach: build a great team, peak together, lose, rebuild, repeat. They are extremely consistent at the wrong thing.
6. The Kotla/Arun Jaitley crowd doesn't accept average cricket. [VIKRAM] has never accepted average cricket. They deserve each other.
7. Delhi is the capital of a country of 1.4 billion people. Delhi Capitals have never been the capital of IPL. The irony has been noted. Nothing has changed.
8. [VIKRAM] doesn't trash talk. He just has a face. The face is very specific. The face says: I know. I've always known. It happens again.

**Roast footer:** "Great players. Correct vibes. Zero trophies. [VIKRAM]'s whole IPL career is a nearly-great Bollywood film."

---

### SRH — Sunrisers Hyderabad
1. SRH scored 277/3 in 2024 and rewrote what a T20 total can mean. Every other team's batting coach has watched that footage many times. They have questions.
2. Travis Head in the powerplay is a humanitarian concern for opening bowlers. [NISHA] treats this as a completely normal thing to have access to.
3. Heinrich Klaasen exists. Plays for SRH. Just allowed. Nobody has done anything about this. It continues every season.
4. SRH released David Warner. Won a title without him. Then broke every batting record. Warner has not commented publicly. [NISHA] has noted this.
5. '[NISHA] picks SRH for every match with a conviction that has no basis in recent form and infinite basis in love.' This is an accurate sentence.
6. 'We left some on the table,' said the SRH fan after a 240-run total. The table is fine, [NISHA]. The table is fine.
7. Pat Cummins as captain-bowler for SRH is the most Australian outcome of an Indian franchise in IPL history.
8. The transformation from 'two spinners and discipline' to '277 off 20 overs' took 3 seasons. [NISHA] says she always knew.

**Roast footer:** "Travis Head in the first over is a scheduled problem. [NISHA] is not scheduling around it. She is enjoying it."

---

### RR — Rajasthan Royals
1. RR won in 2008 because Shane Warne refused to accept that Rajasthan wasn't good enough. It worked once. Then 13 years of character development.
2. [KARAN] has a spreadsheet for his predictions. Not notes — a live spreadsheet. With conditional formatting. Colour-coded by confidence level.
3. Sanju Samson is the most talented 'hasn't quite done it yet' player in IPL history and [KARAN] feels this in his spine every single match.
4. RR's model: find undervalued players, develop them brilliantly, watch MI or RCB buy them for 3x at the next auction. Rinse and repeat with dignity.
5. The 2022 final loss to GT was a genuine heartbreak for people who had spent 14 years waiting just to be there.
6. Yashasvi Jaiswal came up through RR and is now India's most exciting Test opener. [KARAN] is very proud and slightly upset about this.
7. The Sawai Mansingh crowd is among the loudest in IPL. Jaipur doesn't do half-hearted. [KARAN] has been twice. He went alone.
8. Pink kit. Palace arch branding. Sanju looking wistfully at the boundary. This is the aesthetic of beautiful, beautiful suffering and [KARAN] is at peace with it.

**Roast footer:** "'Statistically sound with emotional richness,' [KARAN] says about his RR picks. Both things are true. Both things hurt."

---

### PBKS — Punjab Kings
1. PBKS reached the 2025 IPL final. Lost to RCB by 6 runs. To RCB. Who had been waiting 18 years. Shashank Singh hit 20 off the last over and it still wasn't enough. [MEERA] has not recovered.
2. Chris Gayle scored 175 not out for PBKS in 2013. That match still ended in a loss. This is what PBKS cricket does to people.
3. Shreyas Iyer's captaincy was genuinely excellent in 2025. PBKS played the best cricket in the league stage. Lost the final by 6 runs. History is very specific about its cruelty.
4. [MEERA] has said 'this is Punjab's year' since 2014. In 2025 she was technically right — they made the final. Then they weren't.
5. Arshdeep Singh is the best death bowler in India, plays for PBKS, and [MEERA] has complicated feelings about every contract renewal.
6. PBKS rebranded from Kings XI Punjab in 2021. The rebrand has not been communicated to the trophy room.
7. The most quietly dignified suffering fanbase in IPL. No drama. No tantrums. Just [MEERA]'s very specific look that communicates everything.
8. Year 18 and counting. At least they've been to a final in living memory now. [MEERA] is choosing to hold onto this. We support her.

**Roast footer:** "Lost the 2025 final to the team that had been waiting 18 years. The universe is running a very specific joke and [MEERA] is the punchline."

---

### LSG — Lucknow Super Giants
1. [ROHAN] has never experienced an IPL rebuild. LSG has never needed one. He doesn't know how lucky he is yet. We are not going to tell him.
2. LSG in 2022: brand new franchise, immediately competitive, [ROHAN] acts like this is normal. It is not normal.
3. Nicolas Pooran era beginning. [ROHAN] is not even slightly worried. [ROHAN] has never been worried. [ROHAN] is new here.
4. 50,000 seats at Ekana Stadium, most of whom became fans in 2022, all of whom feel nothing but possibility. The innocence is frightening.
5. Three seasons in, multiple playoffs, zero title — and the optimism pipeline is still running at full capacity. No damage has occurred yet.
6. Every other fanbase has years of scar tissue telling them to manage expectations. [ROHAN] has zero of this protection and it shows.
7. LSG's nawabi Lucknow branding versus the 'can we make top 4 again' reality is a cultural tension that [ROHAN] resolves entirely with vibes.
8. [ROHAN] explains the batting lineup with confidence usually reserved for franchises with multiple titles. This makes [VIKRAM] furious.

**Roast footer:** "No titles. No trauma. Unbearable baseline optimism. [ROHAN] is the most dangerous type of fan in a group chat."

---

### GT — Gujarat Titans
1. GT won the IPL in year 1. Reached the final in year 2. Won again in year 3. Franchises that have existed since 2008 have collectively filed a formal complaint.
2. Hardik Pandya left for MI. GT said 'okay, next.' Shubman Gill took over. Won again. This franchise has no scar tissue and it is deeply unfair.
3. [SANA] has been saying GT's bowling lineup is 'underrated' since 2022. She has been right every single time. She never raises her voice about it.
4. The Narendra Modi Stadium holds 132,000 people. A GT home knockout game is the loudest 4 hours in Indian cricket. Full stop.
5. 2 titles in 4 seasons for a team that didn't exist in 2020. [PRIYA] has clocked this. [ARJUN] has clocked this. Nobody has said anything to [SANA].
6. GT's whole brand is 'Aava De' — come on in. They then win. The welcome is doing very serious structural work.
7. Shubman Gill left KKR, helped GT win 2 titles, became India's Test captain. The Ahmedabad effect is a documented phenomenon.
8. [SANA] never panics. Not during close finishes, not in the group chat, not ever. This is either Zen or she genuinely knows something.

**Roast footer:** "Brand new. Two titles. Efficient. Undramatic. The most threatening thing in cricket after Jasprit Bumrah."

---

## Section 4: Rivalry Banter

*6 lines per matchup. Shown in "Rivalry Banter" tab when a match is selected. Cycle on tap.*  
*Key format: `TEAM_A-TEAM_B` always alphabetical.*

---

### CSK vs MI — *The Big One*
1. 5 titles each. The only IPL match where even the neutrals feel the full weight of history. Everything else is a warm-up for this.
2. [PRIYA] and [ARJUN] in the group chat during this fixture is a diplomatic incident. Seating assignments have been made.
3. Bumrah bowling to Ruturaj in the powerplay is an encounter that should come with a health advisory for both fanbases.
4. Every CSK vs MI is described as 'the biggest match of the tournament' regardless of where it lands in the schedule. It always is.
5. Wankhede or Chepauk — either way 30,000+ people who will not accept a quiet evening. Pick your suffering.
6. Both have 5 titles. Both have Dhoni in their history. Neither will acknowledge the other's right to feel superior. This is correct behaviour.

---

### CSK vs RCB — *The Southern Derby*
1. CSK–RCB is a fixture played with the energy of a derby where one side has 5 titles and the other just got off the floor after 18 years.
2. RCB beat CSK at Chepauk in 2025 — first time since 2008. Kohli fell to his knees. [PRIYA] has filed this away for later use.
3. [RAHUL] now enters this fixture with a trophy. [PRIYA] enters with 5. The trash talk ratio has never been more balanced.
4. Jadeja bowling to Kohli at Chepauk is the cricketing equivalent of an immovable object and an unstoppable force meeting politely.
5. The Chinnaswamy vs Chepauk crowd rivalry is its own subplot. Two of the most intense 50,000-person atmospheres in Indian cricket.
6. [PRIYA] was fine about RCB winning until [RAHUL] brought it up at a non-cricket conversation. She is less fine now.

---

### CSK vs KKR — *Champions' Clash*
1. CSK vs KKR is 8 titles in one fixture. The other 8 franchises should probably not watch.
2. Jadeja vs Narine — two of the most miserly spinners in IPL history, same match, spin-friendly conditions. Batting trauma.
3. SRK in the KKR box vs the CSK yellow sea at Chepauk is the greatest visual in IPL. Two cultural juggernauts. Zero compromise.
4. [PRIYA] and [DEEPA] in the same row is a seating arrangement that requires mediation. The mediation has never worked.
5. CSK's auction strategy: patience, value, long game. KKR's: charismatic aggression. Both approaches have 3+ titles. Neither is wrong.
6. Dhoni walking in at 9 against KKR's bowling is the most specific kind of theatre that only IPL produces.

---

### CSK vs SRH — *Chepauk vs the 277 Team*
1. SRH posted 277 in 2024. [PRIYA] watched the footage. CSK have prepared. They are still concerned.
2. Travis Head in Chennai is a tactical problem that the Chepauk spin surface was not specifically designed to solve.
3. CSK's 'patient process' philosophy vs SRH's 'we will simply outscore the problem' is the clash of IPL worldviews this season.
4. [PRIYA] and [NISHA] during this match is two kinds of certainty in the same group chat. Both completely calm. Both completely opposed.
5. Deepak Chahar's first over at Chepauk is genuinely beautiful. Travis Head treating it as a net session is the conflict.
6. 5 titles vs 2 titles and a batting world record. The trophy board is clear. The scorecard from 2024 is also clear.

---

### CSK vs DC — *The Talent Pipeline*
1. DC raise them. CSK sign them. It is a system. No formal agreement exists. It simply functions.
2. [PRIYA] respects [VIKRAM]'s loyalty to DC. She also has 5 trophies. These two facts coexist in every conversation.
3. Ruturaj Gaikwad was nearly a DC player at various points in his career. The alternate timeline haunts [VIKRAM].
4. Kotla vs Chepauk — two of India's most storied grounds. The pitches are different. The suffering for [VIKRAM] is consistent.
5. DC has the coaching talent, the ground, the city. One specific item remains absent. [PRIYA] has not mentioned it. [VIKRAM] appreciates this.
6. '[VIKRAM] vs CSK' is the fixture where [VIKRAM] refuses to be intimidated and [PRIYA] refuses to notice.

---

### CSK vs RR — *Dhoni vs Sanju*
1. Dhoni at Chepauk vs Sanju Samson at Sawai Mansingh — two of the most beloved player-ground relationships in IPL. One match.
2. [PRIYA] respects what RR built in 2008. She also reminds [KARAN] that Shane Warne only won it once.
3. RR's batting depth vs CSK's death-over bowling is the matchup [KARAN] has a separate spreadsheet tab for.
4. The pink army vs the yellow sea — two of the most distinctive crowd aesthetics in IPL, finally in the same fixture.
5. [KARAN] and [PRIYA] have never argued loudly. Their disagreements are conducted entirely in knowing looks. This fixture produces the most looks.
6. 5 vs 2 on the titles board. [KARAN] notes this. He also notes CSK's average score at neutral venues. The spreadsheet has a tab.

---

### CSK vs GT — *Old Guard vs New Power*
1. CSK have 5 titles earned across 16 years. GT have 2 titles earned across 4 years. [PRIYA] has feelings about this timeline.
2. [SANA]'s very calm 'they're a well-run franchise' about GT makes [PRIYA] more competitive than any actual trash talk could.
3. The Hardik situation is relevant to both teams in different ways. [PRIYA] and [SANA] have not discussed this. They are aware.
4. Narendra Modi Stadium hosting GT vs CSK is the largest cricket ground in the world hosting two of the most successful franchises. Context.
5. CSK trust experience and process. GT trust data and quiet confidence. [SANA] trusts the process. [PRIYA] is the process.
6. 'Aava De' vs 'Yellove' is not a fight anyone expected from two of IPL's most composed franchises. [PRIYA] and [SANA] are composed. The match is not.

---

### CSK vs PBKS — *The Almost and the Accomplished*
1. [PRIYA] brings 5 titles. [MEERA] brings a 2025 runner-up medal and 11 years of emotional continuity.
2. PBKS played their best cricket in 2025 and still came up short. [PRIYA] is sympathetic. She has 5 trophies to process that sympathy through.
3. CSK has never finished last. PBKS has never finished first. This fixture summarises the gap efficiently.
4. Arshdeep Singh vs CSK's top order is the only moment in this fixture where [MEERA] has the statistical advantage.
5. [MEERA] doesn't mention the 2025 final to [PRIYA]. [PRIYA] doesn't mention the 5 titles to [MEERA]. This is friendship.
6. One team knows what winning feels like. The other team now knows what the final feels like. It is a gap. It is smaller than it was.

---

### CSK vs LSG — *The Dynasty vs The Newcomers*
1. [PRIYA] has 5 titles. [ROHAN]'s team has existed for 3 seasons. The history conversation is brief.
2. [ROHAN]'s complete absence of IPL trauma makes [PRIYA] protective and slightly suspicious of his confidence.
3. CSK's deep experience of big moments vs LSG's 'we haven't experienced anything going badly yet' is an interesting matchup of mentalities.
4. The Ekana Stadium crowd is genuinely loud. [PRIYA] respects loud. She has 50,000 in yellow who agree.
5. [ROHAN] has never lost a final. [ROHAN] has never been in a final. These two facts coexist comfortably in his world.
6. [PRIYA] is pleasant to [ROHAN] about this fixture. [ROHAN] is pleasant back. One of them has 5 trophies. Only one of them is aware of this.

---

### MI vs RCB — *Mumbai vs the New Champions*
1. MI have 5 titles. RCB have 1. This was 0 until June 3rd 2025. [ARJUN] and [RAHUL] have never been more evenly matched.
2. Bumrah vs Kohli in an IPL fixture is the matchup that IPL was accidentally designed around. Both are peerless. One of them bats.
3. [ARJUN] brought up '5 titles' once. [RAHUL] said 'defending champions.' They have been doing this for 6 months now.
4. MI 5 titles vs RCB 1 title — but [RAHUL] notes that RCB's 1 came 17 years into the tournament. The patience argument is genuinely strong.
5. Wankhede hosting the defending champions is [ARJUN]'s favourite fixture and his most stressful. Both true simultaneously.
6. [RAHUL] is insufferable in a new way since June 2025. [ARJUN] was already insufferable. This fixture is their natural habitat.

---

### MI vs KKR — *Franchise Heavyweights*
1. 5 titles vs 3 titles. The only IPL matchup where the silverware conversation goes two rounds before anyone flinches.
2. [ARJUN] and [DEEPA] in the group chat during this fixture is a case study in confident people refusing to acknowledge each other.
3. Phil Salt and Narine opening vs Bumrah new ball is the tactical matchup that should have its own preview segment.
4. Wankhede hosts KKR and the Eden faithful still somehow fill the away end audibly. Both fanbases travel. Both fanbases are loud.
5. MI bought Hardik back. KKR bought Phil Salt. Both spent real money on identified problems. Both had complicated seasons. Parallel paths.
6. [DEEPA]'s analysis of MI's bowling attack is correct, detailed, and deeply irritating to [ARJUN], who has checked the same numbers.

---

### MI vs DC — *The Academy Fixture*
1. DC develop them. MI sign them. Somehow this keeps happening. [VIKRAM] has stopped being surprised. He remains upset.
2. Rishabh Pant back in DC vs MI's resources is the fixture [VIKRAM] has been waiting to have standing on its feet again.
3. Bumrah bowling to DC's top order is [VIKRAM]'s weekly reminder that some matchups don't resolve in your favour regardless of belief.
4. MI 5 titles vs DC 0 titles. [ARJUN] has not said this out loud to [VIKRAM]. He also hasn't not said it. The implication is there.
5. MI found Bumrah. DC found Pant. One of those players stayed. [VIKRAM] has filed a formal objection with the universe.
6. '[VIKRAM] vs MI' is the fixture where [VIKRAM] says 'this time is different' and [ARJUN] nods respectfully and means none of it.

---

### MI vs SRH — *The Destroyer Visits*
1. SRH posted 277. MI's bowling team has watched the footage in full. Bumrah has watched the footage. Bumrah has questions.
2. Travis Head vs Bumrah in the powerplay is the specific matchup that makes IPL unmissable. Two absolutes. One over.
3. [ARJUN] picks MI for every match. [NISHA] picks SRH for every match. This match is the purest version of their disagreement.
4. 5 titles vs 2 titles — but SRH's batting in 2024-25 made the scoreboard irrelevant for at least 40 overs. [ARJUN] is aware.
5. Wankhede on a night MI are defending 185 against a team that scored 277 is [ARJUN]'s most honest prayer.
6. Heinrich Klaasen and Tim David in the same proximity of play is the T20 era in its most uncompromising form.

---

### MI vs RR — *The Empire vs Warne's Legacy*
1. Shane Warne built something at RR in 2008 that changed what IPL could be. MI built something in the 2010s that changed what winning looks like. Same tournament.
2. Yashasvi Jaiswal vs Bumrah is the matchup [KARAN]'s spreadsheet has a dedicated column for. The column is not optimistic.
3. 5 titles vs 2 titles. [KARAN]'s spreadsheet has this clearly tabulated. The numbers make him thoughtful, not defeated.
4. Wankhede is where [KARAN]'s RR picks go to die historically. He knows this. He picks them there anyway. [KARAN] is built different.
5. Sanju Samson in form against MI is the recipe for a match that covers 20 overs and ages 5 years.
6. [ARJUN] respects [KARAN]'s analysis. [ARJUN] also has 5 trophies. These facts are both present at all times.

---

### MI vs GT — *Old Empire vs New Power*
1. GT won more titles in 4 seasons than MI won in their first 8. [ARJUN] is aware. [SANA] has never once brought it up. This restraint is respected.
2. Hardik played for GT. Won 2 titles. Went to MI for sentiment. GT won again. [SANA] mentions this 'gently.' It is not gentle.
3. The Narendra Modi Stadium vs Wankhede — the world's largest cricket ground vs the world's most iconic. A genuinely unreasonable fixture.
4. [ARJUN] vs [SANA] in the group chat during this match is confidence meeting quiet confidence. Very quiet. Still winning.
5. Bumrah vs a GT batting lineup built on timing and calm is the T20 version of a chess problem with no clean answer.
6. MI trust experience. GT trust data. [ARJUN] trusts experience. [SANA] trusts data. The group chat has 10 minutes of silence after each over.

---

### MI vs PBKS — *Empire vs Heartbreak*
1. [ARJUN] brings 5 titles to this fixture. [MEERA] brings the 2025 runners-up medal and a very specific kind of determination.
2. PBKS beat MI in the 2025 playoffs on the way to the final. [MEERA] has this memorised. [ARJUN] has also memorised it.
3. Arshdeep Singh at Wankhede is [MEERA]'s best argument and [ARJUN]'s actual concern.
4. MI vs PBKS is the fixture where both teams have reasons for genuine confidence and neither team is wrong about their own reasons.
5. [MEERA] quietly picked PBKS to beat MI before it happened in 2025. [ARJUN] said nothing after. [MEERA] also said nothing. Mutual dignity.
6. [ARJUN] has 5 titles worth of patience. [MEERA] has 11 years worth of it. The suffering per unit is different. The depth is the same.

---

### MI vs LSG — *The Veterans vs the Newcomers*
1. MI 5 titles. LSG 0 titles. [ARJUN] is not condescending about this. [ROHAN] is not intimidated by it. The match happens anyway.
2. [ROHAN]'s LSG optimism vs [ARJUN]'s MI inevitability is the most productive tension in this group chat.
3. Bumrah at Ekana Stadium is [ROHAN]'s first experience of Bumrah being a problem. [ARJUN] has 5 titles of context for this.
4. LSG have never beaten MI in a high-pressure match. [ROHAN] notes this is a sample size issue. [ARJUN] agrees it's a size issue.
5. The Ekana crowd gives LSG a genuine home advantage. [ARJUN] has Wankhede. Both are valid. One has 5 trophies attached.
6. [ROHAN] predicts LSG every time against MI. He's been correct a non-zero number of times. [ARJUN] tracks the non-zero number.

---

### RCB vs KKR — *The Original Rivalry*
1. KKR beat RCB in the very first IPL match in 2008. [RAHUL] has been cooking a response for 17 years. The 2025 title was the serve.
2. 3 titles vs 1 title — but [RAHUL] notes that his 1 came in 2025 and [DEEPA]'s last was 2024. The recency is real.
3. Eden Gardens vs Chinnaswamy — two of the loudest 60,000-person environments in cricket. One match. Seismometers affected.
4. [DEEPA] has a measured response to [RAHUL]'s 2025 title energy. The measurement is approximately 3 titles to 1. She uses it sparingly.
5. Andre Russell facing Bhuvneshwar Kumar in the death is the contest that [RAHUL] has nightmares about and [DEEPA] schedules around.
6. 2024: KKR won, RCB went out in the qualifiers. 2025: RCB won the title. The ledger is being actively renegotiated.

---

### RCB vs PBKS — *The 2025 Final*
1. THE FINAL. June 3rd, 2025. RCB 190/9. PBKS 184/7. Six runs. Eighteen years on one side. Eleven years on the other. Shashank Singh's 61 off 30 balls wasn't enough. This fixture is permanently loaded.
2. [RAHUL] and [MEERA] in the same room during a replay of this match is a hostage situation that neither party asked for.
3. Two teams who'd never won. One final. One of them finally escaped. The other got Shashank Singh not out on 61 and an 18-year wait for someone else.
4. [RAHUL] says 'remember the final?' every time this fixture comes up in conversation. [MEERA] has muted three notifications since June.
5. PBKS played the cleanest cricket of the 2025 league stage. The final was 6 runs. [RAHUL] doesn't mention this in front of [MEERA]. He mentions it to everyone else.
6. Arshdeep Singh vs Josh Hazlewood in the last over of the 2025 IPL final was the single most dramatic passage of cricket the tournament has produced. [RAHUL] won. [MEERA] watched it end.

---

### RCB vs DC — *The South vs The Capital*
1. [RAHUL] and [VIKRAM] are the politest rivalry in this group. One has a title. One has been waiting since 2008. Both are aware.
2. RCB finally winning in 2025 while DC is still waiting is a timeline [VIKRAM] has processed multiple times from different angles.
3. Chinnaswamy vs Kotla is south India's passion vs Delhi's pride. [RAHUL] travels to both. [VIKRAM] has the season pass.
4. DC developed half of India's current batting lineup. [RAHUL] notes that Kohli was always RCB though. [VIKRAM] notes this is not the point.
5. [RAHUL] is respectful about DC's talent. He's also a 2025 champion. The respect has new texture since June.
6. 1 title vs 0 titles is not a conversation [RAHUL] starts with [VIKRAM]. It is, however, a conversation [RAHUL] finishes.

---

### RCB vs SRH — *Champions vs Destroyers*
1. RCB are the defending champions. SRH scored 277. These two facts are on a collision course that [RAHUL] is not fully comfortable with.
2. Travis Head at Chinnaswamy is [RAHUL]'s most complicated matchup. The stadium intimidates everyone. Travis Head has not confirmed this.
3. [RAHUL] and [NISHA] in the group chat during this fixture is two kinds of quiet confidence, one of which just won a title.
4. SRH's 2024-25 batting record vs RCB's 2025 title — the data says one thing, the trophy says another. [RAHUL] prefers the trophy conversation.
5. Bhuvneshwar Kumar vs RCB's top 3 is [NISHA]'s best argument. Kohli's record at home is [RAHUL]'s response. Both have spreadsheets.
6. Defending champion vs the team with the most destructive batting lineup in IPL history. [RAHUL] is excited. [NISHA] is also excited. Different reasons.

---

### RCB vs RR — *New Champions vs Old Royals*
1. 2008 and 2025 are the title years in this fixture. Warne's year vs Kohli's year. [KARAN] has a spreadsheet tab for this. [RAHUL] respects the spreadsheet.
2. Sanju Samson vs Virat Kohli is the closest thing to two people who deserve it equally being on opposite sides.
3. [RAHUL] and [KARAN] are the most statistically conversational rivalry in the group. This fixture is their annual debate.
4. RCB finally winning in 2025 while RR's 2022 run-up still stings — [KARAN] is genuinely pleased for [RAHUL]. He also notes RR were there in 2022.
5. Chinnaswamy vs Sawai Mansingh is two beautifully specific cricket atmospheres. The crowds are different. The passion is identical.
6. [KARAN]'s spreadsheet says RR match up well historically. [RAHUL]'s trophy says 2025 happened. Both are technically correct.

---

### RCB vs GT — *Champions vs the Quiet Ones*
1. GT beat RCB in the 2022 final. RCB won the whole tournament in 2025. [RAHUL] considers the arc complete. [SANA] considers it noted.
2. [RAHUL]'s volume about the 2025 title vs [SANA]'s complete silence about 2 GT titles is the most asymmetric conversation in the group.
3. Chinnaswamy at full noise vs GT's data-driven calm is the clash of philosophies that IPL was quietly built to produce.
4. [SANA] has never once brought up 2022 to [RAHUL]. [RAHUL] is grateful. [SANA] is waiting for the right moment.
5. 1 recent title vs 2 efficient titles — [RAHUL] notes the recency. [SANA] notes the count. Both continue the conversation indefinitely.
6. The defending champion vs the most efficient new franchise in IPL is the matchup that makes [ARJUN] angry because he's involved in neither.

---

### RCB vs LSG — *Champions vs the Optimists*
1. [RAHUL] has a title. [ROHAN] has pure optimism. This fixture is the philosophical debate made physical.
2. RCB winning in 2025 is, to [ROHAN], the proof that patience pays. He is using this as a motivational framework for LSG. [RAHUL] is flattered and slightly annoyed.
3. Chinnaswamy is the most intimidating home ground in IPL post-2025. [ROHAN] is not intimidated. [ROHAN] is never intimidated. See earlier notes.
4. [RAHUL] and [ROHAN] are the most cheerful rivalry in the group. One has a trophy. One has no scars. Both are fine with this.
5. 'We're a young franchise still building,' [ROHAN] says. [RAHUL] says 'we waited 18 years.' Both are correct. Neither is backing down.
6. The defending champions vs a team with nothing to lose is [RAHUL]'s most stressful kind of match and [ROHAN]'s most exciting.

---

### KKR vs DC — *Kolkata vs Delhi*
1. 3 titles vs 0 titles. [DEEPA] has this number memorised. [VIKRAM] also has it memorised. Different emotional relationship to the same number.
2. Eden Gardens hosting DC is 66,000 KKR fans and a very loud away contingent that [VIKRAM] has been part of at least once.
3. Phil Salt opening vs DC's new-ball bowling is [DEEPA]'s first question every time this fixture comes up. [VIKRAM] checks the same name.
4. [VIKRAM]'s DC vs [DEEPA]'s KKR is the group chat's most technically detailed rivalry. Both watch the same stat. See it differently.
5. DC gave the IPL some of its best players. KKR gave the IPL some of its best trophies. [VIKRAM] has the better contribution argument. [DEEPA] has the cabinet.
6. KKR vs DC in a knockout would be [DEEPA]'s most important pick and [VIKRAM]'s most expensive loss. The stakes are personal.

---

### KKR vs SRH — *Purple vs Orange*
1. KKR vs SRH is two teams who genuinely believe they have the better batting lineup. Both are, troublingly, correct.
2. [DEEPA] and [NISHA] have been loudly disagreeing about this fixture since February and the season hasn't started yet.
3. Phil Salt and Travis Head both opening in the same fixture is a combined problem for any spinner asked to bowl the first 6 overs.
4. SRH's 277 was scored against a very good bowling attack. [DEEPA] watched it. She took notes. She has a plan.
5. 3 KKR titles vs 2 SRH titles — the trophy conversation is unusually balanced for a rivalry that is this loud.
6. Narine vs Bhuvneshwar in the powerplay is [DEEPA]'s favourite and [NISHA]'s calmest conversation every time this fixture arrives.

---

### KKR vs RR — *Eden vs Jaipur*
1. Eden Gardens vs Sawai Mansingh is two historically loud grounds in one fixture. [DEEPA] and [KARAN] have both been to both.
2. [DEEPA]'s statistical approach vs [KARAN]'s 'statistically sound with emotional richness' — this is the most interesting methodology clash in the group.
3. 3 titles vs 2 titles is the most balanced-ish trophy conversation KKR can have. [DEEPA] respects it. She doesn't mention it first.
4. Andre Russell vs Sanju Samson is the matchup [KARAN] has a dedicated tab for and [DEEPA] approaches with genuine respect.
5. Rinku Singh batting for KKR vs RR's bowling in death overs is [DEEPA]'s scenario and [KARAN]'s anxiety together.
6. The pink army away at Eden is loud. Eden is louder. [KARAN] knows this. He goes anyway. [DEEPA] appreciates the commitment.

---

### KKR vs GT — *The New Powers*
1. KKR's 2024 title vs GT's 2022 and 2023 titles — the most recent trophy conversation in IPL, shared between [DEEPA] and [SANA].
2. [DEEPA] and [SANA] are the two most analytically composed fans in the group. This fixture is the calm eye of the group chat storm.
3. Phil Salt vs GT's disciplined bowling lineup in the powerplay is the matchup [SANA] has specifically prepared for.
4. 3 titles vs 2 titles — the closest any two fans in this group come to an even-handed trophy conversation.
5. Eden Gardens vs Narendra Modi Stadium is two genuinely enormous grounds. The crowds are different in character. The intensity matches.
6. [DEEPA] and [SANA] have the same temperature about their teams winning. Very calm. Very detailed. Devastating to argue with.

---

### KKR vs PBKS — *Kolkata vs the Nearly Team*
1. [DEEPA] has 3 titles. [MEERA] has the 2025 final. The gap is precise and [MEERA] knows exactly what it is.
2. [DEEPA] is the only person in the group who has never said an unkind thing about [MEERA]'s PBKS loyalty. [MEERA] has noted this.
3. Eden Gardens is loud. The PBKS away fans are also loud. This fixture is one of the louder ones and neither fan acknowledges the other's noise.
4. Arshdeep Singh vs KKR's top order is [MEERA]'s most confident argument. [DEEPA] has Andre Russell. The conversation goes in circles.
5. KKR's 2024 title vs PBKS's 2025 final appearance — the closest [MEERA] has come to [DEEPA]'s world. [DEEPA] is respectful about this gap.
6. [DEEPA]'s KKR vs [MEERA]'s PBKS is the fixture where [DEEPA] almost says something and [MEERA] almost asks her not to.

---

### KKR vs LSG — *The Established vs the Arrivals*
1. [DEEPA]'s KKR have 3 titles. [ROHAN]'s LSG have existed for 3 seasons. The comparison is brief.
2. [ROHAN] is entirely unbothered by this fact. [DEEPA] finds his lack of concern mildly suspicious.
3. Eden at full capacity vs Ekana at full capacity — [DEEPA] wins the venue history argument. [ROHAN] wins the optimism one.
4. [DEEPA] and [ROHAN] is the most educational rivalry in the group. [DEEPA] explains things. [ROHAN] asks questions. [ROHAN] gets better.
5. LSG have beaten KKR in normal matches. [DEEPA] is aware of the sample. The trophy cabinet adjusts the sample weight.
6. 3 titles and a KKR fan's confidence vs 0 titles and an LSG fan's innocence — this is a very specific IPL flavour.

---

### DC vs SRH — *Delhi vs Hyderabad*
1. [VIKRAM] and [NISHA] are the two quietest fans in the group. This fixture is 40 overs of composed suffering and composed certainty.
2. SRH's batting lineup vs DC's developing bowling attack is [VIKRAM]'s most educational fixture and [NISHA]'s most comfortable.
3. Travis Head in Delhi is [VIKRAM]'s problem. Bumrah in Hyderabad is [NISHA]'s problem. Neither is fully solved.
4. 0 titles vs 2 titles and a batting world record. [VIKRAM] is tracking the score. [NISHA] is tracking the run rate.
5. [NISHA]'s complete calm during a SRH vs DC match is [VIKRAM]'s most disorienting experience in the group chat.
6. DC develops players who might one day score 277. [NISHA] is fine with DC developing them. She's fine with SRH using them differently.

---

### DC vs RR — *Two Waitings*
1. DC 0 titles since 2008. RR 2 titles but waiting since 2022. [VIKRAM] and [KARAN] share the longest unmet expectation in the group.
2. The only rivalry in this group where both sides have genuine mutual respect for the suffering. [VIKRAM] and [KARAN] nod at each other during this fixture.
3. Sanju Samson vs DC's bowling is [KARAN]'s best argument. Rishabh Pant back in a DC jersey is [VIKRAM]'s.
4. [KARAN]'s spreadsheet has a DC column. He doesn't show [VIKRAM]. [VIKRAM] would probably agree with the cells.
5. Sawai Mansingh vs Kotla is two beautiful grounds with deeply specific cricket cultures. Both produce suffering fans. Both produce loyal ones.
6. '[VIKRAM] and [KARAN] are the people in the group who would be friends regardless of cricket,' [PRIYA] once said. Both immediately disagreed about the current match.

---

### DC vs GT — *The Development Academy vs the Titans*
1. DC developed players. GT used their development system efficiently. [VIKRAM] sees the pattern. [SANA] sees the results.
2. [SANA]'s GT vs [VIKRAM]'s DC is the match where quiet competence meets quiet patience. The group chat volume is mysteriously low.
3. 0 titles vs 2 titles in 4 seasons. [VIKRAM] has 17 years of IPL fandom. [SANA]'s GT has 4. The per-season efficiency is [VIKRAM]'s nightmare.
4. GT's bowling lineup vs DC's batting development is the fixture [SANA] previews and [VIKRAM] tries not to read before it happens.
5. [VIKRAM] respects GT's process. He respects it deeply. He respects it from a painful distance.
6. 'They're a very well-run franchise,' [VIKRAM] says about GT, the way you describe a rival who is simply better at the thing you love.

---

### DC vs LSG — *Two Waiting Rooms*
1. 0 titles for DC. 0 titles for LSG. [VIKRAM] has 17 years of waiting. [ROHAN] has 3 seasons of not waiting yet. Different relationship to the same result.
2. [VIKRAM] and [ROHAN] are the most productive mentorship in the group. [VIKRAM] explains what suffering feels like. [ROHAN] takes notes optimistically.
3. DC's experience of 'almost' vs LSG's experience of 'not yet' is the same destination from very different roads.
4. [ROHAN] asks [VIKRAM] for predictions. [VIKRAM] gives them honestly. [VIKRAM] is incorrect at the same rate as [ROHAN]. Neither mentions this.
5. Kotla vs Ekana — [VIKRAM] has been to Kotla since it was Feroz Shah Kotla. [ROHAN] has been to Ekana twice.
6. The most neutral rivalry in the group. No trophies to deploy. No recent finals. Just two fans picking their sides.

---

### SRH vs RR — *The Orange and the Pink*
1. SRH's batting machine vs RR's balanced development model is the fixture [NISHA] approaches scientifically and [KARAN] approaches with his spreadsheet.
2. [NISHA] and [KARAN] are the two most data-comfortable fans in the group. This match is the nerdiest preview conversation in the group chat.
3. Travis Head vs RR's disciplined bowling is [KARAN]'s most challenging column. [NISHA] is aware he has a column.
4. 2 SRH titles vs 2 RR titles — the most genuinely balanced trophy conversation in IPL for non-CSK/MI fans.
5. Sawai Mansingh vs Uppal — two specific cricket atmospheres in different corners of India. Both loud. Both loyal.
6. [NISHA] picks SRH. [KARAN] picks RR. Both are statistically-informed decisions. One of them is also backed by a spreadsheet. The other is backed by Heinrich Klaasen.

---

### SRH vs PBKS — *Orange vs the Runners-Up*
1. SRH's batting lineup vs PBKS's 2025 form is the matchup [NISHA] and [MEERA] have the most specific disagreement about.
2. [MEERA] made it to the 2025 final. [NISHA]'s SRH went out in the knockouts. Neither has fully mentioned this to the other.
3. Arshdeep Singh vs Travis Head is [MEERA]'s opening argument and [NISHA]'s most uncomfortable answer.
4. PBKS's 2025 final run vs SRH's regular-season batting dominance — different kinds of peak. [NISHA] and [MEERA] measure peak differently.
5. 2 SRH titles vs 0 PBKS titles — [NISHA] doesn't bring this up. [MEERA] already knows. The silence is respectful.
6. Uppal vs Mohali is two of the more passionate home crowds in IPL. [NISHA] is calm about Uppal. [MEERA] is emotional about Mohali. Always.

---

### SRH vs GT — *The Efficient Ones*
1. SRH's batting world record vs GT's bowling efficiency is the fixture [NISHA] and [SANA] have quietly been looking forward to since February.
2. [NISHA] and [SANA] in the group chat during this match is the longest the group has gone without a take that [ARJUN] needs to respond to.
3. 2 SRH titles vs 2 GT titles. The most evenly titled matchup outside the CSK-MI axis. [NISHA] and [SANA] acknowledge this symmetry.
4. Travis Head vs GT's disciplined bowling in the powerplay is the specific matchup [SANA] has a tab for and [NISHA] is watching from behind her hands.
5. Both teams trust the process. Both teams deliver. [NISHA] trusts the 277. [SANA] trusts the 2 titles. Neither is unreasonable.
6. The quietest rivalry preview in the group chat. [NISHA] and [SANA] pick their teams. Both nod. The match happens.

---

### SRH vs LSG — *Orange vs the Newcomers*
1. SRH scored 277. LSG's bowling attack has watched this. [ROHAN] has watched this. [ROHAN] remains optimistic. We respect this.
2. [NISHA] is calm about every SRH fixture. [ROHAN] is optimistic about every LSG fixture. The group chat temperature during this: surprisingly pleasant.
3. Travis Head at Ekana is [ROHAN]'s first experience of Travis Head being a personal problem. [NISHA] watches him process this.
4. 2 SRH titles vs 0 LSG titles. [NISHA] doesn't mention this. [ROHAN] doesn't ask. They watch cricket together in peace.
5. LSG's home crowd at Ekana is genuinely loud. It was not designed to contain Travis Head in the first 6 overs.
6. [ROHAN] predicts LSG. [NISHA] predicts SRH. One of them has Heinrich Klaasen. The other has belief. One factor outweighs.

---

### RR vs PBKS — *Two Waiting Rooms (Romantic Edition)*
1. [KARAN] and [MEERA] share the group's deepest mutual understanding of what sustained hope feels like. This match is their annual reckoning.
2. 2 RR titles (2008, 2022) vs 0 PBKS titles (and a 2025 final). [KARAN]'s spreadsheet has a column for distance to title. [MEERA] has checked it.
3. Sanju Samson vs Shreyas Iyer is the two captains who carried their teams on belief and batting. [KARAN] and [MEERA] appreciate them the same way.
4. The pink army vs the red army — Jaipur and Mohali are two of the most specific, loyal fanbases in India. Both cheer loudly. Both wait patiently.
5. [KARAN] and [MEERA] have never argued about cricket. They have had many long, detailed discussions. None of them resolved quickly.
6. After the 2025 final, [KARAN] sent [MEERA] a message. [MEERA] replied. Neither has shared what was said. Both smiled.

---

### RR vs GT — *2022 Final Redux*
1. GT beat RR in the 2022 IPL final. [KARAN] has processed this. He has processed it thoroughly. Multiple tabs on the spreadsheet.
2. [SANA] has never mentioned 2022 unprompted to [KARAN]. [KARAN] appreciates this. [SANA] is waiting for a different moment.
3. Sanju Samson vs Shubman Gill is the individual contest [KARAN] builds the entire preview around. [SANA] builds around the bowling.
4. 2 GT titles vs 2 RR titles — the most emotionally loaded equal scoreline in IPL. [KARAN] and [SANA] are very careful around it.
5. [KARAN]'s spreadsheet has a 2022 tab. [SANA] has seen the tab. Neither acknowledges the tab directly.
6. 'The 2022 final was a long time ago,' [SANA] said once. [KARAN] agreed. They both know exactly how long ago it was.

---

### RR vs LSG — *The Veterans vs the Newcomers (Gentle Edition)*
1. [KARAN] has been watching IPL since 2008. [ROHAN] joined in 2022. [KARAN] enjoys this fixture as a kind of mentorship exercise.
2. RR's development model is something [ROHAN] secretly admires. LSG also has a development model. [KARAN] thinks it's too new to evaluate fairly.
3. 2 RR titles vs 0 LSG titles. [KARAN] doesn't use this. [ROHAN] doesn't ask about it. They watch cricket.
4. Sanju Samson in form against LSG's bowling is [KARAN]'s prediction and [ROHAN]'s problem. It is a specific and recurring problem.
5. [ROHAN]'s unbothered energy vs [KARAN]'s deeply considered analysis is the most educational fixture in the group for everyone watching them.
6. [KARAN] explains things to [ROHAN] during this match. [ROHAN] listens. [ROHAN] then picks LSG. [KARAN] smiles. [ROHAN] learns.

---

### PBKS vs GT — *The 2025 Final Losers vs the Two-Time Champions*
1. [MEERA] reached the 2025 final. [SANA]'s GT won it in previous seasons. Neither mentions the other's closest achievement unprompted.
2. GT 2 titles vs PBKS 0 titles — but [MEERA] notes that PBKS was in the final in 2025 and GT wasn't. [SANA] nods. Notes filed.
3. [SANA] is supportive of [MEERA]'s PBKS loyalty. She has watched the suffering. She respects its duration.
4. Shreyas Iyer's captaincy in 2025 was impressive enough that [SANA] added a column for it. [MEERA] is proud of this recognition.
5. The 2025 final loss to RCB happened. [MEERA] is processing. [SANA] gives [MEERA] the space to process. This is the dynamic.
6. [SANA] and [MEERA] in the group chat during this fixture is two calm people rooting for different outcomes. The calmest 40 overs in the chat.

---

### PBKS vs LSG — *Two Teams Still Waiting*
1. 0 titles each. [MEERA] has 11 years of perspective on that. [ROHAN] has 3. They discuss it in very different ways.
2. [MEERA]'s '2025 runners-up' vs [ROHAN]'s 'we've made the knockouts' — the closest either gets to a comparative advantage in this match.
3. Arshdeep Singh vs LSG's batting is [MEERA]'s best card. [ROHAN] is aware. [ROHAN] is prepared. [ROHAN] is optimistic anyway.
4. [MEERA] gives [ROHAN] honest advice before this fixture. [ROHAN] takes it gratefully and then picks LSG regardless.
5. Mohali vs Ekana is two modern IPL venues with passionate new-generation fanbases. Both are loud. [MEERA] has been to both.
6. 'Both teams need this win,' the commentator says. [MEERA] and [ROHAN] nod at the screen from different cities. They are both correct.

---

### GT vs LSG — *The Two New Teams*
1. GT since 2022: 2 titles. LSG since 2022: consistent knockouts, 0 titles. [SANA] and [ROHAN] are the same age of franchise having very different conversations.
2. [SANA]'s GT started exactly when [ROHAN]'s LSG started. [SANA] has 2 trophies. [ROHAN] has questions. [SANA] has answers. [SANA] waits to be asked.
3. Both franchises entered the IPL in 2022 with no history and immediately started competing. One of them then won twice. [ROHAN] is aware of which one.
4. [ROHAN] asks [SANA] what GT does differently. [SANA] explains it once, clearly, without repeating herself. [ROHAN] nods. Picks LSG. [SANA] expected this.
5. Narendra Modi Stadium vs Ekana is two of the newest IPL venues, both enormous, both loud, both representing cities that take their cricket personally.
6. [SANA] and [ROHAN] are genuinely friends. The 2 titles vs 0 titles sits quietly between them. [ROHAN] is going to fix it one day. [SANA] believes he might.

---

## Section 5: Chaos Ball — Selected Copy

*Yes/No, +12 correct, 0 wrong. Used as one-liner above the yes/no toggle.*

### Sample phrasings (rotate these templates):
- "Will there be a golden duck today?" → *"One batter. First ball. Zero runs. [ARJUN] said no."*
- "Will there be a wide in the first over?" → *"Someone always bowls a wide first over. [PRIYA] says yes. She says yes every time."*
- "Will a DRS review overturn the on-field decision?" → *"[DEEPA] has been tracking DRS overturn rates across all 2025 matches. She has picked accordingly."*
- "Will the top scorer be an opener?" → *"The opener theory. [KARAN] has a tab on this. He's shared it with nobody."*

---

## Section 6: Villain Pick

*Once per match, pick a batter to score under 10. +15 if correct. −5 if they score 30+.*

### Villain Pick selected:
*"Villain locked: {PLAYER}. [ARJUN] villain-picked someone different. May the worse prediction win."*

### Villain Pick correct:
*"{PLAYER} scored {X}. Under 10. +15. The villain narrative delivered. [MEERA] has been sending messages."*

### Villain Pick — scored 30+:
*"{PLAYER} scored {X}. −5 pts. The villain got away. [RAHUL] villain-picked the same player and is also reflecting."*

### Villain Pick — scored 10–29 (neutral):
*"{PLAYER} scored {X}. Not under 10. Not 30+. No points. No penalty. An unsatisfying resolution for everyone."*

---

## Section 7: Leaderboard Banter

### After each match, one contextual line appears per player on the leaderboard:
| Situation | Copy |
|-----------|------|
| Leader | "Top of the table. {N} pts clear of [ARJUN]. [ARJUN] is doing maths." |
| Moved up | "Up {N} places after that match. [DEEPA] is recalculating." |
| Moved down | "Down {N} places. It's early. [PRIYA] will not let you forget." |
| Equal on points | "Dead level with [KARAN]. Head-to-head record is the tiebreaker. H2H record is not in your favour." |
| H2H lead | "Leading [RAHUL] by {N} points this cycle. {N} matches left to hold it." |
| H2H behind | "Down {N} to [MEERA] this cycle. {N} matches left to recover." |
| Season picks carrying | "{N}% of your total is from Season Picks. The match grind hasn't started. Or it has and this is concerning." |
| Match grinder | "{N} matches played. Most in the group. [VIKRAM] appreciates the commitment." |
| Perfect match | "47/47 on that match. Maximum possible. [ARJUN] is checking if this has happened before." |

---

## Section 8: Season Picks Copy

*Used in the Season tab and at season end when predictions resolve.*

### Pre-Tournament (filling out picks)
| State | Copy |
|-------|------|
| Season Picks open | "Season Picks are open. 7 predictions. One shot. Lock them before Match 1." |
| Partially filled | "You've filled {N} of 7. The rest aren't going to pick themselves. [PRIYA] finished hers in February." |
| All filled, not locked | "All 7 filled. Review them. Once you lock, they're permanent. Like [ARJUN]'s opinions." |
| Locked | "Season Picks locked 🔒 See you at the end of the tournament." |
| Everyone locked | "Everyone's Season Picks are locked. 7 predictions each. At least one of you is going to be embarrassed." |

### Pick Confirmation Lines
| Pick | Copy |
|------|------|
| Champion — popular pick | "You and {N} others picked {TEAM}. Safe. Consensus. No contrarian bonus if it lands." |
| Champion — solo pick | "Only you picked {TEAM} to win it all. If this lands, the group will hear about it forever." |
| Wooden Spoon — strong team | "You picked {TEAM} for Wooden Spoon. That's a take. [DEEPA] has flagged this for later." |
| Wooden Spoon — expected pick | "{TEAM} for Wooden Spoon. The group agrees. No contrarian bonus here." |
| Orange/Purple Cap — consensus player | "Everyone's picking {PLAYER}. You'll need your other two picks to stand out." |
| Orange/Purple Cap — contrarian player | "Nobody else picked {PLAYER}. 2× if this lands. [KARAN] has a spreadsheet argument against it." |
| Top 4 — all favourites | "Four favourites for Top 4. Safe. Correct. Boring. [ROHAN] went rogue on his." |
| Top 4 — including underdog | "You put {TEAM} in the Top 4. [MEERA] appreciates the faith." |

### Season End — Results
| Outcome | Copy |
|---------|------|
| Champion correct | "You called the Champion. {TEAM}. +200 pts. The group can verify this was locked before Match 1." |
| Champion wrong | "{TEAM} didn't win it. +0. [ARJUN] also got this wrong. Cold comfort." |
| Top 4 — 4 of 4 | "All four playoff teams correct. +120. [DEEPA] called 3. You called 4. This matters." |
| Top 4 — 3 of 4 | "3 of 4 playoff teams. +90. The one you missed — everyone missed that one." |
| Wooden Spoon — solo correct | "You were the only one who picked {TEAM} for Wooden Spoon. 2× bonus. +100 pts. Ruthless and correct." |
| Wooden Spoon — consensus correct | "{TEAM} finished last. Everyone saw it coming. +50 pts. No bonus for consensus." |
| Orange/Purple Cap — exact solo | "{PLAYER} won the {CAP}. You were the only one who picked them. 2× bonus. Screenshot this." |
| Orange/Purple Cap — top 3 hit | "{PLAYER} finished top 3 in {STAT}. Half credit. {MULTIPLIER} contrarian bonus. +{N} pts." |
| Orange/Purple Cap — top 5 hit | "{PLAYER} finished top 5. Quarter credit. It's something. [KARAN] got closer." |
| Season total revealed | "Season Picks total: {N} pts. {PERCENTAGE}% of your overall score. The rest is match grind." |

### Season Prediction Tracker (mid-season, shown on Season tab)
| State | Copy |
|-------|------|
| Champion pick leading | "Your Champion pick ({TEAM}) is top of the table. Early days. [PRIYA] is watching." |
| Champion pick struggling | "Your Champion pick ({TEAM}) is {POSITION} on the table. There's time. There's always time." |
| Orange Cap pick in top 3 | "Your Orange Cap pick ({PLAYER}) is currently {POSITION} in run-scoring. Tracking nicely." |
| Orange Cap pick outside top 10 | "{PLAYER} is {POSITION} in run-scoring. The Orange Cap is not tracking. [DEEPA] has noticed." |
| Wooden Spoon pick at bottom | "Your Wooden Spoon pick ({TEAM}) is currently last. You monster. +{POTENTIAL} pts if it holds." |
| Wooden Spoon pick doing well | "Your Wooden Spoon pick ({TEAM}) is in the top 4. The villain arc has collapsed." |

---

## Section 9: Post-Match Reveal Copy

*Lines used on the reveal screen after each match. The reveal is the centrepiece — every line should feel like a group chat message, not a data table.*

### Group Split (shown for Match Winner and The Call)
| Split | Copy |
|-------|------|
| Unanimous correct | "All {N} of you picked {TEAM}. All correct. No bragging rights when everyone's right." |
| Unanimous wrong | "All {N} of you picked {TEAM}. All wrong. Group therapy available in the chat." |
| Even split | "{N} picked {TEAM_A}. {N} picked {TEAM_B}. {TEAM_A} won. Half of you are celebrating. The other half are composing messages." |
| Lone correct | "Only [ARJUN] picked {TEAM}. [ARJUN] was correct. [ARJUN] will not be quiet about this." |
| Lone wrong | "Everyone got it except [VIKRAM]. [VIKRAM] is available for questions." |
| Majority wrong | "{N} of you picked {TEAM}. {TEAM} lost. The minority was right. [SANA] said nothing. She never does." |

### Villain Pick Reveal
| Outcome | Copy |
|---------|------|
| Multiple same villain | "[ARJUN] and [PRIYA] both villain-picked {PLAYER}. {PLAYER} scored {X}. Both {OUTCOME}." |
| Nobody villain-picked | "Nobody used their Villain Pick tonight. The group chose peace. For once." |
| Someone villain-picked a star | "[RAHUL] villain-picked {PLAYER}. {PLAYER} scored {X}. [RAHUL] is reflecting on his choices." |

### Match Summary Line (one line per player, shown on leaderboard update)
| Score Range | Copy |
|-------------|------|
| 40+ pts | "[NAME] — {N} pts. Near-perfect. The group has questions." |
| 25–39 pts | "[NAME] — {N} pts. Solid night. The kind of match that wins seasons." |
| 10–24 pts | "[NAME] — {N} pts. Respectable. Not memorable. Fine." |
| 1–9 pts | "[NAME] — {N} pts. It's a long season. That's all we'll say." |
| 0 pts | "[NAME] — 0 pts. We are choosing not to comment at this time." |
| Negative | "[NAME] — {N} pts. The Villain Pick giveth and the Villain Pick taketh away." |

---

*End of Banter Library (MVP). All placeholder names ([ARJUN], [PRIYA] etc.) to be replaced with actual group member names at onboarding.*
