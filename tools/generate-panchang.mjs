/*
 * Bhakti Sagar – permanent panchang dataset generator.
 *
 * Source engine: @ishubhamx/panchangam-js v3 (MIT) – https://github.com/ishubhamx/Hindu-Panchangam-Legal
 * Pure-JS Drik Ganita (Swiss-Ephemeris style) calculations: vara, tithi, paksha,
 * nakshatra, sunrise/sunset and 200+ Hindu festivals (Udaya-Tithi, three-pass
 * festival detection like Drik Panchang).
 *
 * Output: ../data/panchang.json  (bundled with the site + imported into MySQL
 * by db/seed.php, so the app works offline / without the database forever).
 *
 * Usage:
 *   cd tools && npm install
 *   node generate-panchang.mjs                                   # default city -> ../data/panchang.json
 *   node generate-panchang.mjs 2026-01-01 2028-12-31             # default city, custom range
 *   node generate-panchang.mjs --cities=all                      # every city in the registry
 *   node generate-panchang.mjs 2026-01-01 2028-12-31 --cities=mumbai,london
 *
 * City registry: ../data/locations.json (shared with api/index.php and the UI picker).
 * Output: ../data/panchang.json for the default city, ../data/panchang/<key>.json for the rest.
 */
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const require = createRequire(import.meta.url);
const lib = require('@ishubhamx/panchangam-js');

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = require('@ishubhamx/panchangam-js/package.json');

// --- locations (single source of truth, shared with the PHP API) ----------
const LOCATIONS = JSON.parse(
  readFileSync(resolve(__dirname, '..', 'data', 'locations.json'), 'utf8')
);
const DEFAULT_KEY = LOCATIONS.default;
const BY_KEY = {};
LOCATIONS.locations.forEach(function (l) { BY_KEY[l.key] = l; });

function locationByKey(key) {
  const loc = BY_KEY[key];
  if (!loc) {
    console.error('Unknown city "' + key + '". Known: ' + Object.keys(BY_KEY).join(', '));
    process.exit(1);
  }
  return loc;
}

/**
 * UTC offset (minutes) for `tz` at the instant `date` – DST aware, so a city on
 * daylight saving gets the right offset on both sides of the switch.
 */
function tzOffsetMinutes(tz, date) {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });
  const m = {};
  dtf.formatToParts(date).forEach(function (p) { m[p.type] = p.value; });
  const asUtc = Date.UTC(+m.year, +m.month - 1, +m.day, +m.hour, +m.minute, +m.second);
  return Math.round((asUtc - date.getTime()) / 60000);
}

function flagValue(name) {
  const hit = process.argv.slice(2).find(function (a) {
    return a.replace(/^--?/, '').indexOf(name + '=') === 0;
  });
  if (!hit) { return null; }
  return hit.slice(hit.indexOf('=') + 1);
}

const positional = process.argv.slice(2).filter(function (a) { return a.charAt(0) !== '-'; });
const startArg = positional[0] || '2026-01-01';
const endArg = positional[1] || '2028-12-31';
const cityArg = flagValue('cities');

// --- Hindi names -----------------------------------------------------------

// tithi (1-indexed, 1..30: shukla 1-15, krishna 16-30)
const TITHI_HI = [
  'प्रतिपदा', 'द्वितीया', 'तृतीया', 'चतुर्थी', 'पंचमी',
  'षष्ठी', 'सप्तमी', 'अष्टमी', 'नवमी', 'दशमी',
  'एकादशी', 'द्वादशी', 'त्रयोदशी', 'चतुर्दशी', 'पूर्णिमा',
  'प्रतिपदा', 'द्वितीया', 'तृतीया', 'चतुर्थी', 'पंचमी',
  'षष्ठी', 'सप्तमी', 'अष्टमी', 'नवमी', 'दशमी',
  'एकादशी', 'द्वादशी', 'त्रयोदशी', 'चतुर्दशी', 'अमावस्या'
];

// nakshatra (0-indexed, 27)
const NAKSHATRA_HI = [
  'अश्विनी', 'भरणी', 'कृत्तिका', 'रोहिणी', 'मृगशिरा', 'आर्द्रा',
  'पुनर्वसु', 'पुष्य', 'आश्लेषा', 'मघा', 'पूर्वाफाल्गुनी', 'उत्तराफाल्गुनी',
  'हस्त', 'चित्रा', 'स्वाति', 'विशाखा', 'अनुराधा', 'ज्येष्ठा',
  'मूल', 'पूर्वाषाढ़ा', 'उत्तराषाढ़ा', 'श्रवण', 'धनिष्ठा', 'शतभिषा',
  'पूर्वाभाद्रपदा', 'उत्तराभाद्रपदा', 'रेवती'
];

