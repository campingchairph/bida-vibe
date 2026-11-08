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

/* ---------- Event types → suggested program ----------
   Each program row: [kind, title, minutes, gameId?]          */
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
    script: {
      intro: 'Kailangan ko ng sampung volunteers — mas maraming tito at tita, mas maganda!',
      rules: 'Simple lang: iikot kayo habang may music. Pag tumigil ang tugtog — upo agad! Ang walang upuan, out. Bawal manulak, bawal umupo sa kandungan… maliban kung asawa mo.',
      during: 'Ikot lang, ikot lang… ’wag kayong titingin sa akin, hindi ko sasabihin kung kailan ko ititigil!',
      end: 'At ang ating hari/reyna ng upuan — palakpakan natin!'
    },
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
    script: {
      intro: 'Hanap kayo ng partner — asawa, kapatid, crush, kahit sino basta kaya kang buhatin!',
      rules: 'Sasayaw kayo sa ibabaw ng dyaryo. Pag tumigil ang music, tiklop ang dyaryo. Ang tumapak sa sahig — out!',
      during: 'Lumiliit na ang mundo ninyo! Kapit lang, kapit lang!',
      end: 'Grabe ang teamwork! Palakpakan ang ating Paper Dance champions!'
    },
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
    script: {
      intro: 'Sino dito ang henyo? Kailangan ko ng mga pares na magkakilala nang husto!',
      rules: 'Ang salita, nasa noo mo — hindi mo makikita. Magtanong ka, at ang partner mo ay sasagot lang ng Oo, Hindi, o Pwede. Dalawang minuto. Go!',
      during: 'Tao ba? Bagay? Pagkain? Malapit na, malapit na!',
      end: 'Henyo nga! Palakpakan para sa ating pinakamatalinong pares!'
    },
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
    script: {
      intro: 'Hati tayo sa teams! Pumili ng pinakamabilis tumakbo — o ’yung pinakamakapal ang mukha.',
      rules: 'Pag sinabi kong “Bring me”, dalhin agad dito ang bagay. Ang unang makarating, may puntos!',
      during: 'Bring me… isang lolo na naka-shades! Bring me… resibo! Bring me… isang taong naka-pink!',
      end: 'Ang bilis ninyo! Palakpakan ang ating Bring Me champions!'
    },
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
    script: {
      intro: 'Lahat ng marunong sumayaw — at lahat ng hindi — dito sa harap!',
      rules: 'Sayaw habang may music. Pag tumigil — STOP! Parang statue. Ang gumalaw, out!',
      during: 'Ayan, ayan… STOP! Uy, gumalaw ang kilay mo, out ka!',
      end: 'Ang ating Stop Dance champion! Palakpakan!'
    },
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
    script: {
      intro: 'Team relay tayo! Bawat team, pumila dito.',
      rules: 'Kutsara sa bibig, calamansi sa kutsara. Pag nahulog, balik sa umpisa! Bawal kamay!',
      during: 'Dahan-dahan lang… ay nahulog! Balik, balik!',
      end: 'Panalo ang team na may pinaka-steady na bibig! Palakpakan!'
    },
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
    script: {
      intro: 'Pila tayo, dalawang team! Test natin kung gaano kayo kagaling makinig.',
      rules: 'Ibubulong ko ang mensahe sa una, ipapasa ninyo hanggang dulo. Isang beses lang ang bulong, bawal ulitin!',
      during: 'Shhh… bawal tumawa habang bumubulong!',
      end: 'Ang original na mensahe ay… at ang narinig ninyo ay… ano ’yan?! Hahaha!'
    },
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
    script: {
      intro: 'Sino dito ang artista? Charades tayo!',
      rules: 'Bubunot ka ng card, i-aakto mo nang walang salita. Bawal magsalita, bawal mag-lip sync! Isang minuto!',
      during: 'Ano ’yan? Manok? Eroplano? Si Darna?!',
      end: 'Best actor/actress award goes to… palakpakan!'
    },
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
    script: {
      intro: 'Ikot tayo lahat! Icebreaker muna para magising tayo.',
      rules: 'Pag tinuro ko ang kaliwa mo, sigaw ka ng “Hep hep!”. Pag kanan — “Hooray!”. Bilis-bilisan natin!',
      during: 'Hep hep! Hooray! Hep— ay mali! Out!',
      end: 'Gising na ba tayo? Palakpakan ang natira!'
    },
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
    script: {
      intro: 'Teams, handa na ang mga sinturon at sapatos ninyo?',
      rules: 'Tatlong minuto. Gumawa ng pinakamahabang linya gamit ang kahit anong nasa inyo — basta disente ha!',
      during: 'Uy, may nagtatanggal na ng medyas! Isang minuto na lang!',
      end: 'Sukatan na! At ang pinakamahabang linya ay sa… palakpakan!'
    },
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
    script: {
      intro: 'Kunin ang lobo, itali sa paa — mahigpit ha!',
      rules: 'Sa hudyat ko, putukin ang lobo ng iba. Bawal kamay, bawal manulak. Ang huling may lobo, panalo!',
      during: 'BOOM! May isa na namang nalaglag! Takbo, takbo!',
      end: 'Ang survivor ng Putok Lobo! Palakpakan!'
    },
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
    script: {
      intro: 'Lahat tayo maglalaro! Hanap ng kalaban!',
      rules: 'Best of 3. Pag talo ka, maging cheerleader ka ng nanalo — sigaw ng pangalan niya hanggang sa finals!',
      during: 'Jack-en-poy! Hale-hale-hoy! Ang ingay ng mga cheerers!',
      end: 'At ang hari/reyna ng Bato Bato Pik! Palakpakan!'
    },
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
    script: {
      intro: 'Dalawang team, punta sa harap! Survey says na tayo!',
      rules: 'Babasahin ko ang tanong. Ang unang pumindot, sasagot. Kung nasa top 5 ng survey — puntos! Tatlong mali, steal ang kabila!',
      during: 'Top answer… ihanda ang Ding! O ang Buzzer!',
      end: 'Survey says… panalo ang team ni ______! Palakpakan!'
    },
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
    script: {
      intro: 'Bilog tayo lahat! Mainit na patatas tayo!',
      rules: 'Ipasa ang bola habang may music. Pag huminto — ang may hawak, out! O kakanta, depende sa mood ko.',
      during: 'Init, init, init! Bilis ipasa!',
      end: 'Ang hindi natamaan ng init — ang ating champion!'
    },
    tips: ['Lagyan ng forfeit: kumanta, sumayaw, o mag-share ng embarrassing story.']
  }
];
