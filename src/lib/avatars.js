/**
 * Cricket jersey avatars — real IPL players, real numbers, real team colors.
 * Inline SVG encoded as data URLs. Store in users.avatar_url, render with <img>.
 */

function makeJersey(number, lastName, jerseyColor, stripeColor, textColor = '#ffffff') {
  const numSize = number > 9 ? '27' : '32'
  const svg = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <circle cx="50" cy="50" r="50" fill="${jerseyColor}" opacity="0.12"/>
  <path d="M 36,28 L 22,20 L 8,40 L 21,46 L 21,82 L 79,82 L 79,46 L 92,40 L 78,20 L 64,28 Q 57,20 50,23 Q 43,20 36,28 Z" fill="${jerseyColor}"/>
  <path d="M 8,40 L 21,46 L 21,58 L 8,52 Z" fill="${stripeColor}" opacity="0.7"/>
  <path d="M 92,40 L 79,46 L 79,58 L 92,52 Z" fill="${stripeColor}" opacity="0.7"/>
  <path d="M 36,28 Q 50,36 64,28" fill="none" stroke="${stripeColor}" stroke-width="3" stroke-linecap="round"/>
  <text x="50" y="58" text-anchor="middle" dominant-baseline="middle"
    font-family="Arial Black, Impact, sans-serif" font-weight="900"
    font-size="${numSize}" fill="${textColor}" letter-spacing="-1">${number}</text>
  <text x="50" y="75" text-anchor="middle" dominant-baseline="middle"
    font-family="Arial, Helvetica, sans-serif" font-weight="700"
    font-size="8" fill="${textColor}" opacity="0.9" letter-spacing="0.8">${lastName}</text>
</svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

// 2–3 popular players per team, real numbers, team colors from content/teams.json
export const JERSEY_AVATARS = [
  // ── CSK  primary #F9CD1B  secondary #1D3461  text #111
  { id: 'dhoni',    label: 'Dhoni',    sublabel: 'CSK · #7',  url: makeJersey(7,  'DHONI',   '#F9CD1B', '#1D3461', '#111111') },
  { id: 'ruturaj',  label: 'Ruturaj',  sublabel: 'CSK · #31', url: makeJersey(31, 'RUTURAJ', '#F9CD1B', '#1D3461', '#111111') },

  // ── MI   primary #004BA0  secondary #D4AF37  text #fff
  { id: 'rohit',    label: 'Rohit',    sublabel: 'MI · #45',  url: makeJersey(45, 'ROHIT',   '#004BA0', '#D4AF37') },
  { id: 'bumrah',   label: 'Bumrah',   sublabel: 'MI · #93',  url: makeJersey(93, 'BUMRAH',  '#004BA0', '#D4AF37') },
  { id: 'sky',      label: 'SKY',      sublabel: 'MI · #63',  url: makeJersey(63, 'SKY',     '#004BA0', '#D4AF37') },
  { id: 'hardik',   label: 'Hardik',   sublabel: 'MI · #33',  url: makeJersey(33, 'HARDIK',  '#004BA0', '#D4AF37') },
  { id: 'tilak',    label: 'Tilak',    sublabel: 'MI · #9',   url: makeJersey(9,  'TILAK',   '#004BA0', '#D4AF37') },

  // ── RCB  primary #CC0000  secondary #1A1A1A  text #fff
  { id: 'kohli',    label: 'Kohli',    sublabel: 'RCB · #18', url: makeJersey(18, 'KOHLI',   '#CC0000', '#1A1A1A') },
  { id: 'salt',     label: 'Salt',     sublabel: 'RCB · #61', url: makeJersey(61, 'SALT',    '#CC0000', '#1A1A1A') },
  { id: 'padikkal', label: 'Padikkal', sublabel: 'RCB · #21', url: makeJersey(21, 'PADIKKAL','#CC0000', '#1A1A1A') },

  // ── KKR  primary #3B225F  secondary #F4C430  text #fff
  { id: 'narine',   label: 'Narine',   sublabel: 'KKR · #74', url: makeJersey(74, 'NARINE',  '#3B225F', '#F4C430') },
  { id: 'rinku',    label: 'Rinku',    sublabel: 'KKR · #35', url: makeJersey(35, 'RINKU',   '#3B225F', '#F4C430') },
  { id: 'varun',    label: 'Varun',    sublabel: 'KKR · #29', url: makeJersey(29, 'VARUN',   '#3B225F', '#F4C430') },

  // ── SRH  primary #FF822A  secondary #1A1A1A  text #fff
  { id: 'cummins',  label: 'Cummins',  sublabel: 'SRH · #30', url: makeJersey(30, 'CUMMINS', '#FF822A', '#1A1A1A') },
  { id: 'abhishek', label: 'Abhishek', sublabel: 'SRH · #4',  url: makeJersey(4,  'ABHISHEK','#FF822A', '#1A1A1A') },
  { id: 'head',     label: 'Head',     sublabel: 'SRH · #62', url: makeJersey(62, 'HEAD',    '#FF822A', '#1A1A1A') },
  { id: 'klaasen',  label: 'Klaasen',  sublabel: 'SRH · #45', url: makeJersey(45, 'KLAASEN', '#FF822A', '#1A1A1A') },

  // ── DC   primary #0057A8  secondary #EF1C25  text #fff
  { id: 'klrahul',  label: 'KL Rahul', sublabel: 'DC · #1',   url: makeJersey(1,  'KL RAHUL','#0057A8', '#EF1C25') },
  { id: 'axar',     label: 'Axar',     sublabel: 'DC · #20',  url: makeJersey(20, 'AXAR',    '#0057A8', '#EF1C25') },
  { id: 'kuldeep',  label: 'Kuldeep',  sublabel: 'DC · #23',  url: makeJersey(23, 'KULDEEP', '#0057A8', '#EF1C25') },

  // ── PBKS primary #ED1B24  secondary #A7A9AC  text #fff
  { id: 'iyer',     label: 'Iyer',     sublabel: 'PBKS · #96', url: makeJersey(96, 'IYER',    '#ED1B24', '#A7A9AC') },
  { id: 'arshdeep', label: 'Arshdeep', sublabel: 'PBKS · #2', url: makeJersey(2,  'ARSHDEEP','#ED1B24', '#A7A9AC') },
  { id: 'chahal',   label: 'Chahal',   sublabel: 'PBKS · #23', url: makeJersey(23, 'CHAHAL',  '#ED1B24', '#A7A9AC') },

  // ── RR   primary #E5137D  secondary #1D3461  text #fff
  { id: 'jaiswal',  label: 'Jaiswal',  sublabel: 'RR · #58',  url: makeJersey(58, 'JAISWAL', '#E5137D', '#1D3461') },
  { id: 'parag',    label: 'Parag',    sublabel: 'RR · #5',   url: makeJersey(5,  'PARAG',   '#E5137D', '#1D3461') },
  { id: 'jadeja',   label: 'Jadeja',   sublabel: 'RR · #8',   url: makeJersey(8,  'JADEJA',  '#E5137D', '#1D3461') },
  { id: 'archer',   label: 'Archer',   sublabel: 'RR · #22',  url: makeJersey(22, 'ARCHER',  '#E5137D', '#1D3461') },

  // ── GT   primary #1C3A6B  secondary #D4AF37  text #fff
  { id: 'gill',     label: 'Gill',     sublabel: 'GT · #77',  url: makeJersey(77, 'GILL',    '#1C3A6B', '#D4AF37') },
  { id: 'rashid',   label: 'Rashid',   sublabel: 'GT · #19',  url: makeJersey(19, 'RASHID',  '#1C3A6B', '#D4AF37') },
  { id: 'buttler',  label: 'Buttler',  sublabel: 'GT · #63',  url: makeJersey(63, 'BUTTLER', '#1C3A6B', '#D4AF37') },
  { id: 'sudharsan',label: 'Sudharsan',sublabel: 'GT · #66',  url: makeJersey(66, 'SUDHARSAN','#1C3A6B','#D4AF37') },

  // ── LSG  primary #A72B6D  secondary #00B2CA  text #fff
  { id: 'pant',     label: 'Pant',     sublabel: 'LSG · #17', url: makeJersey(17, 'PANT',    '#A72B6D', '#00B2CA') },
  { id: 'shami',    label: 'Shami',    sublabel: 'LSG · #11', url: makeJersey(11, 'SHAMI',   '#A72B6D', '#00B2CA') },
  { id: 'pooran',   label: 'Pooran',   sublabel: 'LSG · #29', url: makeJersey(29, 'POORAN',  '#A72B6D', '#00B2CA') },
  { id: 'mayank',   label: 'Mayank Y', sublabel: 'LSG · #24', url: makeJersey(24, 'MAYANK Y','#A72B6D', '#00B2CA') },
]
