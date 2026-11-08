/* ============================================================
   Bida-Vibe — Host Guide
   Not a script. For each segment: the goal, what to DO, what to
   COVER (talking points, say it in your own words), ENERGY moves,
   one short sample line per tone, and a style move borrowed from
   a well-known Filipino host.

   Grounded in working-emcee advice, not invented quotes:
   - Filipino emcees on TikTok: do an energizer right after the
     opening spiel; Tagalog builds connection more than polished
     English; crowd control = keep them listening and involved.
   - MC guides (Nick Gray / James Robilotta, Lumen "Master of
     Ceremonies"): high energy at start and end, talk TO people,
     recap-then-tease between segments, slow down on names, be the
     concierge not the star, keep a toolbox for dead air.
   Style references describe a host's known on-air moves; they are
   not quotes and not endorsements.
   ============================================================ */

/* Well-known hosts whose styles the guide borrows from */
window.BIDA_STYLES = {
  boy:    { name: 'Boy Abunda',     move: 'Fast Talk',         what: 'Mabilis na tanong, mabilis na sagot — “Adobo o sinigang?” Walang isip-isip. Ang saya nasa bilis, hindi sa tanong.' },
  vice:   { name: 'Vice Ganda',     move: 'Loving roast',      what: 'Lambingin ang kulit: biruin ang sitwasyon o ang sarili, hindi ang itsura o problema ng tao. Pag tumawa ang inaasar, tama ka.' },
  willie: { name: 'Willie Revillame', move: 'Gawing bida ang bisita', what: 'Tanungin ang pangalan, saan galing, at pakinggan talaga. Ang ordinaryong bisita, gawing artista kahit 30 segundo lang.' },
  luis:   { name: 'Luis Manzano',   move: 'Game-show pacing',  what: 'Mabilis ang galaw, malinaw ang rules, may konting asar sa contestant, tapos bigay agad ang spotlight sa nanalo.' },
  toni:   { name: 'Toni Gonzaga',   move: 'Warm interviewer',  what: 'Isang tanong na may puso, tapos tumahimik at hayaang magkwento. Ang katahimikan mo ang nagbibigay ng espasyo.' },
  janeena:{ name: 'Janeena Chan',   move: 'Host ng Bayan',     what: 'Mataas ang energy pero kasama ang lahat — kinakausap pati ang nasa likod at ang hindi sumasali.' }
};

/* Rules every host should keep in mind (shown at top of the guide) */
window.BIDA_RULES = [
  { t: 'Kausapin, huwag sermunan', d: 'Talk TO people, not AT them. Magtanong, tumingin sa mata, banggitin ang pangalan.' },
  { t: 'Energizer agad pagkatapos ng opening', d: 'Ito ang payo ng maraming Pinoy emcee: hulihin agad ang atensyon bago kumain o mag-cellphone ang lahat.' },
  { t: 'Taglish na natural', d: 'Mas tumatama ang Tagalog kaysa perpektong English. Magsalita gaya ng pakikipag-usap mo sa tito mo.' },
  { t: 'Recap, tapos tease', d: 'Sa bawat lipat: isang linya tungkol sa kakatapos lang, isang linya kung bakit dapat abangan ang susunod.' },
  { t: 'Dahan-dahan sa pangalan', d: 'Bilisan ang hype, bagalan ang pangalan at mahahalagang detalye. Pinakamasakit ang maling pangalan.' },
  { t: 'Ikaw ang concierge, hindi ang bida', d: 'Ang bisita ang bida. Ang trabaho mo: ihatid sila sa saya at umalis sa spotlight.' },
  { t: 'Taas sa simula at dulo', d: 'Hindi kailangang sigaw buong gabi. Taas ang energy sa opening at closing; sa gitna, sumabay sa kwarto.' }
];