// vara (0 = Sunday)
const VARA_KEY = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const VARA_HI = ['रविवार', 'सोमवार', 'मंगलवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'];

// curated festival names -> Hindi (unmapped names fall back to English)
const FEST_HI = {
  'Makar Sankranti (Thai Pongal)': 'मकर संक्रांति',
  'Lohri': 'लोहड़ी',
  'Bhogi': 'भोगी',
  'Vaisakhi / Baisakhi': 'वैशाखी',
  'Rama Navami': 'राम नवमी',
  'Sita Navami (Janaki Jayanti)': 'सीता नवमी',
  'Hanuman Jayanti': 'हनुमान जयंती',
  'Ganesh Chaturthi': 'गणेश चतुर्थी',
  'Ganesh Chaturthi (Day 1)': 'गणेश चतुर्थी',
  'Ganesh Visarjan': 'गणेश विसर्जन',
  'Ganesh Panchami (Day 2)': 'गणेश पंचमी',
  'Ganesh Utsav Day 11': 'गणेश उत्सव',
  'Vinayaka Chaturthi': 'विनायक चतुर्थी',
  'Sakat Chauth (Sankashti)': 'सकट चौथ',
  'Sankashti Chaturthi': 'संकष्टि चतुर्थी',
  'Janmashtami (Smarta)': 'जन्माष्टमी (स्मार्त)',
  'Janmashtami (Vaishnava)': 'जन्माष्टमी (वैष्णव)',
  'Dahi Handi': 'दहीहंडी',
  'Raksha Bandhan': 'रक्षाबंधन',
  'Holi (Rangwali / Dhulandi)': 'होली (रंगवाली)',
  'Holika Dahan': 'होलिका दहन',
  'Hola Mohalla': 'होला मोहल्ला',
  'Holashtak Begins': 'होलाष्टक आरंभ',
  'Ranga Panchami': 'रंग पंचमी',
  'Durga Ashtami (Maha Ashtami)': 'महाअष्टमी',
  'Durga Ashtami (Chaitra)': 'दुर्गा अष्टमी',
  'Durga Ashtami (Day 8)': 'दुर्गा अष्टमी',
  'Maha Navami': 'महा नवमी',
  'Maha Navami (Day 9)': 'महा नवमी',
  'Vijaya Dashami (Dussehra)': 'विजयादशमी (दशहरा)',
  'Sharad Purnima': 'शरद पूर्णिमा',
  'Kartik Purnima / Dev Diwali': 'कार्तिक पूर्णिमा / देव दिवाली',
  'Karva Chauth': 'करवा चौथ',
  'Karwa Chauth': 'करवा चौथ',
  'Karva Chauth (Kartik)': 'करवा चौथ',
  'Ahoi Ashtami': 'अहोई अष्टमी',
  'Dhanteras (Dhanatrayodashi)': 'धनतेरस (धनत्रयोदशी)',
  'Naraka Chaturdashi (Choti Diwali)': 'नरक चतुर्दशी (छोटी दिवाली)',
  'Diwali (Lakshmi Puja)': 'दिवाली (लक्ष्मी पूजा)',
  'Kali Puja (Shyama Puja)': 'काली पूजा',
  'Govardhan Puja': 'गोवर्धन पूजा',
  'Bali Pratipada': 'बलिप्रतिपदा',
  'Bhai Dooj (Yama Dwitiya)': 'भाई दूज',
  'Chhath Puja — Nahay Khay (Day 1)': 'छठ पूजा – नहाय-खाय',
  'Chhath Puja — Kharna (Day 2)': 'छठ पूजा – खरना',
  'Chhath Puja — Sandhya Arghya (Day 3)': 'छठ पूजा – संध्या अर्घ्य',
  'Chhath Puja — Usha Arghya (Day 4)': 'छठ पूजा – उषा अर्घ्य',
  'Maha Shivaratri': 'महाशिवरात्रि',
  'Masik Shivaratri': 'मासिक शिवरात्रि',
  'Pradosham (Krishna)': 'प्रदोष व्रत',
  'Pradosham (Shukla)': 'प्रदोष व्रत',
  'Shravana Somvara': 'श्रावण सोमवार',
  'Guru Purnima': 'गुरु पूर्णिमा',
  'Buddha Purnima': 'बुद्ध पूर्णिमा',
  'Vat Purnima': 'वट पूर्णिमा',
  'Vat Savitri Vrat': 'वट सावित्री व्रत',
  'Vat Purnima': 'वट पूर्णिमा',
  'Mauni Amavasya': 'मौन अमावस्या',
  'Amavasya': 'अमावस्या',
  'Purnima': 'पूर्णिमा',
  'Pausha Purnima': 'पौष पूर्णिमा',
  'Magha Purnima': 'माघ पूर्णिमा',
  'Shravana Purnima': 'श्रावण पूर्णिमा',
  'Chaitra Purnima': 'चैत्र पूर्णिमा',
  'Ugadi / Gudi Padwa': 'उगादी / गुड़ीपड़वा',
  'Vasant Panchami (Shri Panchami)': 'वसंत पंचमी',
  'Akshaya Tritiya': 'अक्षय तृतीया',
  'Nag Panchami': 'नाग पंचमी',
  'Rakhi Purnima': 'राखी पूर्णिमा',
  'Gita Jayanti': 'गीता जयंती',
  'Gopashtami': 'गोपाष्टमी',
  'Tulasi Vivah': 'तुलसी विवाह',
  'Anant Chaturdashi': 'अनंत चतुर्दशी',
  'Anant Chaturdashi (Day 10)': 'अनंत चतुर्दशी',
  'Narali Purnima': 'नारळी पूर्णिमा',
  'Raksha Bandhan': 'रक्षाबंधन',
  'Gangaur': 'गंगौर',
  'Hariyali Teej': 'हरियाली तीज',
  'Kajari Teej': 'कजरी तीज',
  'Hartalika Teej': 'हरतालिका तीज',
  'Gowri Habba': 'गौरी हब्बा',
  'Jivitputrika Vrat (Jitiya)': 'जीवितपुत्रिका व्रत (जितिया)',
  'Sheetala Ashtami (Basoda)': 'शीतला अष्टमी (बसोड़ा)',
  'Durva Ashtami': 'दूर्वाष्टमी',
  'Rishi Panchami': 'ऋषि पंचमी',
  'Varalakshmi Vratam': 'वरलक्ष्मी व्रतम्',
  'Naraka Chaturdashi (Choti Diwali)': 'नरक चतुर्दशी (छोटी दिवाली)',
  'Ratha Saptami': 'रथ सप्तमी',
  'Skanda Sashti (Kanda Sashti)': 'स्कंद षष्ठी',
  'Skanda Sashti': 'स्कंद षष्ठी',
  'Ganga Dussehra': 'गंगा दशहरा',
  'Ganga Saptami': 'गंगा सप्तमी',
  'Hanuman Jayanti': 'हनुमान जयंती',
  'Shani Jayanti': 'शनि जयंती',
  'Valmiki Jayanti': 'वाल्मीकि जयंती',
  'Vyasa Puja': 'व्यास पूजा',
  'Narada Jayanti': 'नारद जयंती',
  'Dattatreya Jayanti': 'दत्तात्रेय जयंती',
  'Kurma Jayanti': 'कूर्म जयंती',
  'Vamana Jayanti': 'वामन जयंती',
  'Parashurama Jayanti': 'परशुराम जयंती',
  'Narasimha Jayanti': 'नरसिंह जयंती',
  'Hayagriva Jayanti': 'हयग्रीव जयंती',
  'Kalki Jayanti': 'कल्कि जयंती',
  'Kalabhairav Jayanti': 'कालभैरव जयंती',
  'Gayatri Jayanti': 'गायत्री जयंती',
  'Gayatri Jayanti (Jyeshtha Shukla)': 'गायत्री जयंती',
  'Annapurna Jayanti': 'अन्नपूर्णा जयंती',
  'Radha Ashtami': 'राधा अष्टमी',
  'Sita Navami (Janaki Jayanti)': 'सीता नवमी',
  'Yamuna Chhath (Yamuna Jayanti)': 'यमुना छठ',
  'Shakambhari Purnima': 'शाकम्भरी पूर्णिमा',
  'Mahesh Navami': 'महेश नवमी',
  'Jagaddhatri Puja': 'जगद्धात्री पूजा',
  'Annapurna Puja': 'अन्नपूर्णा पूजा',
  'Thai Pusam': 'थै पूषम्',
  'Onam (Thiruvonam)': 'ओणम (थिरुवोणम)',
  'Onam (Simha Sankranti)': 'ओणम',
  'Vishu': 'विशु',
  'Tamil Puthandu': 'तमिल पुत्तंदु',
  'Cheti Chand (Jhulelal Jayanti)': 'चेटीचंद',
  'Boita Bandana': 'बोइता बंदना',
  'Nuakhai Juhar': 'नुआखाई',
  'Karma': 'कर्मा',
  'Phulera Dooj': 'फूलेरा दूज',
  'Koagara Puja': 'कोजागरा पूजा',
  'Sharad...' : 'शरद',
  'Margashirsha Guruvara': 'मार्गशीर्ष गुरुवार',
  'Kokila Vrat': 'कोकिला व्रत',
  'Upang Lalita Vrat': 'उपांग ललिता व्रत',
  'Ekadashi Parana': 'एकादशी पारणा',
  'Bhishma Ashtami': 'भीष्म अष्टमी',
  'Akshaya Navami (Amla Navami)': 'अक्षय नवमी',
  'Gita Jayanti': 'गीता जयंती',
  'Kansa Vadh': 'कंस वध',
  'Vivah Panchami': 'विवाह पंचमी',
  'Makar Sankranti': 'मकर संक्रांति',
  'Sarva Pitru Amavasya (Mahalaya)': 'सर्व पितृ अमावस्या (महालय)',
  'Sarva Pitru Amavasya (Day 15)': 'सर्व पितृ अमावस्या',
  'Dol Yatra (Dol Purnima)': 'डोल यात्रा (दोल पूर्णिमा)',
  'Vaishakha Purnima': 'वैशाख पूर्णिमा',
  'Jagannath Rathyatra': 'जगन्नाथ रथयात्रा',
  'Kojagara Puja': 'कोजागरा पूजा',
  'Koagara Puja': 'कोजागरा पूजा',
  'Guru Nanak Jayanti (Gurpurab)': 'गुरु नानक जयंती (गुरपुरब)',
  'Karthigai Deepam (Mahadeepam)': 'कार्तिगई दीपम',
  'Karthigai Deepam': 'कार्तिगई दीपम',
  'Margashirsha Shukla Pratipada': 'मार्गशीर्ष शुक्ल प्रतिपदा',
  'Banada Ashtami': 'बनादा अष्टमी',
  'Magha Gupta Navratri Begins': 'माघ गुप्त नवरात्रि आरंभ'
};

