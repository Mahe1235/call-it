/**
 * seedTestData.js
 *
 * Populates the DB with 6 completed + 2 upcoming test matches, 4 test users,
 * predictions, scorecards, and computed match_scores — so every app flow
 * can be tested end-to-end.
 *
 * Usage:
 *   node scripts/seedTestData.js          # seed everything (idempotent)
 *   node scripts/seedTestData.js --reset  # delete all test data
 *
 * ⚠️  REMOVE THIS FILE (and run --reset) before the real IPL 2026 season starts.
 */

import { config } from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { createClient } from '@supabase/supabase-js'
import { scoreMatchCard } from '../src/lib/scoring.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: join(__dirname, '..', '.env.local') })

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// ─── Test match numbers (safely above real IPL range of 1–74) ─────────────────

const TEST_MATCH_NUMBERS = [90, 91, 92, 93, 94, 95, 96, 97, 98]
const COMPLETED_MATCH_NUMBERS = [90, 91, 92, 93, 94, 95]

// ─── Fixed user IDs ───────────────────────────────────────────────────────────

const USERS = {
  rahul: 'a0000000-0000-0000-0000-000000000001',
  priya: 'a0000000-0000-0000-0000-000000000002',
  karan: 'a0000000-0000-0000-0000-000000000003',
  sneha: 'a0000000-0000-0000-0000-000000000004',
}

