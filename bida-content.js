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
      ['meal', 'Noche Buena / Kainan', 60],
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
      'Ihilera ang mga upuan, magkakatalikod. Isang upuan ang kulang sa bilang ng players.',
      'Paikutin ang mga players sa mga upuan habang tumutugtog ang music.',
      'Biglang ihinto ang music — uupo ang lahat sa pinakamalapit na upuan.',
      'Ang walang naupuan, out. Magtanggal ng isang upuan.',
      'Ulitin hanggang dalawa na lang ang players at isang upuan — ang makaupo, panalo!'
    ],
    tips: ['I-fade ang music, hindi i-stop agad — mas exciting.', 'Gamitin ang Talk button para ianunsyo kung sino ang out.']
  },
  {
    id: 'paperdance', name: 'Paper Dance', alias: 'Newspaper Dance',
    players: '4–10 pares', time: '10–15 min', age: 'Teens & adults', place: 'Indoor', energy: 3,
    anim: 'paper',
    materials: ['Isang dyaryo bawat pares', 'Music', 'Premyo'],
    steps: [
      'Bigyan ng isang buong dyaryo ang bawat pares.',
      'Sumayaw sa ibabaw ng dyaryo habang may music.',
      'Pag tumigil ang music, itiklop ang dyaryo sa kalahati.',
      'Ulitin — pwedeng buhatin ang partner para magkasya!',
      'Ang pares na lumabas sa dyaryo, out. Ang huling pares, panalo.'
    ],
    tips: ['Siguraduhing hindi madulas ang sahig.']
  },
  {
    id: 'henyo', name: 'Pinoy Henyo', alias: 'Guess the Word',
    players: '2 bawat team', time: '15–20 min', age: '10+', place: 'Kahit saan', energy: 2,
    anim: 'henyo',
    materials: ['Papel / index cards na may salita', 'Tape o headband', 'Timer (2 minuto)'],
    steps: [
      'Bawat team ay may isang manghuhula at isang sumasagot.',
      'Idikit sa noo ng manghuhula ang salita — hindi niya ito nakikita.',
      'Magtatanong siya; ang sagot lang ay “Oo”, “Hindi”, o “Pwede”.',
      'May 2 minuto para mahulaan ang salita.',
      'Pinakamaraming nahulaan o pinakamabilis — panalo!'
    ],
    tips: ['Gumawa ng categories: tao, bagay, pagkain, lugar.', 'Gamitin ang Ding sa tamang sagot at Buzzer sa time’s up.']
  },
  {
    id: 'bringme', name: 'Bring Me', alias: '',
    players: '3–6 teams', time: '10–15 min', age: 'Lahat', place: 'Kahit saan', energy: 3,
    anim: 'bringme',
    materials: ['Listahan ng mga ipapadala (hal. tsinelas, ₱20, selfie with lola)', 'Table sa harap', 'Premyo'],
    steps: [
      'Hatiin sa mga team at pumili ng runner bawat team.',
      'Sasabihin ng host: “Bring me… isang pulang tsinelas!”',
      'Uunahan ng mga runner na dalhin ito sa host.',
      'Ang unang makapagdala, may 1 puntos.',
      'Pinakamaraming puntos pagkatapos ng 10 rounds — panalo!'
    ],
    tips: ['Ihalo ang madali at mahirap na items.', 'Mag-ingat sa pagtakbo kapag may mga bata.']
  },
  {
    id: 'stopdance', name: 'Stop Dance', alias: 'Freeze Dance',
    players: '5+', time: '5–10 min', age: 'Lahat (lalo na bata)', place: 'Indoor / Outdoor', energy: 3,
    anim: 'freeze',
    materials: ['Music', 'Premyo'],
    steps: [
      'Sumayaw ang lahat habang may music.',
      'Pag tumigil ang music — freeze! Bawal gumalaw.',
      'Ang gumalaw, out.',
      'Ulitin hanggang isa na lang ang natitira.'
    ],
    tips: ['Perfect gamitin ang mabilis na fade-out sa music panel.']
  },
  {
    id: 'relay', name: 'Calamansi Relay', alias: 'Spoon Relay',
    players: '2–4 teams', time: '10–15 min', age: 'Lahat', place: 'Outdoor / maluwag', energy: 3,
    anim: 'relay',
    materials: ['Kutsara bawat team', 'Calamansi (o itlog kung matapang)', 'Marker para sa start at finish'],
    steps: [
      'Pumila ang bawat team sa starting line.',
      'Kagatin ang kutsara at ipatong ang calamansi.',
      'Maglakad papunta sa marker at bumalik nang hindi nahuhulog ang calamansi.',
      'Ipasa ang kutsara sa susunod — bawal hawakan ng kamay.',
      'Ang unang team na matapos, panalo!'
    ],
    tips: ['Gumamit ng hilaw na itlog para sa adult round — mas maraming tawanan.']
  },
  {
    id: 'whisper', name: 'Pass the Message', alias: 'Telephone',
    players: '2 teams ng 6+', time: '10 min', age: '7+', place: 'Kahit saan', energy: 1,
    anim: 'whisper',
    materials: ['Papel na may mga mensahe', 'Ballpen'],
    steps: [
      'Pumila ang bawat team nang magkakasunod.',
      'Ibulong ng host ang mensahe sa unang tao.',
      'Ibubulong niya ito sa susunod — isang beses lang.',
      'Isusulat o sasabihin ng huling tao ang narinig niya.',
      'Pinakamalapit sa original — panalo!'
    ],
    tips: ['Gumamit ng tongue-twister: “Pitong puting pating”.']
  },
  {
    id: 'charades', name: 'Pinoy Charades', alias: 'Act it out',
    players: '2 teams', time: '15–20 min', age: '8+', place: 'Kahit saan', energy: 2,
    anim: 'charades',
    materials: ['Mga card na may pelikula, kanta o salita', 'Timer (1 minuto)'],
    steps: [
      'Hatiin sa dalawang team.',
      'Isang miyembro ang bubunot ng card at i-aakto ito nang walang salita.',
      'Huhulaan ng team niya sa loob ng 1 minuto.',
      'Tamang hula = 1 puntos. Pinakamaraming puntos — panalo!'
    ],
    tips: ['Gumamit ng Pinoy teleserye, OPM at pagkain bilang categories.']
  },
  {
    id: 'hephep', name: 'Hep Hep Hooray', alias: '',
    players: '8+', time: '5–10 min', age: 'Lahat', place: 'Kahit saan', energy: 2,
    anim: 'hephep',
    materials: ['Wala! Boses lang.'],
    steps: [
      'Bumuo ng bilog. Ang host ang magtuturo kung kanino “Hep hep” at kanino “Hooray”.',
      'Ang nasa kaliwa ay sisigaw ng “Hep hep!”, ang nasa kanan ay “Hooray!”.',
      'Paiikutin ng host — kapag tinuro ka, sumagot agad nang tama.',
      'Ang nagkamali o nabagal, out.'
    ],
    tips: ['Bilisan unti-unti para mas nakakatawa.']
  },
  {
    id: 'longestline', name: 'Longest Line', alias: '',
    players: '2–4 teams', time: '10 min', age: 'Teens & adults', place: 'Maluwag na sahig', energy: 3,
    anim: 'line',
    materials: ['Gamit ng mga players mismo (sinturon, sapatos, jacket…)', 'Timer (3 minuto)'],
    steps: [
      'Bawat team ay may 3 minuto.',
      'Gamit ang kahit anong dala nila, gumawa ng pinakamahabang linya sa sahig.',
      'Bawal kumuha sa ibang team.',
      'Pinakamahabang tuloy-tuloy na linya — panalo!'
    ],
    tips: ['Magtakda ng limitasyon kung hanggang saan ang pwedeng tanggalin.']
  },
  {
    id: 'balloon', name: 'Putok Lobo', alias: 'Balloon Stomp',
    players: '6–20', time: '5–10 min', age: '7+', place: 'Maluwag na lugar', energy: 3,
    anim: 'balloon',
    materials: ['Lobo bawat player', 'Tali o yarn'],
    steps: [
      'Itali ang lobo sa bukong-bukong ng bawat player.',
      'Sa hudyat, subukang putukin ang lobo ng iba gamit ang paa.',
      'Protektahan ang sarili mong lobo!',
      'Ang huling may buong lobo — panalo!'
    ],
    tips: ['Paghiwalayin ang mga bata at matatanda.']
  },
  {
    id: 'jakenpoy', name: 'Bato Bato Pik Tournament', alias: 'Jack-en-poy',
    players: '8–32', time: '10 min', age: 'Lahat', place: 'Kahit saan', energy: 2,
    anim: 'jakenpoy',
    materials: ['Wala! Kamay lang.', 'Premyo para sa champion'],
    steps: [
      'Magpares-pares ang lahat.',
      'Maglaro ng Bato Bato Pik — best of 3.',
      'Ang talo ay magiging cheerer ng nanalo at susunod sa kanya.',
      'Paglaban-labanin ang mga nanalo hanggang dalawa na lang — final match!'
    ],
    tips: ['Ang “cheer train” ang pinakamasayang parte — hayaan silang mag-ingay.']
  },
  {
    id: 'survey', name: 'Survey Says: Pamilya Edition', alias: 'Top 5 Answers',
    players: '2 teams ng 5', time: '15–20 min', age: '10+', place: 'Kahit saan', energy: 2,
    anim: 'feud',
    materials: ['Mga tanong na may top 5 sagot (hal. “Ulam tuwing Pasko”)', 'Board o papel para sa score', 'Buzzer o bell'],
    steps: [
      'Dalawang team, tig-isang representative sa harap.',
      'Babasahin ng host ang tanong — ang unang pumindot ng buzzer ang sasagot.',
      'Kung nasa top 5, may puntos ang team.',
      'Tatlong mali — ang kabilang team ang may chance mag-steal.',
      'Pinakamaraming puntos pagkatapos ng 5 tanong — panalo!'
    ],
    tips: ['Gawin ang survey sa group chat bago ang event para totoo ang sagot.', 'Ding sa tama, Buzzer sa mali — nasa Sound Lab.']
  },
  {
    id: 'hotpotato', name: 'Mainit na Patatas', alias: 'Hot Potato',
    players: '8+', time: '5–10 min', age: 'Lahat', place: 'Kahit saan', energy: 2,
    anim: 'pass',
    materials: ['Bola, unan o kahit anong bagay', 'Music', 'Forfeit cards (opsyonal)'],
    steps: [
      'Umupo o tumayo nang pabilog.',
      'Ipasa ang bola habang may music.',
      'Pag tumigil ang music, ang may hawak ng bola — out (o gagawa ng forfeit).',
      'Ulitin hanggang isa na lang ang natitira.'
    ],
    tips: ['Lagyan ng forfeit: kumanta, sumayaw, o mag-share ng embarrassing story.']
  },

  /* ---------- From Dig the Games (@digthegames) — rules paraphrased, credited with a link ---------- */
  {
    id: 'plates', name: 'Musical Plates', alias: 'Musical chairs, pero plato',
    players: '5+', time: '5–10 min', age: 'Lahat', place: 'Kahit saan', energy: 3, anim: 'pass',
    materials: ['Paper plates (isang kulang sa bilang ng players)', 'Music'],
    steps: [
      'Bilog ang lahat; bawat isa may plato, pero isang plato ang kulang.',
      'Habang may music, ipasa ang mga plato — nakataas lang sa ulo.',
      'Pag tumigil ang music, hinto ang pasahan. Ang walang platong nakataas, out.',
      'Bawasan ng isang plato at ulitin hanggang isa na lang ang may plato.'
    ],
    tips: ['Biglang ibaliktad ang direksyon ng pasa sa gitna ng kanta.', 'Kung napunit ang plato, out ang plato at ang may hawak.'],
    credit: { by: 'Dig the Games', url: 'https://digthegames.com/p/musical-chairs-with-paper-plates' }
  },
  {
    id: 'cupstack', name: 'Cup Stack Relay', alias: 'Magkakatali na relay',
    players: '6+ (tig-3 bawat team)', time: '5–10 min', age: '8+', place: 'Maluwag na lugar', energy: 3, anim: 'cupstack',
    materials: ['10 plastic cups bawat team', 'Duct tape o kumot para itali', 'Isang mesa bawat team'],
    steps: [
      'Itali nang magkakatabi sa baywang ang bawat team na tatlo.',
      'Sa malayong mesa ng bawat team, nakalatag ang 10 cups.',
      'Sa hudyat, sabay-sabay na maglakad papunta sa mesa nang hindi natatanggal ang tali.',
      'Salitan sa paglagay ng tig-isang cup hanggang mabuo ang pyramid na 4-3-2-1.',
      'Ang unang team na makabalik sa start, panalo.'
    ],
    credit: { by: 'Dig the Games', url: 'https://digthegames.com/p/cup-stack-relay' }
  },
  {
    id: 'nofloor', name: 'Bawal Tumapak sa Sahig', alias: "Can't Touch the Floor",
    players: '4+ (pares)', time: '5–8 min', age: '8+', place: 'Maluwag na sahig', energy: 3, anim: 'paper',
    materials: ['Banig, kumot o malaking tuwalya bawat pares', 'Start at finish line (20–30 talampakan ang layo)'],
    steps: [
      'Isa ang nakatayo sa banig (jumper), isa ang humahawak sa harap na gilid (puller).',
      'Tatalon nang diretso pataas ang jumper.',
      'Habang nasa ere siya, hihilahin ng puller ang banig nang isa o dalawang talampakan.',
      'Dapat sa banig lumapag ang jumper — pag tumapak sa sahig, balik sa start.',
      'Ang unang pares na makatawid sa finish line, panalo.'
    ],
    credit: { by: 'Dig the Games', url: 'https://digthegames.com/p/cant-touch-the-floor' }
  },
  {
    id: 'balloonherd', name: 'Balloon Herding', alias: 'Lobo, bawal kamay',
    players: '8+', time: '4–6 min', age: 'Lahat', place: 'Maluwag na lugar', energy: 3, anim: 'balloon',
    materials: ['Isang lobo bawat player', 'Masking tape o cones para sa start at finish'],
    steps: [
      'Pumila ang lahat sa start, tig-isang lobo.',
      'Bawal ang kamay — ulo, balikat, tuhod o paa lang ang pang-tulak sa lobo.',
      'Sa hudyat, itulak ang lobo papunta sa finish line.',
      'Ang unang makatawid kasama ang lobo niya, panalo.'
    ],
    tips: ['Pwedeng gawing team relay o paikutin sa mga cone.'],
    credit: { by: 'Dig the Games', url: 'https://digthegames.com/p/balloon-herding' }
  },
  {
    id: 'shoes', name: 'Hanapin ang Sapatos Mo', alias: 'Find Your Shoes',
    players: '8+ (2 teams)', time: '5–8 min', age: 'Lahat', place: 'Kahit saan', energy: 3, anim: 'bringme',
    materials: ['Sapatos o tsinelas ng lahat', 'Konting maluwag na sahig'],
    steps: [
      'Hubarin ng lahat ang sapatos at itambak sa gitna, tapos haluin.',
      'Pumila ang dalawang team sa magkasinglayong pwesto mula sa tambak.',
      'Sa hudyat, tatakbo ang una sa bawat team at hahanapin ang sarili niyang pares.',
      'Isusuot, babalik, at ita-tag ang kasunod.',
      'Ang unang team na naka-sapatos na lahat, panalo.'
    ],
    tips: ['Mas mahirap: kailangang itali muna ang sintas bago bumalik.'],
    credit: { by: 'Dig the Games', url: 'https://digthegames.com/p/find-your-shoes' }
  },
  {
    id: 'tug', name: 'Hilahan ng Tissue', alias: 'Paper Towel Tug',
    players: '4+ (tig-2 bawat round)', time: '3–5 min', age: 'Lahat', place: 'Kahit saan', energy: 2, anim: 'tug',
    materials: ['Isang roll ng paper towel o tissue'],
    steps: [
      'Pumunit ng mahabang piraso.',
      'Dalawang player, magkaharap, hawak ang magkabilang dulo.',
      'Hilahan pabalik-balik nang hindi bumibitaw.',
      'Pag napunit na, ang may hawak pa ng piraso niya ang panalo.',
      'Palitan agad ng bagong challenger — mabilis na rounds.'
    ],
    credit: { by: 'Dig the Games', url: 'https://digthegames.com/p/paper-towel-tug' }
  },
  {
    id: 'psychiatrist', name: 'Psychiatrist', alias: 'Hulaan ang sakit ng grupo',
    players: '8+', time: '4–5 min', age: '10+', place: 'Indoor', energy: 2, anim: 'henyo',
    materials: ['Upuan para sa lahat maliban sa isa'],
    steps: [
      'Ilabas sa kwarto ang isang player — siya ang "psychiatrist".',
      'Magkasundo ang grupo sa isang nakakatawang "kondisyon" na aakto ng lahat (hal. lahat sumasagot na parang katabi nila sila).',
      'Pabalikin ang psychiatrist. Magtatanong siya sa iba-ibang tao — bawal sunod-sunod sa iisang tao.',
      'Sasagot ang lahat ayon sa kondisyon hanggang mahulaan niya ito.',
      'Pumili ng bagong psychiatrist at ulitin.'
    ],
    tips: ['Lagyan ng limit: 10 tanong lang.'],
    credit: { by: 'Dig the Games', url: 'https://digthegames.com/p/psychiatrist' }
  },
  {
    id: 'cupgrab', name: 'Ulo, Balikat, Tuhod… Cup!', alias: 'Head, Shoulders, Knees…Cup!',
    players: '8+ (pares)', time: '3–5 min', age: 'Lahat', place: 'Kahit saan', energy: 3, anim: 'cupgrab',
    materials: ['Isang plastic cup bawat pares'],
    steps: [
      'Magkaharap ang magkapares, may cup sa sahig sa gitna nila.',
      'Sisigaw ang host ng parte ng katawan — hahawakan ito ng players.',
      'Paiba-ibahin ang bilis at pagkakasunod ng utos.',
      'Pag sinabing "CUP!", ang unang makadampot ng cup ang panalo sa round.',
      'Ang mga nanalo, hahanap ng bagong kapares hanggang may isang champion.'
    ],
    tips: ['Lokohin sila: ituro ang ilong pero "tuhod" ang sabihin.'],
    credit: { by: 'Dig the Games', url: 'https://digthegames.com/p/head-shoulders-knees-cup' }
  },
  {
    id: 'coin', name: 'Heads or Tails', alias: 'Tayaan sa barya',
    players: '8+', time: '3–5 min', age: 'Lahat', place: 'Kahit saan', energy: 1, anim: 'coin',
    materials: ['Isang barya'],
    steps: [
      'Lahat nakatayo at nakikita ang host.',
      'Pipili ang bawat isa: kamay sa ulo = heads, kamay sa puwet = tails.',
      'Ihahagis ng host ang barya at iaanunsyo ang lumabas.',
      'Ang mali ang hula, uupo.',
      'Ulitin hanggang isa o iilan na lang ang nakatayo.'
    ],
    tips: ['Magandang pang-bunot ng mananalo sa maliit na premyo.'],
    credit: { by: 'Dig the Games', url: 'https://digthegames.com/p/heads-or-tails-icebreaker' }
  },
  {
    id: 'cotton', name: 'Bulak sa Kutsara', alias: 'Cotton Ball Scoop',
    players: '6+ (teams)', time: '3–5 min', age: '7+', place: 'Kahit saan', energy: 2, anim: 'relay',
    materials: ['1–2 supot ng cotton balls', 'Dalawang mangkok bawat team', 'Isang kutsara bawat team', 'Blindfold'],
    steps: [
      'Bawat team: mangkok na may bulak sa isang dulo, walang laman sa kabila.',
      'Piringan ang unang player at bigyan ng kutsara.',
      'Sasalukin niya ang bulak at ililipat sa walang lamang mangkok — bawal hawakan.',
      'Tanggalin ang piring at ipasa sa susunod.',
      'Pagkatapos ng lahat, ang team na pinakamaraming nailipat ang panalo.'
    ],
    tips: ['Lagyan ng 2 minutong time limit bawat team.'],
    credit: { by: 'Dig the Games', url: 'https://digthegames.com/p/cotton-ball-scoop' }
  },
  {
    id: 'write100', name: 'Isulat Hanggang 100', alias: 'Write to 100',
    players: '5+', time: '8–10 min', age: '8+', place: 'Mesa', energy: 2, anim: 'dice',
    materials: ['Isang papel bawat player', 'Isang ballpen', 'Dalawang dice'],
    steps: [
      'Salitan sa pag-roll ng dalawang dice.',
      'Ang unang maka-7, kukunin ang ballpen at magsusulat ng 1, 2, 3… hanggang 100 sa papel niya.',
      'Pag may ibang naka-7, aagawin niya ang ballpen at siya na ang magsusulat sa sarili niyang papel.',
      'Pag may naka-doubles, ipapasa ng lahat ang papel sa kaliwa — itutuloy ng nagsusulat ang papel na hawak niya.',
      'Ang unang papel na umabot sa 100, panalo.'
    ],
    credit: { by: 'Dig the Games', url: 'https://digthegames.com/p/write-to-100' }
  },
  {
    id: 'tossboss', name: 'Toss Boss', alias: 'Tic-tac-toe na hagisan',
    players: '6+', time: '3–5 min', age: 'Lahat', place: 'Kahit saan', energy: 2, anim: 'toss',
    materials: ['3x3 grid sa sahig (tape, chalk o paper plates)', 'Beanbag o tsinelas bawat player/team'],
    steps: [
      'Gumawa ng tic-tac-toe grid sa sahig at linya ng hagisan 6–10 talampakan ang layo.',
      'Salitan sa paghagis ng beanbag sa grid.',
      'Markahan ng X o O ang kahon kung saan ito bumagsak.',
      'Ang unang makatatlo nang diretso, panalo sa round.',
      'I-reset ang grid at magbilang ng puntos.'
    ],
    tips: ['Lagyan ng tanong ang bawat kahon na kailangang sagutin bago makuha.'],
    credit: { by: 'Dig the Games', url: 'https://digthegames.com/p/toss-boss' }
  }
];
