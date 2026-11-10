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
    tips: ['Ibang bersyon ("Floor is lava"): lahat nakatayo sa upuan, unan o banig. Pag may music, lilipat-lipat sila nang hindi tumatapak sa sahig — ang tumapak, out. Ang huling natira, panalo.'],
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
  },

  /* ---------- More from Dig the Games (TikTok) — summarized in Taglish ---------- */
  {
    id: 'hurdles', name: 'Balloon Hurdles', alias: 'Lobo sa mga hula hoop',
    players: '2+ teams', time: '5–10 min', age: 'Lahat', place: 'Maluwag na lugar', energy: 3, anim: 'hoops',
    materials: ['Isang lobo bawat team', 'Hula hoops (isa bawat kasama sa linya)'],
    steps: [
      'Pumila ang bawat team; bawat isa may hawak na hula hoop — ito ang "hurdles".',
      'Isang player mula sa bawat team ang nasa simula ng linya, may lobo.',
      'Tatapikin niya ang lobo (kamay o ulo lang) para dumaan sa bawat hoop, sunod-sunod.',
      'Bawal bumagsak ang lobo sa sahig — pag bumagsak, balik sa unang hoop.',
      'Ang unang makapagdaan ng lobo sa huling hoop, panalo ang team.'
    ],
    credit: { by: 'Dig the Games', url: 'https://www.tiktok.com/@digthegames' }
  },
  {
    id: 'flatten', name: 'Plantsahan ng Papel', alias: 'Paper Flattening Challenge',
    players: 'Pares (2+ pares)', time: '3–5 min', age: '7+', place: 'Mesa', energy: 2, anim: 'flatten',
    materials: ['Ilang nilukot na papel bawat pares (pareho ang bilang)', 'Garden gloves (opsyonal, pang-hirap)'],
    steps: [
      'Magpares-pares. Ang isa, kanang kamay lang ang gamit; ang isa, kaliwang kamay lang.',
      'Bawat pares may tambak ng nilukot na papel sa harap.',
      'Sa hudyat, sabay nilang aayusin at papatagin ang bawat papel — parang iisang tao.',
      'Ang unang pares na mapatag lahat ng papel, panalo.'
    ],
    tips: ['Mas mahirap at mas nakakatawa: pagsuotin sila ng makapal na garden gloves.'],
    credit: { by: 'Dig the Games', url: 'https://www.tiktok.com/@digthegames' }
  },
  {
    id: 'toejam', name: 'Toe Jam Challenge', alias: 'Donut sa hinlalaki ng paa',
    players: '2–6 sabay', time: '3–5 min', age: '8+', place: 'Kahit saan na may sabitan', energy: 2, anim: 'donut',
    materials: ['Donut bawat player', 'Tali o yarn', 'Bar o patpat sa itaas (hal. walis na nakapatong sa dalawang upuan)'],
    steps: [
      'Itali ang donut sa dulo ng tali, isabit sa bar sa itaas, at itali ang kabilang dulo sa hinlalaki ng paa.',
      'Iangat ang paa para bumaba ang donut papunta sa bibig.',
      'Pag ibinaba ang paa, aangat ulit ang donut — kaya kailangang balanse!',
      'Bawal ang kamay. Ang unang makaubos, panalo — o mag-timer at bilangin kung sino ang pinakamaraming nakagat.'
    ],
    tips: ['Pwedeng pandesal o mamon ang gamitin.'],
    credit: { by: 'Dig the Games', url: 'https://www.tiktok.com/@digthegames' }
  },
  {
    id: 'mirrorstraw', name: 'Straw sa Bote — Salamin Lang', alias: 'Mirror Straw-in-a-Bottle Relay',
    players: '2+ teams (tig-2 pataas)', time: '5–8 min', age: '8+', place: 'Kahit saan', energy: 2, anim: 'mirror',
    materials: ['Isang straw at isang walang lamang bote bawat team', 'Salamin o phone na naka-selfie camera bawat team', 'Timer'],
    steps: [
      'Ilagay ang bote sa likod ng player; nasa harap niya ang salamin o selfie camera.',
      'Hawak ang straw, ipapasok niya ito sa bote gamit lang ang nakikita sa salamin — bawal lumingon!',
      'Pag pumasok, ang susunod na kakampi naman. Pag nahulog ang straw, tapos ang turn niya.',
      'Pagkatapos ng 3–5 minuto, ang team na pinakamaraming naipasok, panalo.'
    ],
    tips: ['Mas mahirap: ilayo ang bote o pahabain ang straw.', 'Pwedeng i-coach ng kakampi (kung payag ang host).', 'Bawal lumingon — ang lumingon, sayang ang turn.'],
    credit: { by: 'Dig the Games', url: 'https://www.tiktok.com/@digthegames' }
  },
  {
    id: 'balloonstick', name: 'Ilang Lobo ang Didikit?', alias: 'How Many Balloons Will Stick?',
    players: '2+', time: '3–5 min', age: 'Lahat', place: 'Indoor (may pader)', energy: 2, anim: 'stick',
    materials: ['Maraming lobo', 'Makinis na pader o pinto'],
    steps: [
      'Hipan ang mga lobo at hatiin sa mga players.',
      'Ikiskis ang lobo sa buhok o damit para magka-static.',
      'Idikit ang mga lobo sa pader sa loob ng takdang oras (hal. 1 minuto).',
      'Pagkatapos ng oras, bilangin ang mga lobong nakadikit pa — bawal hawakan.',
      'Pinakamarami, panalo. Pag tabla, isang mabilisang sudden-death round.'
    ],
    credit: { by: 'Dig the Games', url: 'https://www.tiktok.com/@digthegames' }
  },
  {
    id: 'numberhunt', name: 'Number Hunt', alias: 'Unahan sa numero',
    players: '2–4 teams', time: '5–10 min', age: '5+', place: 'May pader o mesa', energy: 3, anim: 'numbers',
    materials: ['Malaking poster na puno ng numero', 'Marker na iba-iba ang kulay (isa bawat team)', 'Isang taga-tawag'],
    steps: [
      'Bawat team may sariling kulay ng marker. Ilagay ang poster kung saan maaabot ng lahat.',
      'Tatawag ang host ng isang numero.',
      'Tig-isang player mula sa bawat team ang tatakbo at bibilugan ang numero gamit ang kulay nila.',
      'Ang unang tamang bilog ang may puntos. Bumalik sa team at ulitin.',
      'Sa dulo, bilangin ang bilog ng bawat kulay — pinakamarami, panalo.'
    ],
    credit: { by: 'Dig the Games', url: 'https://www.tiktok.com/@digthegames' }
  },
  {
    id: 'chopstick', name: 'Higanteng Chopsticks Relay', alias: 'Giant Chopsticks Relay',
    players: '2+ teams', time: '5–10 min', age: '8+', place: 'Maluwag na lugar', energy: 3, anim: 'relay',
    materials: ['Dalawang hawakan ng walis o PVC pipe bawat team (higanteng chopsticks)', 'Isang bola bawat team', 'Marker ng start at balikan'],
    steps: [
      'Bawat team, pumila sa start. Ang una ay may hawak na dalawang "chopsticks".',
      'Iipitin ng chopsticks ang bola at dadalhin ito hanggang sa balikan at pabalik.',
      'Pag nahulog ang bola, damputin ulit gamit lang ang chopsticks — bawal ang kamay.',
      'Ipasa ang chopsticks at bola sa susunod. Ang unang team na matapos, panalo.'
    ],
    tips: ['Pwedeng pares: tig-isang chopstick ang bawat isa.'],
    credit: { by: 'Dig the Games', url: 'https://www.tiktok.com/@digthegames' }
  },
  {
    id: 'threeinrow', name: 'Three in a Row', alias: 'Tic-tac-toe relay',
    players: '2 teams ng 3+', time: '5–10 min', age: 'Lahat', place: 'Maluwag na lugar', energy: 3, anim: 'toss',
    materials: ['3x3 grid sa sahig (tape o 9 na paper plates)', '3 piraso bawat team (hal. pulang tsinelas vs asul na tsinelas)'],
    steps: [
      'Pumila ang dalawang team sa malayo, magkatapat sa grid.',
      'Sa hudyat, tatakbo ang una sa bawat team at maglalagay ng isang piraso sa kahit anong kahon.',
      'Babalik at magta-tag sa susunod. Pag naubos na ang 3 piraso, ang susunod ay maglilipat ng isa sa sariling piraso.',
      'Ang unang team na makatatlo nang diretso (pahiga, patayo o pahilis), panalo.'
    ],
    tips: ['Ito ang karaniwang bersyon ng "three in a row" relay — baguhin kung iba ang nakita mo sa video.'],
    credit: { by: 'Dig the Games', url: 'https://www.tiktok.com/@digthegames' }
  },
  {
    id: 'tablechairs', name: 'Musical Mesa', alias: 'Musical chairs, gamit ang mesa',
    players: '5+', time: '5–10 min', age: 'Lahat', place: 'Kahit saan', energy: 3, anim: 'chairs',
    materials: ['Isang mesa', 'Maliliit na bagay (isang kulang sa bilang ng players)', 'Music'],
    steps: [
      'Ilagay ang mga bagay sa mesa. Iikot ang players sa mesa habang may music.',
      'Habang naglalakad, magbibigay ng utos ang host: "Bilisan!", "Pa-side step!", "Paatras!".',
      'Pag tumigil ang music, kukuha ang bawat isa ng isang bagay sa mesa.',
      'Ang walang nakuha o hindi sumunod sa utos, out. Bawasan ng isang bagay.',
      'Ulitin hanggang isa na lang — siya ang panalo.'
    ],
    credit: { by: 'Dig the Games', url: 'https://www.tiktok.com/@digthegames' }
  },
  {
    id: 'saytheirname', name: 'Sabihin ang Pangalan!', alias: 'You Know Them… Say Their Name!',
    players: '4+', time: '5–10 min', age: 'Lahat', place: 'Kahit saan', energy: 2, anim: 'charades',
    materials: ['Wala! (opsyonal: listahan ng mga sikat na tao o kamag-anak)'],
    steps: [
      'Bilog ang lahat.',
      'Ang isang player ay maglalarawan ng tao — kamag-anak, kaibigan o artista — nang hindi sinasabi ang pangalan.',
      'Unahan ang iba sa pagsigaw ng tamang pangalan.',
      'Ang pinakamabilis, may puntos. Ang mabagal, may maliit na parusa (hal. sumayaw ng 5 segundo).'
    ],
    tips: ['Perfect sa reunion: ilarawan ang mga tito at tita!'],
    credit: { by: 'Dig the Games', url: 'https://www.tiktok.com/@digthegames' }
  },
  {
    id: 'wigsnatch', name: 'Agawan ng Wig', alias: 'Wig Snatch',
    players: '2 (one-on-one)', time: '3–5 min', age: '8+', place: 'Maluwag na lugar', energy: 3, anim: 'duel',
    materials: ['Dalawang wig o kahit anong maisusuot sa ulo (hal. makukulay na plastic bag)'],
    steps: [
      'Magkaharap ang dalawang player, may suot na "wig" sa ulo.',
      'Sa hudyat, susubukan nilang agawin ang wig ng kalaban.',
      'Protektahan ang sarili mong wig — bawal ang hawakan nang matagal o manulak.',
      'Ang unang makaagaw, panalo. Palitan agad ng bagong challenger.'
    ],
    tips: ['Gumawa ng bracket para may champion sa dulo.'],
    credit: { by: 'Dig the Games', url: 'https://www.tiktok.com/@digthegames' }
  },
  {
    id: 'cupnoodle', name: 'Cup Noodle Challenge', alias: 'Pool noodle + cup',
    players: '2+', time: '3–5 min', age: '8+', place: 'Maluwag na lugar', energy: 3, anim: 'duel',
    materials: ['Dalawang pool noodle bawat player', 'Isang plastic cup bawat player'],
    steps: [
      'Bawat player: isang noodle na may cup sa dulo, at isang noodle na pang-hampas.',
      'Hawakan nang patayo ang noodle na may cup — bawal hawakan ang cup.',
      'Gamitin ang kabilang noodle para patumbahin ang cup ng iba, habang binabantayan ang sa iyo.',
      'Pag nahulog ang cup mo, out ka. Ang huling may cup, panalo.'
    ],
    credit: { by: 'Dig the Games', url: 'https://www.tiktok.com/@digthegames' }
  },
  {
    id: 'dodgerodeo', name: 'Dodgeball Rodeo', alias: 'Isa laban sa lahat',
    players: '6+', time: '5–10 min', age: '8+', place: 'Maluwag na lugar', energy: 3, anim: 'pass',
    materials: ['Malambot na bola', 'Maliliit na bagay na hawak ng mga nasa bilog (hal. panyo, tsinelas)'],
    steps: [
      'Bilog ang lahat; isang player sa gitna.',
      'Ihahagis ng mga nasa bilog ang bola papunta sa nasa gitna — iiwas siya.',
      'Habang umiiwas, kukuha ang nasa gitna ng mga bagay na hawak ng mga nasa bilog.',
      'Pag natamaan, tapos ang turn niya. Bilangin ang nakuha niyang bagay.',
      'Paikutin hanggang lahat nakapasok sa gitna — pinakamaraming nakuha, panalo.'
    ],
    tips: ['Gumamit ng malambot na bola lang, at bawal tumama sa ulo.'],
    credit: { by: 'Dig the Games', url: 'https://www.tiktok.com/@digthegames' }
  },
  {
    id: 'updown', name: 'Up or Down', alias: 'Baligtaran ng cups',
    players: '2 teams', time: '2–5 min', age: 'Lahat', place: 'Maluwag na sahig', energy: 3, anim: 'flip',
    materials: ['Maraming plastic cups (20+), nakakalat sa sahig — kalahati nakataob, kalahati nakatihaya'],
    steps: [
      'Hatiin sa dalawang team: Team UP (itatayo ang cups) at Team DOWN (itataob ang cups).',
      'Ikalat ang mga cup sa sahig.',
      'Sa hudyat: Team UP, itayo ang mga cup; Team DOWN, itaob — kahit ang kakabaligtad lang ng kalaban.',
      'Pag tapos ang oras (hal. 1 minuto), bilangin: mas maraming cup na nakatayo o nakataob?',
      'Ang team na may mas maraming cup sa posisyon nila, panalo.'
    ],
    credit: { by: 'Dig the Games', url: 'https://www.tiktok.com/@digthegames' }
  }
];
