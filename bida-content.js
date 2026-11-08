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

/* ---------- Host script lines: kind → tone → lines ---------- */
window.BIDA_SCRIPTS = {
  arrival: {
    formal:   ['Good afternoon po sa ating lahat. Habang hinihintay po natin ang iba pa nating panauhin, paki-register na lamang po sa ating table at kumuha ng inyong name tag.'],
    serious:  ['Salamat po sa paglalaan ng oras para makarating. Alam naming malayo ang pinanggalingan ng ilan — kaya ang presensya ninyo ay regalo na sa amin.'],
    friendly: ['Uy, nandito ka na! Pasok, pasok. Kuha muna ng name tag diyan, tapos hanap ng upuan — mag-uumpisa na tayo maya-maya.'],
    jolly:    ['Testing, testing! Mic check — oo, ako ’to, hindi si Vice. Mag-register na kayo bago ko kayo i-raffle bilang premyo!']
  },
  opening: {
    formal:   ['Magandang {time} po sa ating lahat. Sa ngalan ng {group}, isang mainit na pagbati at pagtanggap sa ating {event}. Ako po si {host}, ang inyong magiging host ngayong araw.'],
    serious:  ['Magandang {time} po. Bihira tayong magkasama-sama nang ganito. Kaya sana, sa mga susunod na oras, ibaba muna natin ang cellphone at tingnan ang mga taong nasa paligid natin.'],
    friendly: ['Hello, hello, {group}! Magandang {time} sa inyong lahat! Ako si {host} at ako ang makulit ninyong host today. Welcome sa ating {event}!'],
    jolly:    ['Ayan na, ayan na! Palakpakan muna natin ang mga sarili natin kasi nakarating tayo kahit traffic! Welcome sa pinakamasayang {event} ng taon! Ako si {host} — at oo, single pa rin ako, salamat sa pagtatanong.']
  },
  prayer: {
    formal:   ['Bago po tayo magpatuloy, inaanyayahan ko po ang lahat na tumayo para sa ating panalangin, na pangungunahan ni ______.'],
    serious:  ['Magsimula po tayo sa pasasalamat. Tumayo po tayo at sama-samang manalangin para sa ating pamilya, sa mga wala rito, at sa biyayang ito.'],
    friendly: ['Okay, tayo muna lahat — pray muna tayo bago ang lahat ng kasiyahan. Pangungunahan tayo ni ______.'],
    jolly:    ['Bago ang kainan at kalokohan, tayo muna lahat at magdasal — lalo na para sa mga diet na masisira ngayong gabi. ______, ikaw na po.']
  },
  anthem: {
    formal:   ['Inaanyayahan po ang lahat na tumayo para sa pag-awit ng Pambansang Awit ng Pilipinas.'],
    serious:  ['Tumayo po tayo para sa ating Pambansang Awit.'],
    friendly: ['Tayo po muna tayo lahat para sa Lupang Hinirang.'],
    jolly:    ['Tayo po lahat, kanta tayo ng Lupang Hinirang — at oo, hanggang dulo, walang “ang mamatay nang dahil sa ’yo” na pabulong lang ha.']
  },
  welcome: {
    formal:   ['Para po sa ating welcome remarks, malugod ko pong inaanyayahan si ______. Palakpakan po natin.'],
    serious:  ['May isang taong naging dahilan kung bakit tayo nandito ngayon. Para sa ating welcome message, tawagin po natin si ______.'],
    friendly: ['Para pormal na tayong i-welcome, eto na si ______! Bigyan natin ng masigabong palakpakan!'],
    jolly:    ['Para i-welcome tayo — at sana maikli lang kasi gutom na tayo — eto na si ______! Palakpakan, ang hindi pumalakpak walang dessert!']
  },
  intro: {
    formal:   ['Ngayon po ay ipapakilala natin ang bawat pamilya at panauhin. Kapag tinawag po ang inyong pangalan, pakitaas lamang po ang inyong kamay.'],
    serious:  ['Kilalanin natin ang isa’t isa. Sa bawat pangalan na tatawagin, alalahanin natin kung gaano tayo kalaki — at kung gaano tayo pinagbubuklod.'],
    friendly: ['Roll call time! Pag tinawag ko ang pamilya ninyo, tumayo kayo at mag-wave. Kung bago ka sa pamilya, extra palakpak para sa ’yo!'],
    jolly:    ['Roll call! Tumayo pag tinawag — at kung hindi mo kilala ’yung katabi mo, ngayon na ang tamang oras magpakilala. Bawal “ikaw ’yung anak ni ano ’di ba?”']
  },
  icebreak: {
    formal:   ['Upang tayo po ay magkakilanlan pa nang lubos, magkakaroon po tayo ng maikling icebreaker: {title}.'],
    serious:  ['Bago ang lahat, isang maikling aktibidad para mas makilala natin ang isa’t isa: {title}.'],
    friendly: ['Para mag-warm up tayo, laro muna tayo ng {title}! Madali lang ’to, promise.'],
    jolly:    ['Gising! Gising! Bawal antukin — icebreaker tayo: {title}! Ang matalo, kakanta ng isang buong kanta. Joke lang. O baka hindi.']
  },
  game: {
    formal:   ['Ngayon po ay dadako na tayo sa ating mga palaro. Ang ating unang laro: {title}.'],
    serious:  ['Laro na po tayo. Tandaan, ang mahalaga ay ang samahan — pero syempre, mas masaya kung manalo. {title} na po!'],
    friendly: ['Game time! Sino ang ready? Ang laro natin: {title}. Kailangan ko ng mga volunteer!'],
    jolly:    ['Eto na ang pinakahihintay ng lahat — GAMES! Ang laro: {title}! Bawal ang KJ, bawal ang “mamaya na lang ako”!']
  },
  meal: {
    formal:   ['Inaanyayahan na po namin ang lahat na pumila at kumain. Uunahin po natin ang ating mga lolo’t lola at mga bata.'],
    serious:  ['Ang pagkaing ito ay pinaghirapan ng maraming kamay. Kumain po tayo nang sama-sama, at magpasalamat sa nagluto.'],
    friendly: ['Kainan na! Seniors at kids muna sa pila ha. Kumain nang marami — sayang ang handa!'],
    jolly:    ['Ang pinakamagandang salita sa Tagalog: KAINAN NA! Lolo’t lola at mga bata muna — ’wag kang sisingit, nakikita kita, Tito!']
  },
  number: {
    formal:   ['Para po sa ating susunod na bahagi, isang espesyal na presentasyon mula kay/kina ______. Palakpakan po natin.'],
    serious:  ['Inihanda nila ito nang buong puso. Panoorin po natin ang presentasyon ng ______.'],
    friendly: ['May inihanda silang surprise para sa atin! Palakpakan natin si/sina ______!'],
    jolly:    ['Ilabas na ang mga cellphone, i-video natin ’to para may blackmail material tayo! Eto na si/sina ______!']
  },
  speech: {
    formal:   ['Para po sa isang mensahe, malugod naming inaanyayahan si ______.'],
    serious:  ['May mga salitang mas mabuting sinasabi habang magkakasama pa tayo. Para sa kanyang mensahe, si ______.'],
    friendly: ['Message time! Sino ang unang magsasalita? ______, tara dito!'],
    jolly:    ['Speech, speech, speech! Maghanda na ng tissue — o ng kanta kung hahaba. ______, ikaw na!']
  },
  tribute: {
    formal:   ['Sa bahaging ito, bigyan po natin ng pagkilala ang ating mga mahal sa buhay na nauna na sa atin. Isang minutong katahimikan po.'],
    serious:  ['Hindi buo ang pamilya kung hindi natin sila aalalahanin. Isang sandali po ng katahimikan para sa ating mga yumao.'],
    friendly: ['Bago tayo magpatuloy, alalahanin muna natin ang mga mahal natin na hindi na natin kasama. Sandaling katahimikan po.'],
    jolly:    ['Sandali lang po tayong tumahimik — para sa mga mahal nating wala na. Siguradong nakikisaya rin sila ngayon.']
  },
  awards: {
    formal:   ['Ngayon po ay ating bibigyang-pagkilala ang ilang natatanging miyembro. Para sa unang parangal...'],
    serious:  ['May mga taong deserving ng palakpak. Kilalanin po natin sila.'],
    friendly: ['Awards night na! Sino kaya ang mananalo? Para sa unang award...'],
    jolly:    ['And the award goes to... drumroll please! Pero teka, wala tayong red carpet, banig na lang.']
  },
  raffle: {
    formal:   ['Ngayon po ay magsisimula na ang ating raffle draw. Pakihanda na po ang inyong mga raffle ticket.'],
    serious:  ['Raffle na po. Salamat sa lahat ng nag-sponsor ng mga premyo.'],
    friendly: ['Raffle time! Hawakan na ang ticket — at ’wag kayong uuwi hangga’t hindi tapos!'],
    jolly:    ['Raffle na! Ang hindi nandito pag tinawag, hindi na makukuha — ibibigay ko na lang sa sarili ko. Drumroll!']
  },
  gifts: {
    formal:   ['Atin pong sisimulan ang exchange gifts. Pakihanda na po ang inyong mga regalo.'],
    serious:  ['Ang regalo ay paalala na may nag-isip sa atin. Simulan na po natin ang exchange gifts.'],
    friendly: ['Exchange gifts na! Hawakan na ang regalo ninyo — sana hindi ka nabunot ng taong mahilig mag-regalo ng mug.'],
    jolly:    ['Exchange gifts! Kung may nabunot kang towel, mug o tumbler — kalma, it’s the thought that counts. Siguro.']
  },
  cake: {
    formal:   ['Inaanyayahan po ang lahat na sama-samang umawit ng Happy Birthday para sa ating celebrant.'],
    serious:  ['Bago hipan ang kandila, mag-wish po tayo para sa ating celebrant. Sabay-sabay po tayong kumanta.'],
    friendly: ['Sindihan na ang kandila! Kanta tayo lahat — one, two, three!'],
    jolly:    ['Sindihan na ’yan bago pa matunaw ang icing! One, two, three — Happy birthday! At ’wag kang dudura sa cake ha!']
  },
  photo: {
    formal:   ['Para po sa ating group photo, inaanyayahan ang lahat na pumunta sa harapan.'],
    serious:  ['Kuhanan po natin ang sandaling ito — balang araw, ito ang litratong babalik-balikan natin.'],
    friendly: ['Picture, picture! Lahat sa harap — matangkad sa likod, cute sa harap!'],
    jolly:    ['Group photo! Ayusin ang buhok, sumipsip ng tiyan, at sabay-sabay: “Pamilya!” Isa pa, may nakapikit!']
  },
  toast: {
    formal:   ['Itaas po natin ang ating mga baso para sa isang toast.'],
    serious:  ['Itaas natin ang ating baso — para sa samahang hindi natitinag ng panahon.'],
    friendly: ['Baso up, everyone! Para sa ating lahat — cheers!'],
    jolly:    ['Itaas ang baso — kahit softdrinks, kahit tubig, kahit sabaw! Cheers!']
  },
  videoke: {
    formal:   ['Iyan po ang pagtatapos ng ating pormal na programa. Malaya na po ang lahat na mag-enjoy at magkantahan.'],
    serious:  ['Tapos na po ang programa, pero hindi pa tapos ang gabi. Mag-enjoy po tayo.'],
    friendly: ['Free time na! Kanta, kwentuhan, kain ulit — kayo na ang bahala!'],
    jolly:    ['Bukas na ang videoke! Paalala: ang kakanta ng My Way, sa sariling peligro.']
  },
  closing: {
    formal:   ['Sa ngalan ng {group}, maraming salamat po sa inyong pagdalo. Ingat po kayo sa inyong pag-uwi.'],
    serious:  ['Salamat sa bawat isa. Sana dalhin natin pauwi hindi lang ang mga ulam, kundi ang alaala ng araw na ito. Hanggang sa muli.'],
    friendly: ['Maraming salamat, {group}! Sobrang saya ngayon. Ingat sa pag-uwi, at kita-kits ulit!'],
    jolly:    ['Salamat sa lahat! Ingat pauwi — at ’yung mga may dalang Tupperware, ibalik ninyo next year ha! Ako po si {host}, babay!']
  }
};

/* Tone transitions used between segments */
window.BIDA_SEGUES = {
  formal:   'Maraming salamat po. Susunod po sa ating programa: {next}.',
  serious:  'Salamat po. Ngayon naman, {next}.',
  friendly: 'Ayan! Next naman tayo: {next}!',
  jolly:    'Palakpakan ulit! O sige, next na — {next}! ’Wag aalis!'
};

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
