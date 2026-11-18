/* ============================================================
   Bida-Vibe — content library
   Event types → suggested programs, Taglish host scripts by
   tone, and the built-in party games.
   Placeholders: {event} {group} {host} {next} {title} {game}
   ============================================================ */

window.BIDA_TONES = [
  { id: 'formal',   label: 'Formal',   hint: 'Pormal, maayos, may respeto' },
  { id: 'serious',  label: 'Serious',  hint: 'Taos-puso, makahulugan' },
  { id: 'friendly', label: 'Friendly', hint: 'Mainit, parang kapamilya' },
  { id: 'jolly',    label: 'Jolly',    hint: 'Masaya, makulit, maingay' }
];

/* ---------- Segment kinds (what a program line *is*) ---------- */
window.BIDA_KINDS = {
  arrival:  { label: 'Arrival & Registration', color: 'turq' },
  opening:  { label: 'Opening',                color: 'magenta' },
  prayer:   { label: 'Opening Prayer',         color: 'leaf' },
  anthem:   { label: 'Pambansang Awit',        color: 'leaf' },
  welcome:  { label: 'Welcome Remarks',        color: 'magenta' },
  intro:    { label: 'Introductions',          color: 'turq' },
  icebreak: { label: 'Icebreaker',             color: 'gold' },
  game:     { label: 'Game',                   color: 'gold' },
  meal:     { label: 'Kainan',                 color: 'chili' },
  number:   { label: 'Presentation / Number',  color: 'magenta' },
  speech:   { label: 'Message / Speech',       color: 'turq' },
  tribute:  { label: 'Tribute',                color: 'leaf' },
  awards:   { label: 'Awarding',               color: 'gold' },
  raffle:   { label: 'Raffle',                 color: 'chili' },
  gifts:    { label: 'Exchange Gifts',         color: 'chili' },
  cake:     { label: 'Cake & Wish',            color: 'magenta' },
  photo:    { label: 'Group Photo',            color: 'turq' },
  toast:    { label: 'Toast',                  color: 'gold' },
  videoke:  { label: 'Videoke / Free Time',    color: 'magenta' },
  closing:  { label: 'Closing',                color: 'leaf' }
};

/* ---------- Event types → suggested activities ----------\n   Each program row: [kind, title, minutes, gameId?]          */
window.BIDA_EVENTS = [
  {
    id: 'reunion', label: 'Family Reunion', tag: 'Para sa buong angkan',
    program: [
      ['arrival', 'Arrival & name tags', 30],
      ['opening', 'Opening — Bati sa lahat', 5],
      ['prayer', 'Opening prayer', 5],
      ['welcome', 'Welcome mula sa pinakamatanda', 10],
      ['intro', 'Roll call ng bawat pamilya', 20],
      ['icebreak', 'Icebreaker: Hep Hep Hooray', 10, 'hephep'],
      ['meal', 'Kainan na!', 60],
      ['tribute', 'Pag-alala sa mga yumao', 10],
      ['game', 'Trip to Jerusalem', 15, 'jerusalem'],
      ['game', 'Bring Me', 15, 'bringme'],
      ['game', 'Survey Says: Pamilya Edition', 20, 'survey'],
      ['awards', 'Awards: Pinakamalayong galing, Pinakabata, etc.', 15],
      ['raffle', 'Raffle draw', 20],
      ['photo', 'Family photo', 15],
      ['closing', 'Closing & see you next year', 5],
      ['videoke', 'Videoke hanggang mapaos', 60]
    ]
  },
  {
    id: 'xmas', label: 'Christmas Party', tag: 'Pamilya, opisina o barkada',
    program: [
      ['arrival', 'Arrival & photo booth', 30],
      ['opening', 'Opening — Maligayang Pasko!', 5],
      ['prayer', 'Opening prayer', 5],
      ['welcome', 'Welcome remarks', 5],
      ['icebreak', 'Icebreaker: Pass the Message', 10, 'whisper'],
      ['meal', 'Kainan / Salu-salo', 60],
      ['game', 'Paper Dance', 15, 'paperdance'],
      ['game', 'Pinoy Henyo', 20, 'henyo'],
      ['number', 'Christmas presentation / carol', 15],
      ['gifts', 'Exchange gifts', 30],
      ['raffle', 'Raffle draw', 20],
      ['photo', 'Group photo with the tree', 10],
      ['closing', 'Closing & Merry Christmas', 5],
      ['videoke', 'Videoke & sayawan', 60]
    ]
  },
  {
    id: 'birthday', label: 'Birthday Party', tag: 'Bata man o matanda',
    program: [
      ['arrival', 'Arrival', 20],
      ['opening', 'Opening — Welcome sa party ni celebrant!', 5],
      ['prayer', 'Prayer before meals', 3],
      ['meal', 'Kainan', 45],
      ['game', 'Stop Dance', 10, 'stopdance'],
      ['game', 'Putok Lobo', 10, 'balloon'],
      ['game', 'Bato Bato Pik Tournament', 10, 'jakenpoy'],
      ['speech', 'Messages para sa celebrant', 15],
      ['cake', 'Happy Birthday song & blow the candles', 10],
      ['photo', 'Photo with the celebrant', 15],
      ['closing', 'Thank you & loot bags', 5]
    ]
  },
  {
    id: 'barkada', label: 'Barkada Gathering', tag: 'Inuman, kwentuhan, tawanan',
    program: [
      ['arrival', 'Arrival & pulutan', 30],
      ['opening', 'Opening — Kumusta mga lods!', 5],
      ['icebreak', 'Icebreaker: Charades', 15, 'charades'],
      ['meal', 'Kainan', 45],
      ['game', 'Pinoy Henyo', 20, 'henyo'],
      ['game', 'Mainit na Patatas', 10, 'hotpotato'],
      ['toast', 'Toast sa barkada', 5],
      ['photo', 'Groufie', 5],
      ['videoke', 'Videoke & kwentuhan', 90],
      ['closing', 'Uwian na (daw)', 5]
    ]
  },
  {
    id: 'office', label: 'Office / Team Party', tag: 'Team building at year-end',
    program: [
      ['arrival', 'Registration', 30],
      ['opening', 'Opening', 5],
      ['prayer', 'Invocation', 3],
      ['anthem', 'Pambansang Awit', 3],
      ['welcome', 'Welcome remarks — Management', 10],
      ['icebreak', 'Icebreaker: Longest Line', 15, 'longestline'],
      ['meal', 'Dinner', 60],
      ['number', 'Department presentations', 30],
      ['game', 'Survey Says: Office Edition', 20, 'survey'],
      ['awards', 'Awards & recognition', 20],
      ['raffle', 'Raffle draw', 30],
      ['closing', 'Closing remarks', 5],
      ['videoke', 'Party & sayawan', 60]
    ]
  },
  {
    id: 'binyag', label: 'Binyag / Christening', tag: 'Para kay baby at ninong-ninang',
    program: [
      ['arrival', 'Arrival from church', 20],
      ['opening', 'Opening', 5],
      ['prayer', 'Prayer for the baby', 5],
      ['welcome', 'Welcome from the parents', 5],
      ['intro', 'Pakilala sa mga ninong at ninang', 10],
      ['meal', 'Kainan', 60],
      ['speech', 'Messages para kay baby', 15],
      ['game', 'Bring Me', 15, 'bringme'],
      ['photo', 'Photo with ninong & ninang', 15],
      ['closing', 'Thank you & souvenirs', 5]
    ]
  },
  {
    id: 'despedida', label: 'Despedida / Welcome Home', tag: 'Paalam o balikbayan',
    program: [
      ['arrival', 'Arrival', 20],
      ['opening', 'Opening', 5],
      ['prayer', 'Prayer', 3],
      ['welcome', 'Welcome', 5],
      ['meal', 'Kainan', 60],
      ['game', 'Pass the Message', 10, 'whisper'],
      ['game', 'Survey Says', 20, 'survey'],
      ['speech', 'Messages para sa aalis / dumating', 20],
      ['toast', 'Toast', 5],
      ['photo', 'Group photo', 10],
      ['closing', 'Closing', 5],
      ['videoke', 'Videoke', 60]
    ]
  },
  {
    id: 'fiesta', label: 'Fiesta / Town Party', tag: 'Bukas ang bahay sa lahat',
    program: [
      ['arrival', 'Open house — dating ng bisita', 60],
      ['opening', 'Opening — Maligayang Pista!', 5],
      ['prayer', 'Prayer & pasasalamat sa patron', 5],
      ['meal', 'Handaan', 90],
      ['game', 'Calamansi Relay', 15, 'relay'],
      ['game', 'Trip to Jerusalem', 15, 'jerusalem'],
      ['game', 'Putok Lobo', 10, 'balloon'],
      ['number', 'Sayawan / presentations', 30],
      ['raffle', 'Raffle', 20],
      ['closing', 'Closing', 5],
      ['videoke', 'Videoke & sayawan', 90]
    ]
  },
  {
    id: 'custom', label: 'Iba pa / Custom', tag: 'Ikaw ang bahala sa program',
    program: [
      ['opening', 'Opening', 5],
      ['meal', 'Kainan', 45],
      ['game', 'Game', 15],
      ['closing', 'Closing', 5]
    ]
  }
];