const EKADASHI_PREFIX_HI = {
  'aja': 'अजा', 'amalaki': 'आमलकी', 'apara': 'अपारा', 'devshayani': 'देवशयनी',
  'devutthana': 'देवोत्थान', 'indira': 'इंदिरा', 'jaya': 'जया', 'kamada': 'कामदा',
  'kamika': 'कामिका', 'mohini': 'मोहिनी', 'mokshada': 'मोक्षदा', 'nirjala': 'निर्जला',
  'padmini': 'पद्मिनी', 'papankusha': 'पापांकुशा', 'papmochani': 'पापमोचनी',
  'parama': 'परमा', 'parsva': 'पार्श्व', 'pausha': 'पौष', 'rama': 'रामा',
  'saphala': 'साफला', 'shattila': 'शट्टिला', 'shravana': 'श्रावण', 'utpanna': 'उत्पन्ना',
  'varuthini': 'वरुथिनी', 'vijaya': 'विजया', 'yogini': 'योगिनी', 'pausha putrada': 'पौष पुत्रदा',
  'shravana putrada': 'श्रावण पुत्रदा', 'parivartini': 'परिवर्तिनी'
};

const SHRADDHA_PREFIX_HI = {
  'prathama': 'प्रथमा', 'dwitiya': 'द्वितीया', 'tritiya': 'तृतीया', 'chaturthi': 'चतुर्थी',
  'panchami': 'पंचमी', 'shashthi': 'षष्ठी', 'saptami': 'सप्तमी', 'ashtami': 'अष्टमी',
  'navami': 'नवमी', 'dashami': 'दशमी', 'ekadashi': 'एकादशी', 'dwadashi': 'द्वादशी',
  'trayodashi': 'त्रयोदशी', 'chaturdashi': 'चतुर्दशी', 'sarva pitru amavasya': 'सर्व पितृ अमावस्या',
  'purnima': 'पूर्णिमा'
};