/* Energy toolbox: quick moves for when the room goes flat */
window.BIDA_ENERGY = [
  { id: 'call', name: 'Call & response', time: '10s', how: 'Turuan ang bisita ng sagot: pag sinabi mong “Pamilya!”, sagot sila ng apelyido. Ulitin 3x, palakas nang palakas.' },
  { id: 'clap', name: 'Clap pattern', time: '15s', how: 'Palakpak 1-2, 1-2-3. Ikaw muna, gagaya sila. Bilisan sa dulo, tapos isang malakas na palakpak.' },
  { id: 'table', name: 'Table cheer battle', time: '1 min', how: 'Bawat mesa, pinakamalakas na sigaw. Ituro ang mesa, sabayan ng Air horn. Bigyan ng maliit na premyo ang panalo.' },
  { id: 'stand', name: '“Tumayo kung…”', time: '1 min', how: 'Tumayo kung: galing probinsya, may birthday ngayong buwan, unang beses dito, OFW. Maliit na palakpak sa bawat grupo.' },
  { id: 'far', name: 'Pinakamalayo ang pinanggalingan', time: '1 min', how: 'Sino ang pinakamalayo ang biniyahe? Pataasan. Tanungin ang panalo kung bakit sila pumunta — kadalasan nakakaantig ang sagot.' },
  { id: 'fast', name: 'Fast Talk with Lolo/Lola', time: '2 min', how: 'Style ni Boy Abunda: tawagin ang pinakamatanda, limang mabilis na tanong (“Adobo o sinigang?”, “Unang crush?”). Laging tawa ang dulo.' },
  { id: 'dance', name: '30-second dance break', time: '30s', how: 'Patugtugin ang pinaka-kilalang tugtog. Lahat tayo, kahit nakaupo lang. Ikaw ang unang sumayaw.' },
  { id: 'trivia', name: 'Pamilya trivia', time: '2 min', how: 'Tatlong tanong tungkol sa grupo (“Sino ang may pinakamaraming apo?”). Ang unang tama, may kendi o pera.' },
  { id: 'tease', name: 'Raffle teaser', time: '10s', how: 'Ipakita ang isang premyo, tapos itago. “Mamaya ’yan, ’wag kayong uuwi.” Pang-hold ng tao hanggang dulo.' },
  { id: 'spot', name: 'Spotlight sa tahimik', time: '1 min', how: 'Style ni Willie: lapitan ang mesa na hindi pa nakikisali. Tanungin ang pangalan, gawing bida kahit saglit.' }
];

/* Dead air & awkward moments */
window.BIDA_RESCUE = [
  { t: 'Nagka-problema ang sound / projector', d: 'Huwag mag-panic sa mic. Mag-table cheer battle o “Tumayo kung…” habang inaayos. Sabihin lang: “Saglit lang, inaayos pa — habang naghihintay…”' },
  { t: 'May tito na gustong kumanta / mag-speech', d: 'Bigyan ng oras pero may hangganan: “Isang kanta lang po, tapos game na tayo!” Palakpakan, tapos agaw-mic nang magalang.' },
  { t: 'Maagang natapos ang segment', d: 'Hilahin ang isang energizer mula sa toolbox, o i-tease ang susunod na laro.' },
  { t: 'Walang gustong mag-volunteer', d: 'Huwag maghintay. Pumili ka: “Kayo, kayo at kayo — palakpakan natin ang mga brave!” Mas madali sila mapasali pag may palakpak.' },
  { t: 'Malungkot ang moment (tribute, may sakit)', d: 'Bagalan ang boses, huwag magbiro agad. Isang segundo ng katahimikan bago lumipat. Ang susunod na segment, simulan nang malumanay.' },
  { t: 'Pagod na ang lahat', d: 'Paikliin ang natitirang program. Mas mabuting matapos nang masaya kaysa matapos nang buo.' }
];