/* ---------- Built-in party games ---------- */
window.BIDA_GAMES = [
  {
    id: 'jerusalem', name: 'Trip to Jerusalem', alias: 'Musical Chairs',
    players: '6–15', time: '10–15 min', age: 'Lahat', place: 'Indoor / Outdoor', energy: 3,
    anim: 'chairs',
    materials: ['Upuan (isang kulang sa bilang ng players)', 'Music player / speaker', 'Premyo para sa winner'],
    steps: [
      'Ayusin ang mga upuan nang magkatalikod. Dapat kulang ng isa sa dami ng players.',
      'Habang may music, iikot ang players sa mga upuan.',
      'I-stop bigla ang music — upo agad sa pinakamalapit na upuan!',
      'Ang walang naupuan, out. Bawas ng isang upuan.',
      'Ulit lang hanggang 2 players at 1 upuan na lang — kung sino ang makaupo, panalo!'
    ],
    tips: ['I-fade ang music imbes na i-stop agad — mas kabado sila.', 'Gamitin ang Talk button pag ia-announce kung sino ang out.']
  },
  {
    id: 'paperdance', name: 'Paper Dance', alias: 'Newspaper Dance',
    players: '4–10 pares', time: '10–15 min', age: 'Teens & adults', place: 'Indoor', energy: 3,
    anim: 'paper',
    materials: ['Isang dyaryo bawat pares', 'Music', 'Premyo'],
    steps: [
      'Bigyan ng isang buong dyaryo ang bawat pair.',
      'Sayaw sa ibabaw ng dyaryo habang may music.',
      'Pag huminto ang music, tupiin ang dyaryo sa kalahati.',
      'Ulit — pwedeng buhatin ang partner para kumasya!',
      'Ang pair na lumabas sa dyaryo, out. Huling pair na natira, panalo.'
    ],
    tips: ['Siguraduhing hindi madulas ang sahig.']
  },
  {
    id: 'henyo', name: 'Pinoy Henyo', alias: 'Guess the Word',
    players: '2 bawat team', time: '15–20 min', age: '10+', place: 'Kahit saan', energy: 2,
    anim: 'henyo',
    materials: ['Papel / index cards na may salita', 'Tape o headband', 'Timer (2 minuto)'],
    steps: [
      'Bawat team: isang manghuhula at isang sasagot.',
      'Idikit ang word sa noo ng manghuhula — hindi niya ito makikita.',
      'Magtatanong siya; “Oo”, “Hindi” o “Pwede” lang ang pwedeng isagot.',
      'May 2 minutes para mahulaan ang word.',
      'Pinakamaraming nahulaan o pinakamabilis — panalo!'
    ],
    tips: ['Gamitin ang Bunot ng word sa Games tab: tao, bagay, hayop, lugar, pagkain.', 'Ding pag tama, Buzzer pag time’s up.']
  },
  {
    id: 'bringme', name: 'Bring Me', alias: '',
    players: '3–6 teams', time: '10–15 min', age: 'Lahat', place: 'Kahit saan', energy: 3,
    anim: 'bringme',
    materials: ['Listahan ng mga ipapadala (hal. tsinelas, ₱20, selfie with lola)', 'Table sa harap', 'Premyo'],
    steps: [
      'Hatiin sa teams, tapos pili ng runner bawat team.',
      'Sisigaw ang host: “Bring me… pulang tsinelas!”',
      'Unahan ang mga runner na madala ito sa host.',
      'Unang makadala, 1 point.',
      'Pinakamaraming points after 10 rounds — panalo!'
    ],
    tips: ['Haluin ang madali at mahirap na items.', 'Ingat sa takbuhan kapag may mga bata.']
  },
  {
    id: 'stopdance', name: 'Stop Dance', alias: 'Freeze Dance',
    players: '5+', time: '5–10 min', age: 'Lahat (lalo na bata)', place: 'Indoor / Outdoor', energy: 3,
    anim: 'freeze',
    materials: ['Music', 'Premyo'],
    steps: [
      'Sayaw lahat habang may music.',
      'Pag huminto ang music — freeze! Bawal gumalaw.',
      'Ang gumalaw, out.',
      'Ulit hanggang isa na lang ang natira.'
    ],
    tips: ['Bagay dito ang mabilis na Fade out sa music bar.']
  },
  {
    id: 'relay', name: 'Calamansi Relay', alias: 'Spoon Relay',
    players: '2–4 teams', time: '10–15 min', age: 'Lahat', place: 'Outdoor / maluwag', energy: 3,
    anim: 'relay',
    materials: ['Kutsara bawat team', 'Calamansi (o itlog kung matapang)', 'Marker para sa start at finish'],
    steps: [
      'Pila ang bawat team sa starting line.',
      'Kagatin ang kutsara, tapos ipatong ang calamansi.',
      'Lakad papunta sa marker at balik nang hindi nahuhulog ang calamansi.',
      'Ipasa ang kutsara sa kasunod — bawal gamitin ang kamay.',
      'Unang team na matapos, panalo!'
    ],
    tips: ['Pang-adults round: hilaw na itlog imbes na calamansi. Mas maraming tawanan.']
  },
  {
    id: 'whisper', name: 'Pass the Message', alias: 'Telephone',
    players: '2 teams ng 6+', time: '10 min', age: '7+', place: 'Kahit saan', energy: 1,
    anim: 'whisper',
    materials: ['Papel na may mga mensahe', 'Ballpen'],
    steps: [
      'Pila ang bawat team, isa-isa.',
      'Ibubulong ng host ang message sa unang tao.',
      'Ibubulong niya sa kasunod — isang beses lang, walang ulit.',
      'Sasabihin o isusulat ng huling tao ang narinig niya.',
      'Pinakamalapit sa original — panalo!'
    ],
    tips: ['Try ng tongue-twister: “Pitong puting pating”.']
  },
  {
    id: 'charades', name: 'Pinoy Charades', alias: 'Act it out',
    players: '2 teams', time: '15–20 min', age: '8+', place: 'Kahit saan', energy: 2,
    anim: 'charades',
    materials: ['Mga card na may pelikula, kanta o salita', 'Timer (1 minuto)'],
    steps: [
      'Hatiin sa 2 teams.',
      'Isang member ang bubunot ng card, tapos i-a-act niya nang walang salita.',
      'Huhulaan ng team niya within 1 minute.',
      'Tamang hula = 1 point. Pinakamaraming points — panalo!'
    ],
    tips: ['Bagay na categories: teleserye, OPM at pagkain.']
  },
  {
    id: 'hephep', name: 'Hep Hep Hooray', alias: '',
    players: '8+', time: '5–10 min', age: 'Lahat', place: 'Kahit saan', energy: 2,
    anim: 'hephep',
    materials: ['Wala! Boses lang.'],
    steps: [
      'Bilog lahat. Ituturo ng host kung sino ang “Hep hep” at sino ang “Hooray”.',
      'Ang nasa left mo, sisigaw ng “Hep hep!”; ang nasa right, “Hooray!”.',
      'Iikot ang host — pag tinuro ka, sagot agad nang tama.',
      'Ang nagkamali o mabagal, out.'
    ],
    tips: ['Pabilisin nang pabilisin para mas nakakatawa.']
  },
  {
    id: 'longestline', name: 'Longest Line', alias: '',
    players: '2–4 teams', time: '10 min', age: 'Teens & adults', place: 'Maluwag na sahig', energy: 3,
    anim: 'line',
    materials: ['Gamit ng mga players mismo (sinturon, sapatos, jacket…)', 'Timer (3 minuto)'],
    steps: [
      'May 3 minutes ang bawat team.',
      'Gamit ang kahit anong dala nila, gawa ng pinakamahabang line sa sahig.',
      'Bawal kumuha sa ibang team.',
      'Pinakamahabang tuloy-tuloy na line — panalo!'
    ],
    tips: ['Mag-set ng limit kung hanggang saan lang ang pwedeng hubarin.']
  },
  {
    id: 'balloon', name: 'Putok Lobo', alias: 'Balloon Stomp',
    players: '6–20', time: '5–10 min', age: '7+', place: 'Maluwag na lugar', energy: 3,
    anim: 'balloon',
    materials: ['Lobo bawat player', 'Tali o yarn'],
    steps: [
      'Itali ang lobo sa ankle ng bawat player.',
      'Pag sinabing “Go!”, paputukin ang lobo ng iba gamit ang paa.',
      'Bantayan ang sarili mong lobo!',
      'Huling may buong lobo — panalo!'
    ],
    tips: ['Hiwalay ang round ng kids at adults.']
  },
  {
    id: 'jakenpoy', name: 'Bato Bato Pik Tournament', alias: 'Jack-en-poy',
    players: '8–32', time: '10 min', age: 'Lahat', place: 'Kahit saan', energy: 2,
    anim: 'jakenpoy',
    materials: ['Wala! Kamay lang.', 'Premyo para sa champion'],
    steps: [
      'Mag-pair up lahat.',
      'Bato Bato Pik — best of 3.',
      'Ang talo, magiging cheerer ng nanalo at susunod sa kanya.',
      'Laban-laban ang mga nanalo hanggang 2 na lang — final match!'
    ],
    tips: ['Ang “cheer train” ang pinakamasayang part — hayaan silang mag-ingay.']
  },
  {
    id: 'survey', name: 'Survey Says: Pamilya Edition', alias: 'Top 5 Answers',
    players: '2 teams ng 5', time: '15–20 min', age: '10+', place: 'Kahit saan', energy: 2,
    anim: 'feud',
    materials: ['Mga tanong na may top 5 sagot (hal. “Ulam tuwing Pasko”)', 'Board o papel para sa score', 'Buzzer o bell'],
    steps: [
      '2 teams, tig-isang representative sa harap.',
      'Babasahin ng host ang tanong — unang pumindot ng buzzer ang sasagot.',
      'Pag nasa top 5 ang sagot, may points ang team.',
      '3 mali — pwedeng mag-steal ang kabilang team.',
      'Pinakamaraming points after 5 questions — panalo!'
    ],
    tips: ['Mag-survey sa GC bago ang event para totoo ang mga sagot.', 'Ding pag tama, Buzzer pag mali — nasa Sounds tab.']
  },
  {
    id: 'hotpotato', name: 'Mainit na Patatas', alias: 'Hot Potato',
    players: '8+', time: '5–10 min', age: 'Lahat', place: 'Kahit saan', energy: 2,
    anim: 'pass',
    materials: ['Bola, unan o kahit anong bagay', 'Music', 'Forfeit cards (opsyonal)'],
    steps: [
      'Upo o tayo nang pabilog.',
      'Ipasa ang bola habang may music.',
      'Pag huminto ang music, kung sino ang may hawak ng bola — out (o may forfeit).',
      'Ulit hanggang isa na lang ang natira.'
    ],
    tips: ['Forfeit ideas: kumanta, sumayaw, o mag-share ng embarrassing story.']
  },

  /* ---------- From Dig the Games (@digthegames) — rules paraphrased, credited with a link ---------- */
  {
    id: 'plates', name: 'Musical Plates', alias: 'Musical chairs, pero plato',
    players: '5+', time: '5–10 min', age: 'Lahat', place: 'Kahit saan', energy: 3, anim: 'pass',
    materials: ['Paper plates (isang kulang sa bilang ng players)', 'Music'],
    steps: [
      'Bilog lahat; bawat isa may plate, pero kulang ng isa.',
      'Habang may music, ipasa ang mga plate — nakataas lang sa ulo.',
      'Pag huminto ang music, stop ang pasahan. Ang walang plate sa ulo, out.',
      'Bawas ng isang plate, tapos ulit hanggang isa na lang ang may plate.'
    ],
    tips: ['Biglang i-reverse ang pasahan sa gitna ng kanta.', 'Pag napunit ang plate, out ang plate at ang may hawak.'],
    credit: { by: 'Dig the Games', url: 'https://digthegames.com/p/musical-chairs-with-paper-plates' }
  },
  {
    id: 'cupstack', name: 'Cup Stack Relay', alias: 'Magkakatali na relay',
    players: '6+ (tig-3 bawat team)', time: '5–10 min', age: '8+', place: 'Maluwag na lugar', energy: 3, anim: 'cupstack',
    materials: ['10 plastic cups bawat team', 'Duct tape o kumot para itali', 'Isang mesa bawat team'],
    steps: [
      'Itali nang magkakatabi sa bewang ang bawat team of 3.',
      'Sa malayong mesa ng bawat team, nakalatag ang 10 cups.',
      'Pag sinabing “Go!”, sabay-sabay maglakad papunta sa mesa nang hindi natatanggal ang tali.',
      'Salitan sa paglagay ng tig-isang cup hanggang mabuo ang 4-3-2-1 pyramid.',
      'Unang team na makabalik sa start, panalo.'
    ],
    credit: { by: 'Dig the Games', url: 'https://digthegames.com/p/cup-stack-relay' }
  },
  {
    id: 'nofloor', name: 'Bawal Tumapak sa Sahig', alias: "Can't Touch the Floor",
    players: '4+ (pares)', time: '5–8 min', age: '8+', place: 'Maluwag na sahig', energy: 3, anim: 'paper',
    materials: ['Banig, kumot o malaking tuwalya bawat pares', 'Start at finish line (20–30 talampakan ang layo)'],
    steps: [
      'Isa ang nakatayo sa banig (jumper), isa ang may hawak sa harap na dulo (puller).',
      'Tatalon nang diretso pataas ang jumper.',
      'Habang nasa ere siya, hihilahin ng puller ang banig nang 1–2 feet.',
      'Dapat sa banig lumapag ang jumper — pag sa sahig, balik sa start.',
      'Unang pair na makatawid sa finish line, panalo.'
    ],
    tips: ['Ibang version (“Floor is lava”): lahat nakatayo sa upuan, unan o banig. Habang may music, palipat-lipat sila nang hindi tumatapak sa sahig — ang tumapak, out. Huling natira, panalo.'],
    credit: { by: 'Dig the Games', url: 'https://digthegames.com/p/cant-touch-the-floor' }
  },
  {
    id: 'balloonherd', name: 'Balloon Herding', alias: 'Lobo, bawal kamay',
    players: '8+', time: '4–6 min', age: 'Lahat', place: 'Maluwag na lugar', energy: 3, anim: 'balloon',
    materials: ['Isang lobo bawat player', 'Masking tape o cones para sa start at finish'],
    steps: [
      'Pila lahat sa start, tig-isang lobo.',
      'Bawal ang kamay — ulo, balikat, tuhod o paa lang ang pantulak sa lobo.',
      'Pag sinabing “Go!”, itulak ang lobo papunta sa finish line.',
      'Unang makatawid kasama ang lobo niya, panalo.'
    ],
    tips: ['Pwedeng gawing team relay o paikutin sa cones.'],
    credit: { by: 'Dig the Games', url: 'https://digthegames.com/p/balloon-herding' }
  },
  {
    id: 'shoes', name: 'Hanapin ang Sapatos Mo', alias: 'Find Your Shoes',
    players: '8+ (2 teams)', time: '5–8 min', age: 'Lahat', place: 'Kahit saan', energy: 3, anim: 'bringme',
    materials: ['Sapatos o tsinelas ng lahat', 'Konting maluwag na sahig'],
    steps: [
      'Hubarin lahat ang sapatos, itambak sa gitna, tapos haluin.',
      'Pila ang 2 teams, pareho ang layo sa tambak.',
      'Pag sinabing “Go!”, takbo ang una sa bawat team at hanapin ang sariling pares ng sapatos.',
      'Isuot, balik, tapos i-tag ang kasunod.',
      'Unang team na naka-sapatos lahat, panalo.'
    ],
    tips: ['Mas mahirap: dapat nakatali muna ang sintas bago bumalik.'],
    credit: { by: 'Dig the Games', url: 'https://digthegames.com/p/find-your-shoes' }
  },
  {
    id: 'tug', name: 'Hilahan ng Tissue', alias: 'Paper Towel Tug',
    players: '4+ (tig-2 bawat round)', time: '3–5 min', age: 'Lahat', place: 'Kahit saan', energy: 2, anim: 'tug',
    materials: ['Isang roll ng paper towel o tissue'],
    steps: [
      'Pumunit ng mahabang piraso.',
      '2 players, magkaharap, hawak ang magkabilang dulo.',
      'Hilahan pabalik-balik nang hindi bumibitaw.',
      'Pag napunit na, kung sino ang may hawak pa ng piraso niya, panalo.',
      'Palit agad ng bagong challenger — mabilis na rounds.'
    ],
    credit: { by: 'Dig the Games', url: 'https://digthegames.com/p/paper-towel-tug' }
  },
  {
    id: 'psychiatrist', name: 'Psychiatrist', alias: 'Hulaan ang sakit ng grupo',
    players: '8+', time: '4–5 min', age: '10+', place: 'Indoor', energy: 2, anim: 'henyo',
    materials: ['Upuan para sa lahat maliban sa isa'],
    steps: [
      'Palabasin muna sa kwarto ang isang player — siya ang “psychiatrist”.',
      'Pag-usapan ng grupo ang isang nakakatawang “kondisyon” na gagayahin ng lahat (hal. lahat sasagot na parang sila yung katabi nila).',
      'Pabalikin ang psychiatrist. Magtatanong siya sa iba-ibang tao — bawal sunod-sunod sa iisang tao.',
      'Sasagot lahat ayon sa kondisyon hanggang mahulaan niya.',
      'Pili ng bagong psychiatrist, tapos ulit.'
    ],
    tips: ['Lagyan ng limit: 10 questions lang.'],
    credit: { by: 'Dig the Games', url: 'https://digthegames.com/p/psychiatrist' }
  },
  {
    id: 'cupgrab', name: 'Ulo, Balikat, Tuhod… Cup!', alias: 'Head, Shoulders, Knees…Cup!',
    players: '8+ (pares)', time: '3–5 min', age: 'Lahat', place: 'Kahit saan', energy: 3, anim: 'cupgrab',
    materials: ['Isang plastic cup bawat pares'],
    steps: [
      'Magkaharap ang pair, may cup sa sahig sa gitna nila.',
      'Sisigaw ang host ng body part — hahawakan ito ng players.',
      'Iba-ibahin ang bilis at order ng utos.',
      'Pag sinabing “CUP!”, unang makadampot ng cup ang panalo sa round.',
      'Ang mga nanalo, hahanap ng bagong ka-pair hanggang may isang champion.'
    ],
    tips: ['Lokohin sila: ituro ang ilong pero “tuhod” ang sabihin.'],
    credit: { by: 'Dig the Games', url: 'https://digthegames.com/p/head-shoulders-knees-cup' }
  },
  {
    id: 'coin', name: 'Heads or Tails', alias: 'Tayaan sa barya',
    players: '8+', time: '3–5 min', age: 'Lahat', place: 'Kahit saan', energy: 1, anim: 'coin',
    materials: ['Isang barya'],
    steps: [
      'Lahat nakatayo at kita ang host.',
      'Pili bawat isa: kamay sa ulo = heads, kamay sa puwet = tails.',
      'Ihahagis ng host ang barya, tapos ia-announce kung ano ang lumabas.',
      'Ang mali ang hula, upo.',
      'Ulit hanggang isa o iilan na lang ang nakatayo.'
    ],
    tips: ['Magandang pang-bunot ng winner sa maliit na prize.'],
    credit: { by: 'Dig the Games', url: 'https://digthegames.com/p/heads-or-tails-icebreaker' }
  },
  {
    id: 'cotton', name: 'Bulak sa Kutsara', alias: 'Cotton Ball Scoop',
    players: '6+ (teams)', time: '3–5 min', age: '7+', place: 'Kahit saan', energy: 2, anim: 'relay',
    materials: ['1–2 supot ng cotton balls', 'Dalawang mangkok bawat team', 'Isang kutsara bawat team', 'Blindfold'],
    steps: [
      'Bawat team: bowl na may bulak sa isang dulo, empty bowl sa kabila.',
      'Piringan ang unang player at bigyan ng kutsara.',
      'Sasalukin niya ang bulak at ililipat sa empty bowl — bawal hawakan.',
      'Tanggalin ang piring, tapos pasa sa kasunod.',
      'Pag tapos na lahat, ang team na pinakamaraming nailipat, panalo.'
    ],
    tips: ['Lagyan ng 2-minute time limit bawat team.'],
    credit: { by: 'Dig the Games', url: 'https://digthegames.com/p/cotton-ball-scoop' }
  },
  {
    id: 'write100', name: 'Isulat Hanggang 100', alias: 'Write to 100',
    players: '5+', time: '8–10 min', age: '8+', place: 'Mesa', energy: 2, anim: 'dice',
    materials: ['Isang papel bawat player', 'Isang ballpen', 'Dalawang dice'],
    steps: [
      'Salitan sa pag-roll ng 2 dice.',
      'Unang maka-7, kukunin ang ballpen at magsusulat ng 1, 2, 3… hanggang 100 sa papel niya.',
      'Pag may ibang naka-7, aagawin niya ang ballpen at siya na ang magsusulat sa sarili niyang papel.',
      'Pag may naka-doubles, ipapasa ng lahat ang papel sa left — itutuloy ng nagsusulat ang papel na hawak niya.',
      'Unang papel na umabot sa 100, panalo.'
    ],
    credit: { by: 'Dig the Games', url: 'https://digthegames.com/p/write-to-100' }
  },
  {
    id: 'tossboss', name: 'Toss Boss', alias: 'Tic-tac-toe na hagisan',
    players: '6+', time: '3–5 min', age: 'Lahat', place: 'Kahit saan', energy: 2, anim: 'toss',
    materials: ['3x3 grid sa sahig (tape, chalk o paper plates)', 'Beanbag o tsinelas bawat player/team'],
    steps: [
      'Gawa ng tic-tac-toe grid sa sahig at throw line na 6–10 feet ang layo.',
      'Salitan sa paghagis ng beanbag sa grid.',
      'Lagyan ng X o O ang box kung saan ito bumagsak.',
      'Unang maka-3 in a row, panalo sa round.',
      'I-reset ang grid at bilangin ang points.'
    ],
    tips: ['Lagyan ng tanong ang bawat box na kailangang masagot bago makuha.'],
    credit: { by: 'Dig the Games', url: 'https://digthegames.com/p/toss-boss' }
  },

  /* ---------- More from Dig the Games (TikTok) — summarized in Taglish ---------- */
  {
    id: 'hurdles', name: 'Balloon Hurdles', alias: 'Lobo sa mga hula hoop',
    players: '2+ teams', time: '5–10 min', age: 'Lahat', place: 'Maluwag na lugar', energy: 3, anim: 'hoops',
    materials: ['Isang lobo bawat team', 'Hula hoops (isa bawat kasama sa linya)'],
    steps: [
      'Pila ang bawat team; bawat isa may hawak na hula hoop — ito ang “hurdles”.',
      'Isang player bawat team ang nasa simula ng line, may lobo.',
      'Tatapikin niya ang lobo (kamay o ulo lang) para dumaan sa bawat hoop, sunod-sunod.',
      'Bawal bumagsak ang lobo sa sahig — pag bumagsak, balik sa unang hoop.',
      'Unang makapagdaan ng lobo sa huling hoop, panalo ang team.'
    ],
    credit: { by: 'Dig the Games', url: 'https://www.tiktok.com/@digthegames' }
  },
  {
    id: 'flatten', name: 'Plantsahan ng Papel', alias: 'Paper Flattening Challenge',
    players: 'Pares (2+ pares)', time: '3–5 min', age: '7+', place: 'Mesa', energy: 2, anim: 'flatten',
    materials: ['Ilang nilukot na papel bawat pares (pareho ang bilang)', 'Garden gloves (opsyonal, pang-hirap)'],
    steps: [
      'Mag-pair up. Ang isa, right hand lang ang gamit; ang isa, left hand lang.',
      'Bawat pair may tambak ng nilukot na papel sa harap.',
      'Pag sinabing “Go!”, sabay nilang aayusin at papatagin ang bawat papel — parang iisang tao.',
      'Unang pair na mapatag lahat ng papel, panalo.'
    ],
    tips: ['Mas mahirap at mas nakakatawa: pasuotin sila ng makapal na garden gloves.'],
    credit: { by: 'Dig the Games', url: 'https://www.tiktok.com/@digthegames' }
  },
  {
    id: 'toejam', name: 'Toe Jam Challenge', alias: 'Donut sa hinlalaki ng paa',
    players: '2–6 sabay', time: '3–5 min', age: '8+', place: 'Kahit saan na may sabitan', energy: 2, anim: 'donut',
    materials: ['Donut bawat player', 'Tali o yarn', 'Bar o patpat sa itaas (hal. walis na nakapatong sa dalawang upuan)'],
    steps: [
      'Itali ang donut sa dulo ng tali, isabit sa bar sa taas, tapos itali ang kabilang dulo sa hinlalaki ng paa.',
      'Iangat ang paa para bumaba ang donut papunta sa bibig.',
      'Pag ibinaba ang paa, aangat ulit ang donut — kaya balance lang!',
      'Bawal ang kamay. Unang makaubos, panalo — o mag-timer at bilangin kung sino ang pinakamaraming kagat.'
    ],
    tips: ['Pwede ring pandesal o mamon.'],
    credit: { by: 'Dig the Games', url: 'https://www.tiktok.com/@digthegames' }
  },
  {
    id: 'mirrorstraw', name: 'Straw sa Bote — Salamin Lang', alias: 'Mirror Straw-in-a-Bottle Relay',
    players: '2+ teams (tig-2 pataas)', time: '5–8 min', age: '8+', place: 'Kahit saan', energy: 2, anim: 'mirror',
    materials: ['Isang straw at isang walang lamang bote bawat team', 'Salamin o phone na naka-selfie camera bawat team', 'Timer'],
    steps: [
      'Ilagay ang bote sa likod ng player; nasa harap niya ang salamin o selfie camera.',
      'Hawak ang straw, ipapasok niya ito sa bote gamit lang ang nakikita sa salamin — bawal lumingon!',
      'Pag pumasok, next na kakampi naman. Pag nahulog ang straw, tapos ang turn niya.',
      'After 3–5 minutes, ang team na pinakamaraming naipasok, panalo.'
    ],
    tips: ['Mas mahirap: ilayo ang bote o habaan ang straw.', 'Pwedeng i-coach ng kakampi (kung okay sa host).', 'Bawal lumingon — ang lumingon, sayang ang turn.'],
    credit: { by: 'Dig the Games', url: 'https://www.tiktok.com/@digthegames' }
  },
  {
    id: 'balloonstick', name: 'Ilang Lobo ang Didikit?', alias: 'How Many Balloons Will Stick?',
    players: '2+', time: '3–5 min', age: 'Lahat', place: 'Indoor (may pader)', energy: 2, anim: 'stick',
    materials: ['Maraming lobo', 'Makinis na pader o pinto'],
    steps: [
      'Hipan ang mga lobo at hatiin sa players.',
      'Ikiskis ang lobo sa buhok o damit para magka-static.',
      'Idikit ang mga lobo sa pader within the time limit (hal. 1 minute).',
      'Pag tapos ang oras, bilangin ang mga lobong nakadikit pa — bawal hawakan.',
      'Pinakamarami, panalo. Pag tabla, mabilisang sudden-death round.'
    ],
    credit: { by: 'Dig the Games', url: 'https://www.tiktok.com/@digthegames' }
  },
  {
    id: 'numberhunt', name: 'Number Hunt', alias: 'Unahan sa numero',
    players: '2–4 teams', time: '5–10 min', age: '5+', place: 'May pader o mesa', energy: 3, anim: 'numbers',
    materials: ['Malaking poster na puno ng numero', 'Marker na iba-iba ang kulay (isa bawat team)', 'Isang taga-tawag'],
    steps: [
      'Bawat team may sariling kulay ng marker. Ilagay ang poster kung saan abot ng lahat.',
      'Tatawag ang host ng isang number.',
      'Tig-isang player bawat team ang tatakbo at bibilugan ang number gamit ang kulay nila.',
      'Unang tamang bilog, may point. Balik sa team, tapos ulit.',
      'Sa dulo, bilangin ang bilog ng bawat kulay — pinakamarami, panalo.'
    ],
    credit: { by: 'Dig the Games', url: 'https://www.tiktok.com/@digthegames' }
  },
  {
    id: 'chopstick', name: 'Higanteng Chopsticks Relay', alias: 'Giant Chopsticks Relay',
    players: '2+ teams', time: '5–10 min', age: '8+', place: 'Maluwag na lugar', energy: 3, anim: 'relay',
    materials: ['Dalawang hawakan ng walis o PVC pipe bawat team (higanteng chopsticks)', 'Isang bola bawat team', 'Marker ng start at balikan'],
    steps: [
      'Pila ang bawat team sa start. Ang una may hawak na 2 “chopsticks”.',
      'Iipitin ng chopsticks ang bola at dadalhin hanggang sa balikan, tapos pabalik.',
      'Pag nahulog ang bola, damputin ulit gamit lang ang chopsticks — bawal ang kamay.',
      'Ipasa ang chopsticks at bola sa kasunod. Unang team na matapos, panalo.'
    ],
    tips: ['Pwedeng by pair: tig-isang chopstick bawat isa.'],
    credit: { by: 'Dig the Games', url: 'https://www.tiktok.com/@digthegames' }
  },
  {
    id: 'threeinrow', name: 'Three in a Row', alias: 'Tic-tac-toe relay',
    players: '2 teams ng 3+', time: '5–10 min', age: 'Lahat', place: 'Maluwag na lugar', energy: 3, anim: 'toss',
    materials: ['3x3 grid sa sahig (tape o 9 na paper plates)', '3 piraso bawat team (hal. pulang tsinelas vs asul na tsinelas)'],
    steps: [
      'Pila ang 2 teams sa malayo, magkatapat sa grid.',
      'Pag sinabing “Go!”, takbo ang una sa bawat team at maglalagay ng isang piece sa kahit anong box.',
      'Balik at i-tag ang kasunod. Pag naubos na ang 3 pieces, ang kasunod ay maglilipat ng isa sa sariling piece.',
      'Unang team na maka-3 in a row (pahiga, patayo o pahilis), panalo.'
    ],
    tips: ['Ito ang usual version ng “three in a row” relay — i-adjust kung iba ang napanood mo sa video.'],
    credit: { by: 'Dig the Games', url: 'https://www.tiktok.com/@digthegames' }
  },
  {
    id: 'tablechairs', name: 'Musical Mesa', alias: 'Musical chairs, gamit ang mesa',
    players: '5+', time: '5–10 min', age: 'Lahat', place: 'Kahit saan', energy: 3, anim: 'chairs',
    materials: ['Isang mesa', 'Maliliit na bagay (isang kulang sa bilang ng players)', 'Music'],
    steps: [
      'Ilagay ang mga gamit sa mesa. Iikot ang players sa mesa habang may music.',
      'Habang naglalakad, may utos ang host: “Bilisan!”, “Side step!”, “Paatras!”.',
      'Pag huminto ang music, kukuha bawat isa ng isang gamit sa mesa.',
      'Ang walang nakuha o hindi sumunod sa utos, out. Bawas ng isang gamit.',
      'Ulit hanggang isa na lang — siya ang panalo.'
    ],
    credit: { by: 'Dig the Games', url: 'https://www.tiktok.com/@digthegames' }
  },
  {
    id: 'saytheirname', name: 'Sabihin ang Pangalan!', alias: 'You Know Them… Say Their Name!',
    players: '4+', time: '5–10 min', age: 'Lahat', place: 'Kahit saan', energy: 2, anim: 'charades',
    materials: ['Wala! (opsyonal: listahan ng mga sikat na tao o kamag-anak)'],
    steps: [
      'Bilog lahat.',
      'Ide-describe ng isang player ang isang tao — kamag-anak, friend o artista — nang hindi sinasabi ang pangalan.',
      'Unahan sa pagsigaw ng tamang pangalan.',
      'Pinakamabilis, may point. Ang mabagal, may maliit na parusa (hal. sayaw ng 5 seconds).'
    ],
    tips: ['Perfect sa reunion: i-describe ang mga tito at tita!'],
    credit: { by: 'Dig the Games', url: 'https://www.tiktok.com/@digthegames' }
  },
  {
    id: 'wigsnatch', name: 'Agawan ng Wig', alias: 'Wig Snatch',
    players: '2 (one-on-one)', time: '3–5 min', age: '8+', place: 'Maluwag na lugar', energy: 3, anim: 'duel',
    materials: ['Dalawang wig o kahit anong maisusuot sa ulo (hal. makukulay na plastic bag)'],
    steps: [
      'Magkaharap ang 2 players, may suot na “wig” sa ulo.',
      'Pag sinabing “Go!”, aagawin nila ang wig ng kalaban.',
      'Bantayan ang sarili mong wig — bawal humawak nang matagal o manulak.',
      'Unang makaagaw, panalo. Palit agad ng bagong challenger.'
    ],
    tips: ['Gawa ng bracket para may champion sa dulo.'],
    credit: { by: 'Dig the Games', url: 'https://www.tiktok.com/@digthegames' }
  },
  {
    id: 'cupnoodle', name: 'Cup Noodle Challenge', alias: 'Pool noodle + cup',
    players: '2+', time: '3–5 min', age: '8+', place: 'Maluwag na lugar', energy: 3, anim: 'noodles',
    materials: ['Dalawang pool noodle bawat player', 'Isang plastic cup bawat player'],
    steps: [
      'Bawat player: isang noodle na may cup sa dulo, at isang noodle na pang-hampas.',
      'Hawakan nang patayo ang noodle na may cup — bawal hawakan ang cup.',
      'Gamitin ang kabilang noodle para patumbahin ang cup ng iba, habang binabantayan ang sa’yo.',
      'Pag nahulog ang cup mo, out ka. Huling may cup, panalo.'
    ],
    credit: { by: 'Dig the Games', url: 'https://www.tiktok.com/@digthegames' }
  },
  {
    id: 'dodgerodeo', name: 'Dodgeball Rodeo', alias: 'Isa laban sa lahat',
    players: '6+', time: '5–10 min', age: '8+', place: 'Maluwag na lugar', energy: 3, anim: 'pass',
    materials: ['Malambot na bola', 'Maliliit na bagay na hawak ng mga nasa bilog (hal. panyo, tsinelas)'],
    steps: [
      'Bilog lahat; isang player sa gitna.',
      'Ihahagis ng mga nasa bilog ang bola sa nasa gitna — iiwas siya.',
      'Habang umiiwas, kukunin ng nasa gitna ang mga gamit na hawak ng mga nasa bilog.',
      'Pag natamaan, tapos ang turn niya. Bilangin ang nakuha niya.',
      'Ikot hanggang lahat nakapasok sa gitna — pinakamaraming nakuha, panalo.'
    ],
    tips: ['Malambot na bola lang, at bawal tumama sa ulo.'],
    credit: { by: 'Dig the Games', url: 'https://www.tiktok.com/@digthegames' }
  },
  {
    id: 'updown', name: 'Up or Down', alias: 'Baligtaran ng cups',
    players: '2 teams', time: '2–5 min', age: 'Lahat', place: 'Maluwag na sahig', energy: 3, anim: 'flip',
    materials: ['Maraming plastic cups (20+), nakakalat sa sahig — kalahati nakataob, kalahati nakatihaya'],
    steps: [
      'Hatiin sa 2 teams: Team UP (itatayo ang cups) at Team DOWN (itataob ang cups).',
      'Ikalat ang mga cup sa sahig.',
      'Pag sinabing “Go!”: Team UP, itayo ang mga cup; Team DOWN, itaob — kahit yung kakabaligtad lang ng kalaban.',
      'Pag tapos ang oras (hal. 1 minute), bilangin: mas marami ba ang nakatayo o nakataob?',
      'Ang team na may mas maraming cup sa side nila, panalo.'
    ],
    credit: { by: 'Dig the Games', url: 'https://www.tiktok.com/@digthegames' }
  }
];