function stripDay(name) {
  return name.replace(/\s*\(Day \d+\)\s*$/, '').replace(/\s*\(Day \d+\)/g, '').trim();
}

function hiFestival(name) {
  if (FEST_HI[name]) { return FEST_HI[name]; }
  const base = stripDay(name);
  if (FEST_HI[base]) { return FEST_HI[base]; }

  // the engine spells Navratri/Navaratri inconsistently – normalise first
  const norm = name.replace(/Navaratri/gi, 'Navratri');

  // Navratri days: "Chaitra Navratri Day 3 (Chandraghanta)"
  let m = norm.match(/(Chaitra|Magha Gupta Navratri|Navratri)\s+Day\s+(\d+)\s*(?:\(([^)]+)\))?/i);
  if (m) {
    const prefix = /chaitra/i.test(m[1]) ? 'चैत्र ' : (/magha/i.test(m[1]) ? 'माघ गुप्त ' : '');
    const label = m[3] ? ' (' + m[3] + ')' : '';
    return prefix + 'नवरात्रि दिन ' + m[2] + label;
  }
  // "Chaitra Navratri Dwitiya" / "Navaratri Ghatasthapana"
  m = norm.match(/(Chaitra|Magha Gupta Navratri|Navratri)\s+(Dwitiya|Tritiya|Chaturthi|Panchami|Shashthi|Saptami)/i);
  if (m) {
    const TITHI_WORD_HI = {
      dwitiya: 'द्वितीया', tritiya: 'तृतीया', chaturthi: 'चतुर्थी',
      panchami: 'पंचमी', shashthi: 'षष्ठी', saptami: 'सप्तमी'
    };
    const prefix = /chaitra/i.test(m[1]) ? 'चैत्र ' : (/magha/i.test(m[1]) ? 'माघ गुप्त ' : '');
    return prefix + 'नवरात्रि ' + TITHI_WORD_HI[m[2].toLowerCase()];
  }
  // "Navaratri Ghatasthapana" / "Ghatasthapana (Day 1)"
  if (/ghatasthapana/i.test(name)) { return 'घटस्थापना'; }

  // Pitru Paksha shraddha days: "Dashami Shraddha (Day 10)"
  m = base.match(/^(.+?)\s+Shraddha$/i);
  if (m) {
    const key = m[1].toLowerCase();
    if (SHRADDHA_PREFIX_HI[key]) { return SHRADDHA_PREFIX_HI[key] + ' श्राद्ध'; }
    return m[1] + ' श्राद्ध';
  }

  // Ekadashi: "Aja Ekadashi" etc.
  if (/ekadashi/i.test(base)) {
    const key = base.toLowerCase().replace(/\s*\(.*\)$/, '').replace(/\s*ekadashi$/i, '').trim();
    if (EKADASHI_PREFIX_HI[key]) { return EKADASHI_PREFIX_HI[key] + ' एकादशी'; }
    if (EKADASHI_PREFIX_HI[key.split(' ')[0]]) { return EKADASHI_PREFIX_HI[key.split(' ')[0]] + ' एकादशी'; }
    return 'एकादशी';
  }

  // Generic span days: "Ashtami (Day 5)" → base tithi word
  if (/^\d/.test(base) === false) {
    const t = base.toLowerCase();
    const tithiWords = {
      'prathama': 'प्रथमा', 'dwitiya': 'द्वितीया', 'tritiya': 'तृतीया', 'chaturthi': 'चतुर्थी',
      'panchami': 'पंचमी', 'shashthi': 'षष्ठी', 'saptami': 'सप्तमी', 'ashtami': 'अष्टमी',
      'navami': 'नवमी', 'dashami': 'दशमी', 'dwadashi': 'द्वादशी', 'trayodashi': 'त्रयोदशी'
    };
    if (tithiWords[t]) { return tithiWords[t]; }
  }

  if (base.endsWith('Jayanti')) { return base.slice(0, -'Jayanti'.length) + ' जयंती'; }
  if (base.endsWith('Vrat')) { return base.slice(0, -'Vrat'.length) + ' व्रत'; }

  return base;
}