/* Per segment kind: goal / do / say / energy / sample (by tone) / style */
window.BIDA_GUIDE = {
  arrival: {
    goal: 'Iparamdam na welcome sila bago pa magsimula.',
    do: ['Tumayo malapit sa pinto o registration — hindi sa stage', 'Patugtugin ang music sa medyo mahinang volume', 'Ituro ang CR, pagkain at upuan sa mga bagong dating'],
    say: ['Batiin isa-isa, tawagin sa pangalan kung kilala', 'Sabihin kung anong oras magsisimula', 'Paalala: kumuha ng name tag o raffle ticket'],
    energy: ['Mag-ikot sa mga mesa; dito mo malalaman kung sino ang makulit at sino ang mahiyain — magagamit mo mamaya'],
    sample: { formal: 'Magandang hapon po! Paki-register lang po muna, at mag-uumpisa tayo bandang alas-tres.', friendly: 'Uy, nandito ka na! Kuha muna ng name tag, tapos hanap ng upuan — konting hintay na lang.', jolly: 'Welcome! Kuha ng raffle ticket — ’wag mong iwawala, ’yan ang ticket mo pauwi na may premyo.' },
    style: 'janeena'
  },
  opening: {
    goal: 'Kunin ang atensyon ng buong kwarto sa unang 30 segundo.',
    do: ['Hintaying humina ang ingay bago magsalita — o gumamit ng Ding para kunin ang atensyon', 'Tumayo sa gitna, harap sa pinakamaraming tao', 'Pakilala ang sarili sa isang pangungusap lang'],
    say: ['Bati + pangalan ng event', 'Bakit tayo nandito ngayon (isang linya)', 'Isang bagay na aabangan (laro, raffle, kainan)'],
    energy: ['Energizer agad pagkatapos: call & response o clap pattern', 'Iwasan ang “Hindi ko kayo marinig!” — mas gumagana ang tanong na madaling sagutin'],
    sample: { formal: 'Magandang gabi po sa ating lahat, at maligayang pagdating sa {event}.', friendly: 'Hello, {group}! Ako si {host}, at ako ang kasama ninyo ngayong gabi.', jolly: 'Palakpakan muna natin ang sarili natin — nakarating tayo kahit traffic!', serious: 'Bihira tayong magkakasama nang ganito. Kaya sana, sulitin natin ang bawat oras ngayon.' },
    style: 'janeena'
  },
  prayer: {
    goal: 'Maayos at tahimik na pagsisimula.',
    do: ['Kausapin muna ang mangunguna bago ang event', 'Hinaan ang music hanggang zero', 'Hintaying tumayo ang lahat bago iabot ang mic'],
    say: ['Imbitahang tumayo', 'Pangalan ng mangunguna, malinaw at dahan-dahan'],
    energy: ['Walang biro dito. Ang energy ay babalik pagkatapos — sabihan ang lahat na umupo nang may ngiti'],
    sample: { formal: 'Inaanyayahan ko po ang lahat na tumayo para sa ating panalangin, na pangungunahan ni ______.', friendly: 'Tayo muna tayo lahat para magdasal. ______, ikaw na po.' }
  },
  anthem: {
    goal: 'Respeto, maikli.',
    do: ['Siguraduhing nakahanda ang tugtog bago ka magsalita', 'Ikaw muna ang tumayo at humarap sa watawat o screen'],
    say: ['Imbitahang tumayo para sa Lupang Hinirang'],
    energy: ['Walang dagdag — diretso sa susunod pagkatapos'],
    sample: { formal: 'Inaanyayahan po ang lahat na tumayo para sa Pambansang Awit ng Pilipinas.' }
  },
  welcome: {
    goal: 'Ipakilala ang magsasalita at bigyan sila ng magandang entrance.',
    do: ['Alamin ang tamang pangalan, titulo at relasyon nila sa grupo', 'Sabihan sila na humanda bago mo sila tawagin', 'Ikaw ang manguna sa palakpak'],
    say: ['Isang personal na detalye tungkol sa kanila (hal. “ang nag-organize nito mula pa 2015”)', 'Pangalan — huli at malakas'],
    energy: ['Pag tapos na sila, ikaw ang unang pumalakpak at bawiin ang mic nang magaan'],
    sample: { formal: 'Para sa ating welcome remarks, malugod ko pong inaanyayahan si ______.', friendly: 'Siya ang dahilan kung bakit tayo nandito ngayon — palakpakan natin si ______!' },
    style: 'willie'
  },
  intro: {
    goal: 'Maramdaman ng bawat pamilya o grupo na nakita sila.',
    do: ['Kumuha ng listahan ng pamilya / table bago ang event', 'Tawagin by group, hindi isa-isa kung marami', 'Ipa-tayo at ipa-wave ang bawat grupo'],
    say: ['Pangalan ng pamilya o grupo', 'Isang fun fact kung meron (pinakamalayo, pinakamaraming anak, bagong kasal)'],
    energy: ['Gawing cheer battle: bawat grupong tatawagin, sumigaw nang malakas', 'Extra palakpak sa bagong miyembro (bagong silang, bagong asawa)'],
    sample: { friendly: 'Pag tinawag ko ang pamilya ninyo, tumayo kayo at mag-ingay!', jolly: 'Roll call! Ang pinakatahimik na pamilya, sila ang maghuhugas ng pinggan mamaya.' },
    style: 'willie'
  },
  icebreak: {
    goal: 'Mapakilos at mapatawa ang lahat bago ang mahahabang bahagi.',
    do: ['Ipakita muna ang galaw o sagot — huwag lang i-explain', 'Pumili agad ng volunteers, huwag maghintay', 'Panatilihing wala pang 10 minuto'],
    say: ['Rules sa tatlong pangungusap lang', 'Kung ano ang premyo (kahit maliit)'],
    energy: ['Bilisan unti-unti ang laro para mas nakakatawa', 'I-shoutout ang pinakamalakas tumawa o pinaka-game'],
    sample: { friendly: 'Warm-up muna tayo bago kumain — madali lang ’to, promise.', jolly: 'Bawal ang KJ dito — at oo, nakikita ko kayo diyan sa likod.' },
    style: 'luis'
  },
  game: {
    goal: 'Malinaw ang rules, mabilis ang takbo, bida ang mga naglalaro.',
    do: ['Ihanda ang materials at mga upuan bago tawagin ang players', 'Ipakita ang rules gamit ang demo, hindi mahabang paliwanag', 'Gamitin ang Sound Lab: Ding sa tama, Buzzer sa mali, Drumroll bago ang winner'],
    say: ['Ilan ang kailangang players', 'Rules sa tatlong pangungusap', 'Premyo', 'Play-by-play habang naglalaro — parang commentator'],
    energy: ['I-interview saglit ang players bago magsimula (pangalan, sino ang kampi nila)', 'Ipa-cheer ang audience para sa kani-kanilang kampi', 'Pag tapos: bigay ang buong spotlight sa nanalo, may Ta-da'],
    sample: { friendly: 'Game time! Kailangan ko ng sampung volunteers — mas maraming tito, mas maganda.', jolly: 'Ang hindi sumali, siya ang magbabayad ng videoke mamaya. Joke. Siguro.' },
    style: 'luis'
  },
  meal: {
    goal: 'Maayos na pila; pahinga ang host.',
    do: ['Tawagin by table para walang siksikan', 'Unahin ang seniors, buntis at mga bata', 'Patugtugin ang music sa background — ito ang pahinga mo'],
    say: ['Ayos ng pila (anong table ang una)', 'Pasalamatan ang nagluto o caterer'],
    energy: ['Huwag mag-host habang kumakain ang lahat. Pag halos tapos na, i-tease ang susunod na laro o raffle'],
    sample: { formal: 'Inaanyayahan na po namin ang lahat sa buffet — uunahin po natin ang ating mga lolo’t lola at mga bata.', friendly: 'Kainan na! Table 1 at 2 muna, tapos tatawagin ko ang susunod.' },
    style: 'willie'
  },
  number: {
    goal: 'Bigyan ng magandang intro at suporta ang magpe-perform.',
    do: ['Itanong sa performer kung paano sila gustong ipakilala', 'Siguraduhing handa ang tugtog o props bago tawagin', 'Tumabi sa gilid ng stage habang nagpe-perform'],
    say: ['Sino sila at ano ang gagawin nila', 'Kung bakit espesyal (hal. “ilang linggo nilang pinractice”)'],
    energy: ['Ipataas ang cellphone flashlights kung kanta', 'Standing ovation cue pagkatapos — ikaw ang unang tumayo'],
    sample: { friendly: 'Ilang linggo nilang pinaghandaan ’to — palakpakan natin si/sina ______!', jolly: 'Labas na ang mga cellphone, i-video natin ’to.' }
  },
  speech: {
    goal: 'Maayos na pasok at labas ng nagsasalita.',
    do: ['Sabihan ang magsasalita kung ilang minuto sila', 'Hinaan ang music sa zero gamit ang Talk fader', 'Pagkatapos: bawiin ang mic at magbigay ng maikling salamat'],
    say: ['Sino sila at relasyon sa grupo', 'Pagkatapos: isang linya ng recap (“Salamat sa paalala na…”)'],
    energy: ['Pag humaba, lumapit nang dahan-dahan sa stage — natural na signal ’yan', 'Pagkatapos ng seryosong speech, huwag tumalon agad sa biro'],
    sample: { formal: 'Para sa isang mensahe, malugod naming inaanyayahan si ______.', serious: 'May mga salitang mas mabuting sinasabi habang magkakasama pa tayo. Si ______.' },
    style: 'toni'
  },
  tribute: {
    goal: 'Taimtim na pag-alala, walang pilit.',
    do: ['Hinaan ang ilaw o music kung kaya', 'Ihanda ang pangalan o litrato ng mga aalalahanin', 'Bagalan ang boses mo'],
    say: ['Pangalan ng mga yumao, dahan-dahan', 'Imbitasyon sa isang minutong katahimikan'],
    energy: ['Walang biro. Pagkatapos ng katahimikan, magpasalamat at lumipat nang malumanay — hindi biglang “Game na!”'],
    sample: { serious: 'Hindi buo ang pamilya kung hindi natin sila aalalahanin. Isang minuto po ng katahimikan.' },
    style: 'toni'
  },
  awards: {
    goal: 'Gawing espesyal ang bawat nanalo, kahit maliit ang award.',
    do: ['Ihanda ang listahan, premyo at taong mag-aabot', 'Isang award, isang tao sa stage — huwag sabay-sabay', 'Mag-picture bago bumaba ang nanalo'],
    say: ['Ano ang award at bakit nakakatuwa', 'Pangalan pagkatapos ng Drumroll', 'Isang mabilis na tanong sa nanalo'],
    energy: ['Gumawa ng nakakatawang categories: “Pinakamalayo ang biniyahe”, “Pinaka-late”, “Bagong miyembro”', 'Drumroll → pangalan → Ta-da → palakpak'],
    sample: { friendly: 'Para sa award na “Pinakamalayo ang Pinanggalingan”… (Drumroll) …', jolly: 'Walang red carpet, banig na lang — pero buong puso ang palakpak.' },
    style: 'boy'
  },
  raffle: {
    goal: 'Hawakan ang tao hanggang dulo, saya sa bawat bunot.',
    do: ['Unahin ang maliliit na premyo, iwan ang grand prize sa huli', 'Magtalaga ng taga-bunot (bata o pinakamatanda — mas cute)', 'Drumroll sa bawat bunot'],
    say: ['Rules: kailangang nandito pag tinawag', 'Basahin ang numero o pangalan nang dalawang beses, dahan-dahan', 'Pasalamatan ang sponsor ng bawat premyo'],
    energy: ['Bilang hanggang 10 bago bumunot ulit kung wala ang nanalo', 'Ka-ching sa bawat nanalo'],
    sample: { friendly: 'Hawakan na ang ticket — ang hindi nandito pag tinawag, bubunot ulit tayo!', jolly: 'Bilang tayo hanggang sampu… kung wala ka, sorry na lang.' },
    style: 'willie'
  },
  gifts: {
    goal: 'Mabilis at masaya, walang awkward na paghihintay.',
    do: ['Ayusin ang pagkakasunod bago magsimula (bunutan list)', 'Mag-limit: isang linya ng description bawat isa', 'Kung marami, gawin by table nang sabay'],
    say: ['Paano ang takbo (sino ang mauuna)', 'Pwedeng magbigay ng clue bago ibunyag ang nabunot'],
    energy: ['Gawing hulaan: magbigay ng 3 clue tungkol sa nabunot, hulaan ng lahat', 'Shoutout sa pinaka-creative na wrapping'],
    sample: { friendly: 'Exchange gifts na! Bago mo ibigay, tatlong clue muna kung sino ang nabunot mo.' }
  },
  cake: {
    goal: 'Isang malinaw na sandali para sa celebrant.',
    do: ['Siguraduhing may lighter at kutsilyo bago tawagin', 'Patayin ang music; i-cue ang Happy Birthday', 'Ipapuwesto ang photographer bago sindihan'],
    say: ['Tawagin ang celebrant at pamilya sa harap', 'Bilang bago kumanta: isa, dalawa, tatlo'],
    energy: ['Ipatayo ang lahat para sa kanta', 'Ipa-wish nang tahimik bago hipan — sabihin “Wish muna!”'],
    sample: { friendly: 'Sindihan na ang kandila! Isa, dalawa, tatlo —', jolly: 'Bilisan bago matunaw ang icing!' }
  },
  photo: {
    goal: 'Mabilis na picture, kumpleto ang lahat.',
    do: ['Hanapin muna ang photographer at lugar bago tawagin', 'Ayusin: matangkad sa likod, bata at seniors sa harap', 'Dalawang kuha: isang maayos, isang wacky'],
    say: ['Saan pupunta', 'Bilang bago kumuha'],
    energy: ['Bigyan sila ng salita para sabay ngumiti (apelyido ng pamilya, hindi “cheese”)'],
    sample: { friendly: 'Picture! Matangkad sa likod, mga bata at lola sa harap.', jolly: 'Isa pa — may nakapikit. Lagi namang may nakapikit.' }
  },
  toast: {
    goal: 'Isang maikling sandali ng pasasalamat.',
    do: ['Siguraduhing may laman ang baso ng lahat (kahit tubig)', 'Pumili ng magto-toast nang maaga'],
    say: ['Para saan ang toast — isang pangungusap', 'Sabay-sabay: “Cheers!” o “Mabuhay!”'],
    energy: ['Hintaying nakataas ang lahat ng baso bago sabihin ang cheers'],
    sample: { friendly: 'Itaas natin ang baso — para sa ating lahat. Mabuhay!' }
  },
  videoke: {
    goal: 'Iabot ang party sa bisita.',
    do: ['Ayusin ang pila ng kakanta o song list', 'Lakasan ulit ang music', 'Ipaalam kung hanggang anong oras'],
    say: ['Tapos na ang pormal na program', 'Paano pumila sa videoke'],
    energy: ['Ikaw ang unang kumanta o sumayaw para mabuksan ang sahig'],
    sample: { friendly: 'Tapos na ang program, pero hindi pa tapos ang gabi — bukas na ang videoke!' }
  },
  closing: {
    goal: 'Tapusin nang mataas, may pasasalamat.',
    do: ['Simulan ang closing habang masaya pa — huwag hintaying umuwi ang kalahati', 'Ihanda ang listahan ng pasasalamatan'],
    say: ['Recap: dalawang highlight ng araw', 'Salamat sa nag-organize, nagluto, sponsors', 'Paalala sa pag-uwi (ingat, souvenir, susunod na event)'],
    energy: ['Huling clap pattern o call & response — pareho ng ginamit sa opening, para buo ang bilog'],
    sample: { formal: 'Sa ngalan ng {group}, maraming salamat po sa inyong pagdalo. Ingat po sa pag-uwi.', friendly: 'Salamat, {group}! Sobrang saya ngayon — kita-kits ulit!', jolly: 'Ang may dalang Tupperware, ibalik ninyo next year ha.' },
    style: 'janeena'
  }
};