/* Word bank for Pinoy Henyo and Charades: 5 categories × 100 words. Family-friendly, no politicians. */
window.BIDA_WORDS = {
  tao: ['Doktor', 'Guro', 'Pulis', 'Bumbero', 'Nars', 'Kartero', 'Tindera', 'Magsasaka', 'Mangingisda', 'Karpintero',
    'Drayber ng jeep', 'Piloto', 'Chef', 'Barbero', 'Manikurista', 'Sundalo', 'Abogado', 'Inhinyero', 'Dentista', 'Pari',
    'Madre', 'Flight attendant', 'Magtataho', 'Security guard', 'Janitor', 'Kusinero', 'Tubero', 'Elektrisyan', 'Mekaniko', 'Sastre',
    'Mananayaw', 'Mang-aawit', 'Artista', 'DJ', 'Photographer', 'Waiter', 'Kahera', 'Bantay ng sari-sari store', 'Tricycle driver', 'Konduktor',
    'Lifeguard', 'Astronaut', 'Superhero', 'Prinsesa', 'Hari', 'Reyna', 'Pirata', 'Wizard', 'Clown', 'Magician',
    'Lola', 'Lolo', 'Ninang', 'Ninong', 'Kuya', 'Ate', 'Bunso', 'Kumare', 'Kumpare', 'Kapitbahay',
    'Bagong kasal', 'Balikbayan', 'OFW', 'Estudyante', 'Principal', 'Coach', 'Referee', 'Boxer', 'Basketbolista', 'Vlogger',
    'Jose Rizal', 'Andres Bonifacio', 'Emilio Aguinaldo', 'Lapu-Lapu', 'Gabriela Silang', 'Melchora Aquino', 'Apolinario Mabini', 'Juan Luna', 'Manny Pacquiao', 'Efren "Bata" Reyes',
    'Hidilyn Diaz', 'Carlos Yulo', 'Lea Salonga', 'Regine Velasquez', 'Sarah Geronimo', 'Vice Ganda', 'Coco Martin', 'Dolphy', 'Nora Aunor', 'Pia Wurtzbach',
    'Catriona Gray', 'Kathryn Bernardo', 'Daniel Padilla', 'Dingdong Dantes', 'Marian Rivera', 'Alden Richards', 'Anne Curtis', 'Jollibee', 'Darna', 'Santa Claus'],
  bagay: ['Walis tingting', 'Banig', 'Kulambo', 'Tabo', 'Electric fan', 'Payong', 'Tsinelas', 'Kaldero', 'Sandok', 'Kawali',
    'Plantsa', 'Sampayan', 'Sipilyo', 'Suklay', 'Salamin', 'Unan', 'Kumot', 'Kutsara', 'Tinidor', 'Baso',
    'Pinggan', 'Bandehado', 'Thermos', 'Rice cooker', 'Ref', 'Telebisyon', 'Remote control', 'Cellphone', 'Charger', 'Headset',
    'Videoke', 'Mikropono', 'Gitara', 'Tambol', 'Lobo', 'Parol', 'Christmas tree', 'Belen', 'Kandila', 'Rosaryo',
    'Bibliya', 'Kalendaryo', 'Orasan', 'Relo', 'Salamin sa mata', 'Sombrero', 'Bag', 'Wallet', 'Susi', 'Padlock',
    'Martilyo', 'Pako', 'Lagari', 'Gunting', 'Tape', 'Lapis', 'Bolpen', 'Kuwaderno', 'Pambura', 'Krayola',
    'Bola', 'Saranggola', 'Yoyo', 'Trumpo', 'Teks', 'Holen', 'Manika', 'Robot', 'Bisikleta', 'Skateboard',
    'Jeepney', 'Tricycle', 'Bangka', 'Eroplano', 'Tren', 'Barko', 'Helmet', 'Kapote', 'Bota', 'Medyas',
    'Sapatos', 'Kamiseta', 'Barong Tagalog', 'Saya', 'Tuwalya', 'Sabon', 'Shampoo', 'Toothpaste', 'Pabango', 'Lipstick',
    'Abaniko', 'Walis tambo', 'Hagdan', 'Pinto', 'Bintana', 'Upuan', 'Mesa', 'Kama', 'Aparador', 'Duyan'],
  hayop: ['Kalabaw', 'Tarsier', 'Agila', 'Butiki', 'Ipis', 'Lamok', 'Langaw', 'Paru-paro', 'Tutubi', 'Gagamba',
    'Langgam', 'Bubuyog', 'Alitaptap', 'Kuliglig', 'Tipaklong', 'Salagubang', 'Uod', 'Suso', 'Palaka', 'Butete',
    'Ahas', 'Bayawak', 'Buwaya', 'Pagong', 'Pawikan', 'Isda', 'Tilapia', 'Bangus', 'Pating', 'Balyena',
    'Dolphin', 'Pugita', 'Pusit', 'Alimango', 'Hipon', 'Talaba', 'Kabibe', 'Dikya', 'Starfish', 'Seahorse',
    'Manok', 'Tandang', 'Sisiw', 'Pato', 'Gansa', 'Kalapati', 'Maya', 'Loro', 'Kuwago', 'Lawin',
    'Penguin', 'Ostrich', 'Flamingo', 'Paboreal', 'Baboy', 'Baka', 'Kambing', 'Tupa', 'Kabayo', 'Asno',
    'Aso', 'Pusa', 'Kuneho', 'Daga', 'Hamster', 'Paniki', 'Unggoy', 'Gorilya', 'Leon', 'Tigre',
    'Leopardo', 'Elepante', 'Rhino', 'Hippo', 'Giraffe', 'Zebra', 'Kamelyo', 'Kangaroo', 'Koala', 'Panda',
    'Oso', 'Lobo (wolf)', 'Soro (fox)', 'Usa', 'Baboy-ramo', 'Pangolin', 'Tamaraw', 'Philippine eagle', 'Dinosaur', 'Dragon',
    'Unicorn', 'Chameleon', 'Gamu-gamo', 'Tuko', 'Alakdan', 'Alupihan', 'Linta', 'Bulate', 'Talangka', 'Sea urchin'],
  lugar: ['Boracay', 'Luneta', 'Intramuros', 'Baguio', 'Mayon Volcano', 'Chocolate Hills', 'Banaue Rice Terraces', 'Palawan', 'El Nido', 'Siargao',
    'Vigan', 'Tagaytay', 'Taal Volcano', 'Cebu', 'Davao', 'Bohol', 'Iloilo', 'Bacolod', 'Pampanga', 'Batangas',
    'Manila Bay', 'Rizal Park', 'Quiapo Church', 'Binondo', 'Divisoria', 'EDSA', 'NAIA', 'MOA', 'Enchanted Kingdom', 'Star City',
    'Palengke', 'Simbahan', 'Paaralan', 'Ospital', 'Munisipyo', 'Barangay hall', 'Sari-sari store', 'Karinderya', 'Panaderya', 'Botika',
    'Sinehan', 'Mall', 'Grocery', 'Bangko', 'Post office', 'Istasyon ng pulis', 'Bumbero station', 'Terminal ng bus', 'Pantalan', 'Paliparan',
    'Beach', 'Bundok', 'Ilog', 'Lawa', 'Talon (waterfall)', 'Kuweba', 'Bukid', 'Gubat', 'Isla', 'Disyerto',
    'Kusina', 'Sala', 'Kuwarto', 'Banyo', 'Garahe', 'Bakuran', 'Bubong', 'Hardin', 'Terasa', 'Bodega',
    'Basketball court', 'Gym', 'Swimming pool', 'Resort', 'Hotel', 'Zoo', 'Museo', 'Library', 'Plaza', 'Sementeryo',
    'Japan', 'Korea', 'Amerika', 'Hong Kong', 'Singapore', 'Dubai', 'Paris', 'Disneyland', 'Great Wall of China', 'Buwan',
    'Outer space', 'Ilalim ng dagat', 'North Pole', 'Food court', 'Videoke bar', 'Perya', 'Sabungan', 'Barberya', 'Parlor', 'Laundry shop'],
  pagkain: ['Adobo', 'Sinigang', 'Lechon', 'Halo-halo', 'Balut', 'Kare-kare', 'Sisig', 'Pancit', 'Lumpia', 'Tinola',
    'Bulalo', 'Nilaga', 'Menudo', 'Kaldereta', 'Afritada', 'Mechado', 'Dinuguan', 'Bicol Express', 'Laing', 'Pinakbet',
    'Chopsuey', 'Tortang talong', 'Daing na bangus', 'Tuyo', 'Tapa', 'Longganisa', 'Tocino', 'Hotdog', 'Itlog na maalat', 'Sinangag',
    'Lugaw', 'Arroz caldo', 'Champorado', 'Goto', 'Mami', 'Batchoy', 'Pares', 'Siopao', 'Siomai', 'Kikiam',
    'Fishball', 'Kwek-kwek', 'Isaw', 'Barbecue', 'Betamax', 'Adidas (paa ng manok)', 'Chicharon', 'Mani', 'Popcorn', 'Kropek',
    'Turon', 'Banana cue', 'Kamote cue', 'Maruya', 'Bibingka', 'Puto bumbong', 'Puto', 'Kutsinta', 'Sapin-sapin', 'Biko',
    'Suman', 'Palitaw', 'Leche flan', 'Ube halaya', 'Buko pie', 'Ensaymada', 'Pandesal', 'Spanish bread', 'Monay', 'Taho',
    'Sorbetes', 'Mais con yelo', 'Buko juice', 'Sago\'t gulaman', 'Kape', 'Tsokolate', 'Calamansi juice', 'Mangga', 'Saging', 'Pakwan',
    'Durian', 'Lansones', 'Rambutan', 'Santol', 'Bayabas', 'Papaya', 'Pinya', 'Niyog', 'Kamatis', 'Talong',
    'Ampalaya', 'Kalabasa', 'Sitaw', 'Kangkong', 'Okra', 'Spaghetti', 'Fried chicken', 'Burger', 'Pizza', 'Cake']
};
window.BIDA_WORD_CATS = [['tao', 'Tao'], ['bagay', 'Bagay'], ['hayop', 'Hayop'], ['lugar', 'Lugar'], ['pagkain', 'Pagkain']];