function slugify(str) {
  return String(str)
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function localHm(iso, timeZone) {
  if (!iso) { return null; }
  const d = new Date(iso);
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: timeZone, hour: '2-digit', minute: '2-digit', hour12: false
  }).formatToParts(d);
  const h = parts.find(p => p.type === 'hour').value;
  const m = parts.find(p => p.type === 'minute').value;
  return h + ':' + m;
}

// --- generation ------------------------------------------------------------

function generateForLocation(loc, start, end, outPath) {
  const [sy, sm, sd] = start.split('-').map(Number);
  const [ey, em, ed] = end.split('-').map(Number);

  const observer = new lib.Observer(loc.lat, loc.lng, loc.elevation);
  const festivalDict = {};   // slug -> {name, hi, cat}
  const days = {};
  let count = 0;
  let festivalHits = 0;
  const t0 = Date.now();

  const cursor = new Date(Date.UTC(sy, sm - 1, sd));
  const last = new Date(Date.UTC(ey, em - 1, ed));

  while (cursor <= last) {
    const y = cursor.getUTCFullYear();
    const m = cursor.getUTCMonth();
    const d = cursor.getUTCDate();
    const key = y + '-' + String(m + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');

    // local noon on that civil day -> Udaya (sunrise) convention for this city
    const approx = new Date(Date.UTC(y, m, d, 12, 0));
    let off = tzOffsetMinutes(loc.timezone, approx);
    const date = new Date(approx.getTime() - off * 60000);
    off = tzOffsetMinutes(loc.timezone, date);   // re-read in case of a DST edge
    const p = lib.getPanchangam(date, observer, { timezoneOffset: off });

    const fest = [];
    (p.festivals || []).forEach(f => {
      const s = slugify(f.name);
      if (!festivalDict[s]) {
        festivalDict[s] = { name: f.name, hi: hiFestival(f.name), cat: f.category || 'major' };
      }
      fest.push(s);
      festivalHits++;
    });

    days[key] = {
      var: p.vara,
      // p.tithi is 0-indexed (0..29) in the engine – store 1..30 like the tables
      tithi: p.tithi + 1,
      paksha: p.paksha === 'Krishna' ? 'krishna' : 'shukla',
      nakshatra: p.nakshatra,
      sunrise: localHm(p.sunrise, loc.timezone),
      sunset: localHm(p.sunset, loc.timezone),
      festivals: fest
    };

    count++;
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  // range sanity check – fail loudly instead of writing bad data
  for (const [k, v] of Object.entries(days)) {
    const ok = v.var >= 0 && v.var <= 6 && v.tithi >= 1 && v.tithi <= 30 &&
      v.nakshatra >= 0 && v.nakshatra <= 26 && /^\d{2}:\d{2}$/.test(v.sunrise) && /^\d{2}:\d{2}$/.test(v.sunset) &&
      ((v.tithi <= 15 && v.paksha === 'shukla') || (v.tithi >= 16 && v.paksha === 'krishna'));
    if (!ok) {
      console.error('INVALID day ' + k + ': ' + JSON.stringify(v));
      process.exit(1);
    }
  }

  const payload = {
    meta: {
      generator: 'bhakti-sagar/tools/generate-panchang.mjs',
      engine: '@ishubhamx/panchangam-js v' + pkg.version,
      engine_license: 'MIT',
      engine_repo: 'https://github.com/ishubhamx/Hindu-Panchangam-Legal',
      method: 'Drik Ganita (true equinox), Udaya Tithi at sunrise',
      generated_at: new Date().toISOString(),
      range: [start, end],
      location: loc,
      counts: { days: count, festivals: Object.keys(festivalDict).length, festival_entries: festivalHits }
    },
    festivals: festivalDict,
    days: days
  };

  writeFileSync(outPath, JSON.stringify(payload), 'utf8');
  console.log(
    (loc.key === DEFAULT_KEY ? '[default] ' : '') + loc.key.padEnd(13) +
    '-> ' + outPath.replace(__dirname, '.') +
    ' | days ' + count + ' | festivals ' + Object.keys(festivalDict).length +
    ' | entries ' + festivalHits + ' | ' + (Date.now() - t0) + ' ms'
  );
}

function outPathFor(key) {
  return key === DEFAULT_KEY
    ? resolve(__dirname, '..', 'data', 'panchang.json')
    : resolve(__dirname, '..', 'data', 'panchang', key + '.json');
}

// --- CLI -------------------------------------------------------------------

if (cityArg) {
  mkdirSync(resolve(__dirname, '..', 'data', 'panchang'), { recursive: true });
  const keys = cityArg === 'all'
    ? LOCATIONS.locations.map(function (l) { return l.key; })
    : cityArg.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
  keys.forEach(function (k) {
    generateForLocation(locationByKey(k), startArg, endArg, outPathFor(k));
  });
} else {
  generateForLocation(locationByKey(DEFAULT_KEY), startArg, endArg, outPathFor(DEFAULT_KEY));
}