// Same jersey generator as src/lib/avatars.js (duplicated to avoid ESM import issues in scripts)
function makeJersey(number, jerseyColor, stripeColor, textColor = '#ffffff') {
  const svg = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <circle cx="50" cy="50" r="50" fill="${jerseyColor}" opacity="0.15"/>
  <path d="M 36,28 L 22,20 L 8,40 L 21,46 L 21,82 L 79,82 L 79,46 L 92,40 L 78,20 L 64,28 Q 57,20 50,23 Q 43,20 36,28 Z" fill="${jerseyColor}"/>
  <path d="M 8,40 L 21,46 L 21,58 L 8,52 Z" fill="${stripeColor}" opacity="0.7"/>
  <path d="M 92,40 L 79,46 L 79,58 L 92,52 Z" fill="${stripeColor}" opacity="0.7"/>
  <path d="M 36,28 Q 50,36 64,28" fill="none" stroke="${stripeColor}" stroke-width="3" stroke-linecap="round"/>
  <text x="50" y="66" text-anchor="middle" dominant-baseline="middle" font-family="Arial Black, Impact, sans-serif" font-weight="900" font-size="${number > 9 ? '26' : '30'}" fill="${textColor}" letter-spacing="-1">${number}</text>
</svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

const TEST_USERS = [
  { id: USERS.priya, email: 'priya@called-it.test', password: 'test1234', display_name: 'Priya', team: 'csk', is_admin: false, avatar_url: makeJersey(7,  '#F9CD1B', '#1D3461', '#111111') }, // Dhoni #7
  { id: USERS.karan, email: 'karan@called-it.test', password: 'test1234', display_name: 'Karan', team: 'mi',  is_admin: false, avatar_url: makeJersey(45, '#004BA0', '#D4AF37') },             // Rohit #45
  { id: USERS.sneha, email: 'sneha@called-it.test', password: 'test1234', display_name: 'Sneha', team: 'gt',  is_admin: false, avatar_url: makeJersey(77, '#1C3A6B', '#D4AF37') },             // Gill #77
]

// ─── Match definitions ────────────────────────────────────────────────────────

const now = Date.now()
const past   = (d) => new Date(now - d * 86_400_000).toISOString()
const future = (d) => new Date(now + d * 86_400_000).toISOString()

const MATCH_DEFS = {
  90: { status: 'completed', winner: 'rcb',  team_a: 'rcb',  team_b: 'mi',   venue: 'chinnaswamy',   date: past(20)  },
  91: { status: 'completed', winner: 'csk',  team_a: 'csk',  team_b: 'kkr',  venue: 'chepauk',       date: past(17)  },
  92: { status: 'completed', winner: 'gt',   team_a: 'gt',   team_b: 'lsg',  venue: 'narendra_modi', date: past(14)  },
  93: { status: 'completed', winner: 'srh',  team_a: 'srh',  team_b: 'rr',   venue: 'rajiv_gandhi',  date: past(10)  },
  94: { status: 'completed', winner: 'pbks', team_a: 'mi',   team_b: 'pbks', venue: 'wankhede',      date: past(7)   },
  95: { status: 'completed', winner: 'kkr',  team_a: 'kkr',  team_b: 'csk',  venue: 'eden_gardens',  date: past(3)   },
  96: { status: 'upcoming',  winner: null,   team_a: 'rcb',  team_b: 'gt',   venue: 'chinnaswamy',   date: future(2) },
  97: { status: 'upcoming',  winner: null,   team_a: 'csk',  team_b: 'mi',   venue: 'chepauk',       date: future(5) },
  98: { status: 'live',      winner: null,   team_a: 'srh',  team_b: 'dc',   venue: 'rajiv_gandhi',  date: past(0)   },
}

// ─── Questions ────────────────────────────────────────────────────────────────

const QUESTION_DEFS = {
  90: {
    call:  { type: 'the_call',   question_id: 'C1', display_text: 'Total sixes in this match',                        answer_options: ['Over 13', 'Under 13'], correct_answer: 'Over 13' },
    chaos: { type: 'chaos_ball', question_id: 'CB3', display_text: 'Will the match go to the last over?',              answer_options: ['Yes', 'No'],           correct_answer: 'Yes'     },
  },
  91: {
    call:  { type: 'the_call',   question_id: 'C2', display_text: 'Which team will score more runs in the powerplay?', answer_options: ['CSK', 'KKR'],          correct_answer: 'CSK'     },
    chaos: { type: 'chaos_ball', question_id: 'CB3', display_text: 'Will the match go to the last over?',              answer_options: ['Yes', 'No'],           correct_answer: 'No'      },
  },
  92: {
    call:  { type: 'the_call',   question_id: 'C4', display_text: 'Top scorer of the match plays for which team?',     answer_options: ['GT', 'LSG'],           correct_answer: 'GT'      },
    chaos: { type: 'chaos_ball', question_id: 'CB3', display_text: 'Will the match go to the last over?',              answer_options: ['Yes', 'No'],           correct_answer: 'Yes'     },
  },
  93: {
    call:  { type: 'the_call',   question_id: 'C2', display_text: 'Which team will score more runs in the powerplay?', answer_options: ['SRH', 'RR'],           correct_answer: 'SRH'     },
    chaos: { type: 'chaos_ball', question_id: 'CB3', display_text: 'Will the match go to the last over?',              answer_options: ['Yes', 'No'],           correct_answer: 'Yes'     },
  },
  94: {
    call:  { type: 'the_call',   question_id: 'C2', display_text: 'Which team will score more runs in the powerplay?', answer_options: ['MI', 'PBKS'],          correct_answer: 'PBKS'    },
    chaos: { type: 'chaos_ball', question_id: 'CB3', display_text: 'Will the match go to the last over?',              answer_options: ['Yes', 'No'],           correct_answer: 'No'      },
  },
  95: {
    call:  { type: 'the_call',   question_id: 'C4', display_text: 'Top scorer of the match plays for which team?',     answer_options: ['KKR', 'CSK'],          correct_answer: 'KKR'     },
    chaos: { type: 'chaos_ball', question_id: 'CB3', display_text: 'Will the match go to the last over?',              answer_options: ['Yes', 'No'],           correct_answer: 'Yes'     },
  },
  96: {
    call:  { type: 'the_call',   question_id: 'C1', display_text: 'Total sixes in this match',                        answer_options: ['Over 13', 'Under 13'], correct_answer: null      },
    chaos: { type: 'chaos_ball', question_id: 'CB3', display_text: 'Will the match go to the last over?',              answer_options: ['Yes', 'No'],           correct_answer: null      },
  },
  97: {
    call:  { type: 'the_call',   question_id: 'C2', display_text: 'Which team will score more runs in the powerplay?', answer_options: ['CSK', 'MI'],           correct_answer: null      },
    chaos: { type: 'chaos_ball', question_id: 'CB3', display_text: 'Will the match go to the last over?',              answer_options: ['Yes', 'No'],           correct_answer: null      },
  },
  98: {
    call:  { type: 'the_call',   question_id: 'C1', display_text: 'Total sixes in this match',                        answer_options: ['Over 13', 'Under 13'], correct_answer: null      },
    chaos: { type: 'chaos_ball', question_id: 'CB3', display_text: 'Will the match go to the last over?',              answer_options: ['Yes', 'No'],           correct_answer: null      },
  },
}

// ─── Scorecards ───────────────────────────────────────────────────────────────
// villain: runs>30 OR wkts>=2 → impact (-5) | runs<10 AND wkts=0 → flopped (+15) | else neutral (0)

const SCORECARDS = {
  90: [
    { name: 'Virat Kohli',      runs: 65, wickets: 0, balls: 42 }, // impact  -5
    { name: 'Glenn Maxwell',    runs: 45, wickets: 0, balls: 28 }, // impact  -5
    { name: 'Rohit Sharma',     runs: 8,  wickets: 0, balls: 10 }, // flopped +15
    { name: 'Hardik Pandya',    runs: 25, wickets: 1, balls: 18 }, // neutral  0
    { name: 'Jasprit Bumrah',   runs: 2,  wickets: 3, balls: 5  }, // impact  -5
    { name: 'Suryakumar Yadav', runs: 38, wickets: 0, balls: 22 }, // impact  -5
    { name: 'Tilak Varma',      runs: 31, wickets: 0, balls: 25 }, // impact  -5
  ],
  91: [
    { name: 'Ruturaj Gaikwad',    runs: 88, wickets: 0, balls: 55 }, // impact  -5
    { name: 'MS Dhoni',           runs: 5,  wickets: 0, balls: 6  }, // flopped +15
    { name: 'Moeen Ali',          runs: 15, wickets: 1, balls: 12 }, // neutral  0
    { name: 'Andre Russell',      runs: 32, wickets: 2, balls: 15 }, // impact  -5
    { name: 'Rinku Singh',        runs: 7,  wickets: 0, balls: 8  }, // flopped +15
    { name: 'Varun Chakravarthy', runs: 0,  wickets: 3, balls: 4  }, // impact  -5
  ],
  92: [
    { name: 'Shubman Gill',    runs: 75, wickets: 0, balls: 48 }, // impact  -5
    { name: 'Nicholas Pooran', runs: 7,  wickets: 0, balls: 9  }, // flopped +15
    { name: 'Rashid Khan',     runs: 2,  wickets: 4, balls: 6  }, // impact  -5
    { name: 'KL Rahul',        runs: 20, wickets: 0, balls: 18 }, // neutral  0
    { name: 'Quinton de Kock', runs: 42, wickets: 0, balls: 30 }, // impact  -5
    { name: 'David Miller',    runs: 33, wickets: 0, balls: 22 }, // impact  -5
  ],
  93: [
    { name: 'Abhishek Sharma', runs: 65, wickets: 0, balls: 38 }, // impact  -5
    { name: 'Pat Cummins',     runs: 2,  wickets: 4, balls: 6  }, // impact  -5
    { name: 'Riyan Parag',     runs: 8,  wickets: 0, balls: 10 }, // flopped +15
    { name: 'Shimron Hetmyer', runs: 14, wickets: 1, balls: 11 }, // neutral  0
    { name: 'Trent Boult',     runs: 0,  wickets: 2, balls: 4  }, // impact  -5
    { name: 'Heinrich Klaasen',runs: 55, wickets: 0, balls: 30 }, // impact  -5
  ],
  94: [
    { name: 'Rohit Sharma',       runs: 7,  wickets: 0, balls: 9  }, // flopped +15
    { name: 'Shashank Singh',     runs: 45, wickets: 0, balls: 28 }, // impact  -5
    { name: 'Arshdeep Singh',     runs: 0,  wickets: 3, balls: 4  }, // impact  -5
    { name: 'Prabhsimran Singh',  runs: 8,  wickets: 0, balls: 10 }, // flopped +15
    { name: 'Hardik Pandya',      runs: 12, wickets: 1, balls: 14 }, // neutral  0
    { name: 'Ishan Kishan',       runs: 38, wickets: 0, balls: 22 }, // impact  -5
  ],
  95: [
    { name: 'Sunil Narine',    runs: 55, wickets: 0, balls: 30 }, // impact  -5
    { name: 'Andre Russell',   runs: 42, wickets: 0, balls: 24 }, // impact  -5
    { name: 'MS Dhoni',        runs: 3,  wickets: 0, balls: 5  }, // flopped +15
    { name: 'Ruturaj Gaikwad', runs: 8,  wickets: 0, balls: 12 }, // flopped +15
    { name: 'Ravindra Jadeja', runs: 15, wickets: 2, balls: 12 }, // impact  -5
    { name: 'Rinku Singh',     runs: 28, wickets: 0, balls: 18 }, // neutral  0
  ],
}

// ─── Predictions ──────────────────────────────────────────────────────────────
//
// Expected scores per match:
//   M90: Rahul=52, Karan=32, Sneha=5,  Priya=-5
//   M91: Rahul=52, Karan=22, Sneha=22, Priya=5
//   M92: Rahul=27, Karan=5,  Sneha=32, Priya=37
//   M93: Rahul=15, Karan=32, Sneha=20, Priya=17
//   M94: Rahul=27, Karan=30, Sneha=27, Priya=22
//   M95: Rahul=37, Karan=-5, Sneha=32, Priya=52
//
// Expected totals: Rahul=210, Sneha=138, Priya=128, Karan=116

const PREDICTION_DEFS = {
  // M90: RCB wins | Call: "Over 13" | Chaos: "Yes"
  // Winner: rcb=[rahul,karan]  mi=[priya,sneha]  → 1.5x each
  // Call:   Over 13=[rahul,karan,sneha]  Under 13=[priya]  → Over=1x, Under=2x
  90: [
    [USERS.rahul, { match_winner_pick: 'rcb', the_call_pick: 'Over 13',  villain_pick_player: 'Rohit Sharma',  chaos_ball_pick: 'Yes' }],
    [USERS.priya, { match_winner_pick: 'mi',  the_call_pick: 'Under 13', villain_pick_player: 'Glenn Maxwell',  chaos_ball_pick: 'No'  }],
    [USERS.karan, { match_winner_pick: 'rcb', the_call_pick: 'Over 13',  villain_pick_player: 'Virat Kohli',    chaos_ball_pick: 'Yes' }],
    [USERS.sneha, { match_winner_pick: 'mi',  the_call_pick: 'Over 13',  villain_pick_player: 'Jasprit Bumrah', chaos_ball_pick: 'No'  }],
  ],
  // M91: CSK wins | Call: "CSK" | Chaos: "No"
  // Winner: csk=[rahul,priya,sneha]  kkr=[karan]  → csk=1x, kkr=2x
  // Call:   CSK=[rahul,karan]  KKR=[priya,sneha]  → each 1.5x
  91: [
    [USERS.rahul, { match_winner_pick: 'csk', the_call_pick: 'CSK', villain_pick_player: 'MS Dhoni',        chaos_ball_pick: 'No'  }],
    [USERS.priya, { match_winner_pick: 'csk', the_call_pick: 'KKR', villain_pick_player: 'Ruturaj Gaikwad', chaos_ball_pick: 'Yes' }],
    [USERS.karan, { match_winner_pick: 'kkr', the_call_pick: 'CSK', villain_pick_player: 'Andre Russell',   chaos_ball_pick: 'No'  }],
    [USERS.sneha, { match_winner_pick: 'csk', the_call_pick: 'KKR', villain_pick_player: 'Moeen Ali',       chaos_ball_pick: 'No'  }],
  ],
  // M92: GT wins | Call: "GT" | Chaos: "Yes"
  // Winner: gt=[rahul,karan,sneha]  lsg=[priya]  → gt=1x, lsg=2x
  // Call:   GT=[rahul,priya,sneha]  LSG=[karan]  → GT=1x, LSG=2x
  92: [
    [USERS.rahul, { match_winner_pick: 'gt',  the_call_pick: 'GT',  villain_pick_player: 'Shubman Gill',    chaos_ball_pick: 'Yes' }],
    [USERS.priya, { match_winner_pick: 'lsg', the_call_pick: 'GT',  villain_pick_player: 'Nicholas Pooran', chaos_ball_pick: 'Yes' }],
    [USERS.karan, { match_winner_pick: 'gt',  the_call_pick: 'LSG', villain_pick_player: 'Rashid Khan',     chaos_ball_pick: 'No'  }],
    [USERS.sneha, { match_winner_pick: 'gt',  the_call_pick: 'GT',  villain_pick_player: 'KL Rahul',        chaos_ball_pick: 'Yes' }],
  ],
  // M93: SRH wins | Call: "SRH" | Chaos: "Yes"
  // Winner: srh=[karan,sneha]  rr=[rahul,priya]  → each 1.5x
  // Call:   SRH=[karan,sneha,priya]  RR=[rahul]  → SRH=1x, RR=2x (wrong)
  93: [
    [USERS.rahul, { match_winner_pick: 'rr',  the_call_pick: 'RR',  villain_pick_player: 'Riyan Parag',       chaos_ball_pick: 'No'  }],
    [USERS.priya, { match_winner_pick: 'rr',  the_call_pick: 'SRH', villain_pick_player: 'Pat Cummins',       chaos_ball_pick: 'Yes' }],
    [USERS.karan, { match_winner_pick: 'srh', the_call_pick: 'SRH', villain_pick_player: 'Abhishek Sharma',   chaos_ball_pick: 'Yes' }],
    [USERS.sneha, { match_winner_pick: 'srh', the_call_pick: 'SRH', villain_pick_player: 'Trent Boult',       chaos_ball_pick: 'No'  }],
  ],
  // M94: PBKS wins (upset) | Call: "PBKS" | Chaos: "No"
  // Winner: pbks=[karan]  mi=[rahul,priya,sneha]  → pbks=2x, mi=1x (all wrong except karan)
  // Call:   PBKS=[karan,priya]  MI=[rahul,sneha]  → each 1.5x
  94: [
    [USERS.rahul, { match_winner_pick: 'mi',   the_call_pick: 'MI',   villain_pick_player: 'Rohit Sharma',      chaos_ball_pick: 'No'  }],
    [USERS.priya, { match_winner_pick: 'mi',   the_call_pick: 'PBKS', villain_pick_player: 'Arshdeep Singh',    chaos_ball_pick: 'No'  }],
    [USERS.karan, { match_winner_pick: 'pbks', the_call_pick: 'PBKS', villain_pick_player: 'Shashank Singh',    chaos_ball_pick: 'Yes' }],
    [USERS.sneha, { match_winner_pick: 'mi',   the_call_pick: 'MI',   villain_pick_player: 'Prabhsimran Singh', chaos_ball_pick: 'No'  }],
  ],
  // M95: KKR wins | Call: "KKR" | Chaos: "Yes"
  // Winner: kkr=[priya,sneha]  csk=[rahul,karan]  → each 1.5x
  // Call:   KKR=[rahul,priya,sneha]  CSK=[karan]  → KKR=1x, CSK=2x (wrong)
  95: [
    [USERS.rahul, { match_winner_pick: 'csk', the_call_pick: 'KKR', villain_pick_player: 'MS Dhoni',        chaos_ball_pick: 'Yes' }],
    [USERS.priya, { match_winner_pick: 'kkr', the_call_pick: 'KKR', villain_pick_player: 'Ruturaj Gaikwad', chaos_ball_pick: 'Yes' }],
    [USERS.karan, { match_winner_pick: 'csk', the_call_pick: 'CSK', villain_pick_player: 'Andre Russell',   chaos_ball_pick: 'No'  }],
    [USERS.sneha, { match_winner_pick: 'kkr', the_call_pick: 'KKR', villain_pick_player: 'Sunil Narine',    chaos_ball_pick: 'Yes' }],
  ],
  // M96: upcoming — Rahul already locked picks
  96: [
    [USERS.rahul, { match_winner_pick: 'rcb', the_call_pick: 'Over 13', villain_pick_player: 'Shubman Gill', chaos_ball_pick: 'No' }],
  ],
  // M98: live — Rahul and Priya already locked picks, Karan and Sneha haven't
  98: [
    [USERS.rahul, { match_winner_pick: 'srh', the_call_pick: 'Over 13',  villain_pick_player: 'Abhishek Sharma', chaos_ball_pick: 'Yes' }],
    [USERS.priya, { match_winner_pick: 'dc',  the_call_pick: 'Under 13', villain_pick_player: 'Pat Cummins',     chaos_ball_pick: 'No'  }],
  ],
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function ok(label, error) {
  if (error) { console.error(`  ❌ ${label}: ${error.message}`); return false }
  return true
}

// ─── Seed ─────────────────────────────────────────────────────────────────────

async function seedTestData() {
  console.log('🌱  Seeding test data...\n')

  // 1. Test users
  console.log('👥  Creating test users...')
  for (const u of TEST_USERS) {
    // Check if user already exists with this ID
    const { data: existing } = await supabase.auth.admin.getUserById(u.id)
    if (!existing?.user) {
      // Try to delete any existing user with the same email (different ID) to avoid conflicts
      const { data: byEmail } = await supabase.auth.admin.listUsers()
      const emailMatch = byEmail?.users?.find(au => au.email === u.email)
      if (emailMatch && emailMatch.id !== u.id) {
        await supabase.auth.admin.deleteUser(emailMatch.id)
      }
      const { error: authErr } = await supabase.auth.admin.createUser({
        id: u.id, email: u.email, password: u.password,
        email_confirm: true, user_metadata: { name: u.display_name },
      })
      if (authErr) { console.error(`  ❌ ${u.display_name} auth: ${authErr.message}`); continue }
    }
    const { error: profErr } = await supabase
      .from('users')
      .upsert({ id: u.id, display_name: u.display_name, team: u.team, is_admin: u.is_admin, avatar_url: u.avatar_url }, { onConflict: 'id' })
    if (!ok(`${u.display_name} profile`, profErr)) continue
    console.log(`  ✓ ${u.display_name} (${u.email})`)
  }
  await supabase.from('users').upsert(
    { id: USERS.rahul, display_name: 'Rahul', team: 'rcb', is_admin: true, avatar_url: makeJersey(18, '#CC0000', '#1A1A1A') }, // Kohli #18
    { onConflict: 'id' }
  )

  // 2. Upsert matches
  console.log('\n🏏  Upserting matches...')
  const matchRows = TEST_MATCH_NUMBERS.map(n => ({ match_number: n, ...MATCH_DEFS[n] }))
  const { error: matchErr } = await supabase
    .from('matches')
    .upsert(matchRows, { onConflict: 'match_number' })
  if (!ok('matches upsert', matchErr)) process.exit(1)

  const { data: fetchedMatches, error: fetchErr } = await supabase
    .from('matches')
    .select('id, match_number')
    .in('match_number', TEST_MATCH_NUMBERS)
  if (!ok('matches fetch', fetchErr)) process.exit(1)

  const matchIdByNum = {}
  fetchedMatches?.forEach(m => { matchIdByNum[m.match_number] = m.id })
  console.log(`  ✓ ${Object.keys(matchIdByNum).length} matches`)
  Object.entries(matchIdByNum).forEach(([num, _]) => {
    const def = MATCH_DEFS[num]
    const state = def.status === 'completed' ? `✓ ${def.winner?.toUpperCase()} won` : def.status === 'live' ? '🔴 live' : '⏳ upcoming'
    console.log(`    M${num}: ${def.team_a.toUpperCase()} vs ${def.team_b.toUpperCase()}  ${state}`)
  })

  const allMatchIds = Object.values(matchIdByNum)

  // 3. Replace questions
  console.log('\n❓  Replacing match questions...')
  await supabase.from('match_questions').delete().in('match_id', allMatchIds)
  const questionRows = []
  for (const num of TEST_MATCH_NUMBERS) {
    const matchId = matchIdByNum[num]
    if (!matchId) continue
    const defs = QUESTION_DEFS[num]
    questionRows.push({ match_id: matchId, ...defs.call  })
    questionRows.push({ match_id: matchId, ...defs.chaos })
  }
  const { error: qErr } = await supabase.from('match_questions').insert(questionRows)
  if (!ok('match_questions', qErr)) process.exit(1)
  console.log(`  ✓ ${questionRows.length} questions`)

  // 4. Scorecards
  console.log('\n📊  Setting scorecards...')
  for (const [num, scorecard] of Object.entries(SCORECARDS)) {
    const matchId = matchIdByNum[num]
    if (!matchId) continue
    const { error } = await supabase.from('matches').update({ scorecard_json: scorecard }).eq('id', matchId)
    if (!ok(`scorecard M${num}`, error)) continue
    console.log(`  ✓ M${num} (${scorecard.length} players)`)
  }

  // 5. Fetch fresh questions (need IDs for scoring)
  const { data: freshQs } = await supabase
    .from('match_questions')
    .select('id, match_id, type, correct_answer')
    .in('match_id', allMatchIds)
  const getQ = (matchId, type) => freshQs?.find(q => q.match_id === matchId && q.type === type)

  // 6. Replace predictions
  console.log('\n🎯  Replacing predictions...')
  await supabase.from('predictions').delete().in('match_id', allMatchIds)
  const predRows = []
  for (const [num, preds] of Object.entries(PREDICTION_DEFS)) {
    const matchId = matchIdByNum[num]
    if (!matchId) continue
    for (const [userId, picks] of preds) {
      predRows.push({ user_id: userId, match_id: matchId, ...picks, locked_at: new Date().toISOString() })
    }
  }
  const { error: predErr } = await supabase.from('predictions').insert(predRows)
  if (!ok('predictions', predErr)) process.exit(1)
  console.log(`  ✓ ${predRows.length} predictions`)

  // 7. Compute + insert match_scores
  console.log('\n🏆  Computing match scores...')
  await supabase.from('match_scores').delete().in('match_id', allMatchIds)
  const scoreRows = []
  const totals = { [USERS.rahul]: 0, [USERS.priya]: 0, [USERS.karan]: 0, [USERS.sneha]: 0 }

  for (const num of COMPLETED_MATCH_NUMBERS) {
    const matchId   = matchIdByNum[num]
    if (!matchId) continue
    const def       = MATCH_DEFS[num]
    const scorecard = SCORECARDS[num]
    const callQ     = getQ(matchId, 'the_call')
    const chaosQ    = getQ(matchId, 'chaos_ball')
    const preds     = PREDICTION_DEFS[num]

    const allPicks = {
      winner:     preds.map(([, p]) => p.match_winner_pick).filter(Boolean),
      the_call:   preds.map(([, p]) => p.the_call_pick).filter(Boolean),
      chaos_ball: preds.map(([, p]) => p.chaos_ball_pick).filter(Boolean),
    }

    console.log(`\n  M${num}: ${def.team_a.toUpperCase()} vs ${def.team_b.toUpperCase()} — ${def.winner?.toUpperCase()} won`)

    for (const [userId, picks] of preds) {
      const name = Object.entries(USERS).find(([, id]) => id === userId)?.[0] ?? userId.slice(-4)
      const result = scoreMatchCard(
        picks,
        { winner: def.winner, scorecard },
        { the_call: callQ?.correct_answer, chaos_ball: chaosQ?.correct_answer },
        allPicks,
      )
      totals[userId] = (totals[userId] ?? 0) + result.total
      scoreRows.push({
        user_id: userId, match_id: matchId,
        winner_pts: result.winner_pts, call_pts: result.call_pts,
        villain_pts: result.villain_pts, chaos_pts: result.chaos_pts,
        total: result.total,
      })
      const sign = result.total >= 0 ? '+' : ''
      console.log(`    ${name.padEnd(6)}: W=${String(result.winner_pts).padStart(3)}  C=${String(result.call_pts).padStart(3)}  V=${String(result.villain_pts).padStart(3)}  CB=${String(result.chaos_pts).padStart(3)}  → ${sign}${result.total}`)
    }
  }

  const { error: scoreErr } = await supabase.from('match_scores').insert(scoreRows)
  if (!ok('match_scores', scoreErr)) process.exit(1)
  console.log(`\n  ✓ ${scoreRows.length} score rows written`)

  // 8. Summary
  const sorted = Object.entries(totals)
    .map(([id, pts]) => {
      const name = Object.entries(USERS).find(([, uid]) => uid === id)?.[0] ?? id
      return { name, pts }
    })
    .sort((a, b) => b.pts - a.pts)

  console.log('\n─────────────────────────────────────────────────────')
  console.log('✅  Done!\n')
  console.log('Leaderboard after seeding:')
  sorted.forEach((p, i) => console.log(`  ${i + 1}. ${p.name.padEnd(8)} ${p.pts > 0 ? '+' : ''}${p.pts} pts`))
  console.log('\nTest logins (password: test1234):')
  console.log('  rahul@called-it.test         (RCB, admin)')
  TEST_USERS.forEach(u => console.log(`  ${u.email.padEnd(30)} (${u.team.toUpperCase()})`))
  console.log('\nTo remove all test data: node scripts/seedTestData.js --reset')
}

// ─── Reset ────────────────────────────────────────────────────────────────────

async function resetTestData() {
  console.log('🗑   Removing test data...\n')

  const { data: matches } = await supabase
    .from('matches')
    .select('id, match_number')
    .in('match_number', TEST_MATCH_NUMBERS)

  const matchIds = matches?.map(m => m.id) ?? []

  if (matchIds.length) {
    ok('match_scores delete',    (await supabase.from('match_scores').delete().in('match_id', matchIds)).error)
    ok('predictions delete',     (await supabase.from('predictions').delete().in('match_id', matchIds)).error)
    ok('match_questions delete', (await supabase.from('match_questions').delete().in('match_id', matchIds)).error)
    ok('matches delete',         (await supabase.from('matches').delete().in('id', matchIds)).error)
    console.log(`  ✓ Removed M${TEST_MATCH_NUMBERS.join(', M')} and all related data`)
  } else {
    console.log('  No test matches found.')
  }

  for (const userId of [USERS.priya, USERS.karan, USERS.sneha]) {
    const name = Object.entries(USERS).find(([, id]) => id === userId)?.[0]
    await supabase.auth.admin.deleteUser(userId)
    console.log(`  ✓ Deleted user ${name}`)
  }

  console.log('\n✅  Test data removed. Rahul (rahul@called-it.test) was kept.')
  console.log('   Run "node scripts/seedTestData.js" to re-seed.')
}

// ─── Entry point ──────────────────────────────────────────────────────────────

const isReset = process.argv.includes('--reset')
;(isReset ? resetTestData : seedTestData)().catch(err => {
  console.error('\n❌', err.message)
  process.exit(1)
})
