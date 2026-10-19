<?php
declare(strict_types=1);

/*
 * Panchang-based suggestion rules – धर्मशास्त्र/पंचांग के नियम.
 *
 * तीन प्रकार के नियम (priority बढ़ते हुए):
 *   festival (3)  – आज का त्योहार (data/panchang.json के festival slug से substring match)
 *   tithi    (2)  – आज की तिथि (tithi number group)
 *   var      (1)  – वार (weekday)
 *
 * 'tracks' में data/catalog.php के slugs हैं।
 * db/seed.php इसे `day_rules` टेबल में लोड करता है; api/ fallback में इसी फ़ाइल को पढ़ता है।
 */

$tithi_groups = [
    'ekadashi'  => [11, 26],                 // एकादशी (दोनों पक्ष)
    'dwadashi'  => [12, 27],                 // द्वादशी
    'pradosh'   => [13, 28],                 // प्रदोष व्रत
    'shivaratri'=> [14, 29],                 // चतुर्दशी – शिवरात्रि
    'chaturthi' => [4, 19],                  // चतुर्थी – संकष्टि/विनायक
    'ashtami'   => [8, 23],                  // अष्टमी
    'navami'    => [9, 24],                  // नवमी
    'purnima'   => [15],                     // पूर्णिमा
    'amavasya'  => [30],                     // अमावस्या
];

$rules = [
    /* ---------------- वार (weekday) – priority 1 ---------------- */
    [
        'type' => 'var', 'match' => 'sun', 'priority' => 1,
        'badge_hi' => 'रविवार – राम व सूर्य आराधना',
        'note_hi' => 'रविवार को श्रीराम और सूर्य देव की आराधना विशेष फलदायी मानी जाती है।',
        'tracks' => ['raghupati-raghav-raja-ram', 'gayatri-mantra-108', 'vaishnav-jan-to', 'ram-chandra-kripalu-bhajman', 'ram-aarti-raghuvir', 'surya-aarti-om-jai-surya', 'ram-raksha-stotram', 'aditya-hridayam-stotram', 'purusha-suktam'],
    ],
    [
        'type' => 'var', 'match' => 'mon', 'priority' => 1,
        'badge_hi' => 'सोमवार – शिव आराधना',
        'note_hi' => 'सोमवार भगवान शिव को समर्पित है – रुद्राभिषेक एवं शिव स्तुति विशेष फलदायी।',
        'tracks' => ['om-jai-shiv-omkara', 'shiv-amritwani', 'mahamrityunjaya-mantra-108', 'mahadev-shankar-hain', 'shiva-panchakshari-stotram', 'om-namah-shivaya-dhun', 'namo-namo-namoh-namoh', 'jai-jai-shiv-shankar'],
    ],
    [
        'type' => 'var', 'match' => 'tue', 'priority' => 1,
        'badge_hi' => 'मंगलवार – हनुमान जी',
        'note_hi' => 'मंगलवार बजरंगबली की आराधना का दिन है – चालीसा, बजरंग बाण एवं अष्टक पाठ संकट हरता है।',
        'tracks' => ['hanuman-chalisa', 'aarti-kije-hanuman-lala-ki', 'bajrang-baan', 'sankat-mochan-hanuman-ashtak'],
    ],
    [
        'type' => 'var', 'match' => 'wed', 'priority' => 1,
        'badge_hi' => 'बुधवार – गणेश व विद्या आराधना',
        'note_hi' => 'बुधवार श्री गणेश को समर्पित है – विघ्नहर्ता की आरती एवं विद्या-सरस्वती आरंभ शुभ।',
        'tracks' => ['jai-ganesh-deva', 'gayatri-mantra-108', 'ganesh-amritwani', 'sukh-karta-dukh-harta', 'saraswati-vandana-ya-kundendu', 'vakratunda-mahakaya', 'sankat-nashan-ganesh-stotram', 'saraswati-aarti-om-jai-saraswati'],
    ],
    [
        'type' => 'var', 'match' => 'thu', 'priority' => 1,
        'badge_hi' => 'गुरुवार – विष्णु/कृष्ण आराधना',
        'note_hi' => 'गुरुवार भगवान विष्णु और श्रीकृष्ण की आराधना का विशेष दिन है।',
        'tracks' => ['om-jai-jagdish-hare-lata', 'achyutam-keshavam', 'krishna-govind-hare-murari', 'vishnu-amritwani', 'govind-bolo-hari-gopal-bolo', 'kanakadhara-stotram', 'vishnu-sahasranamam', 'ashtalakshmi-stotram', 'radhe-krishna-radhe-krishna', 'hare-rama-hare-krishna-dhun'],
    ],
    [
        'type' => 'var', 'match' => 'fri', 'priority' => 1,
        'badge_hi' => 'शुक्रवार – लक्ष्मी व दुर्गा आराधना',
        'note_hi' => 'शुक्रवार माँ लक्ष्मी और दुर्गा देवी को समर्पित है – सौभाग्य व शक्ति का दिन।',
        'tracks' => ['om-jai-lakshmi-mata', 'jai-ambe-gauri', 'mere-ghar-aao-lakshmi-maa', 'kanakadhara-stotram', 'ashtalakshmi-stotram', 'ambe-tu-hai-jagdambe-aarti'],
    ],
    [
        'type' => 'var', 'match' => 'sat', 'priority' => 1,
        'badge_hi' => 'शनिवार – शनि व हनुमान कृपा',
        'note_hi' => 'शनिवार शनि देव और हनुमान जी की कृपा का दिन माना जाता है।',
        'tracks' => ['hanuman-chalisa', 'aarti-kije-hanuman-lala-ki', 'mahamrityunjaya-mantra-108', 'shanaishwara-shani-bhajan', 'bajrang-baan', 'sankat-mochan-hanuman-ashtak', 'shani-aarti-jai-jai-shani-dev'],
    ],

    /* ---------------- तिथि (tithi) – priority 2 ---------------- */
    [
        'type' => 'tithi', 'match' => 'ekadashi', 'priority' => 2,
        'badge_hi' => 'एकादशी – विष्णु व्रत',
        'note_hi' => 'एकादशी पर भगवान विष्णु/कृष्ण का व्रत और कीर्तन विशेध फलदायी है।',
        'tracks' => ['achyutam-keshavam', 'om-jai-jagdish-hare-anuradha', 'krishna-govind-hare-murari', 'govind-bolo-hari-gopal-bolo', 'ekadashi-special-bhajans', 'vishnu-amritwani', 'vishnu-sahasranamam', 'hare-rama-hare-krishna-dhun'],
    ],
    [
        'type' => 'tithi', 'match' => 'dwadashi', 'priority' => 2,
        'badge_hi' => 'द्वादशी – विष्णु आराधना',
        'note_hi' => 'द्वादशी पर विष्णु सहस्त्रनाम एवं आरती का विशेध महत्व है।',
        'tracks' => ['om-jai-jagdish-hare-lata', 'vaishnav-jan-to', 'vishnu-amritwani'],
    ],
    [
        'type' => 'tithi', 'match' => 'pradosh', 'priority' => 2,
        'badge_hi' => 'प्रदोष काल – शिव पूजा',
        'note_hi' => 'प्रदोष व्रत पर संध्या में शिव पूजा और अभिषेक अत्यंत शुभ माना जाता है।',
        'tracks' => ['om-jai-shiv-omkara', 'shiv-amritwani', 'mahamrityunjaya-mantra-108', 'mahadev-shankar-hain', 'shiv-stuti-ashutosh'],
    ],
    [
        'type' => 'tithi', 'match' => 'shivaratri', 'priority' => 2,
        'badge_hi' => 'शिवरात्रि – रात्रि जागरण',
        'note_hi' => 'चतुर्दशी की शिवरात्रि पर जागरण, रुद्राभिषेक और शिव स्तुति का विशेध विधान है।',
        'tracks' => ['shiva-tandava-stotram', 'om-jai-shiv-omkara', 'shiv-amritwani', 'mahamrityunjaya-mantra-108', 'shiv-stuti-ashutosh', 'mahadev-shankar-hain', 'shiva-panchakshari-stotram', 'om-namah-shivaya-dhun', 'namo-namo-namoh-namoh'],
    ],
    [
        'type' => 'tithi', 'match' => 'chaturthi', 'priority' => 2,
        'badge_hi' => 'चतुर्थी – गणेश व्रत',
        'note_hi' => 'संकष्टि/विनायक चतुर्थी पर गणेश जी की आरती और व्रत विघ्न नाशक है।',
        'tracks' => ['jai-ganesh-deva', 'sukh-karta-dukh-harta', 'ganesh-amritwani', 'vakratunda-mahakaya', 'sankat-nashan-ganesh-stotram'],
    ],
    [
        'type' => 'tithi', 'match' => 'ashtami', 'priority' => 2,
        'badge_hi' => 'अष्टमी – देवी व कृष्ण आराधना',
        'note_hi' => 'अष्टमी पर माता रानी और बालकृष्ण की आराधना विशेध शुभ है।',
        'tracks' => ['jai-ambe-gauri', 'aarti-kunj-bihari-ki', 'om-jai-shri-krishna-bhajan', 'durga-chalisa', 'radhe-krishna-radhe-krishna', 'ambe-tu-hai-jagdambe-aarti'],
    ],
    [
        'type' => 'tithi', 'match' => 'navami', 'priority' => 2,
        'badge_hi' => 'नवमी – देवी आराधना',
        'note_hi' => 'नवमी तिथि माँ दुर्गा को समर्पित है – कन्या पूजन व देवी आरती शुभ।',
        'tracks' => ['jai-ambe-gauri', 'durga-chalisa', 'ambe-tu-hai-jagdambe-aarti'],
    ],
    [
        'type' => 'tithi', 'match' => 'purnima', 'priority' => 2,
        'badge_hi' => 'पूर्णिमा – विष्णु व चंद्र आराधना',
        'note_hi' => 'पूर्णिमा को विष्णु पूजा, तुलसी आराधना और चंद्र दर्शन विशेध शुभ माने जाते हैं।',
        'tracks' => ['om-jai-jagdish-hare-anuradha', 'krishna-govind-hare-murari', 'gayatri-mantra-108', 'vishnu-amritwani'],
    ],
    [
        'type' => 'tithi', 'match' => 'amavasya', 'priority' => 2,
        'badge_hi' => 'अमावस्या – शांति व पितृ स्मरण',
        'note_hi' => 'अमावस्या पर दान-पुण्य, पितृ स्मरण और शांति मंत्रों का विशेध महत्व है।',
        'tracks' => ['mahamrityunjaya-mantra-108', 'om-jai-shiv-omkara', 'shiva-tandava-stotram', 'om-namah-shivaya-dhun', 'shiva-panchakshari-stotram'],
    ],

    /* ---------------- त्योहार (festival) – priority 3 ---------------- */
    [
        'type' => 'festival', 'match' => 'diwali-lakshmi-puja', 'priority' => 3,
        'badge_hi' => 'दिवाली – लक्ष्मी पूजा',
        'note_hi' => 'दीपावली पर माँ लक्ष्मी-गणेश पूजा, दीप जलाना और आरती का विशेध विधान है।',
        'tracks' => ['om-jai-lakshmi-mata', 'jai-ganesh-deva', 'om-jai-jagdish-hare-lata', 'mere-ghar-aao-lakshmi-maa', 'sukh-karta-dukh-harta'],
    ],
    [
        'type' => 'festival', 'match' => 'hanuman-jayanti', 'priority' => 3,
        'badge_hi' => 'हनुमान जयंती',
        'note_hi' => 'हनुमान जयंती पर चालीसा पाठ, बजरंग बाण, हनुमान आरती और अष्टक का विशेध पाठ शुभ है।',
        'tracks' => ['hanuman-chalisa', 'aarti-kije-hanuman-lala-ki', 'bajrang-baan', 'sankat-mochan-hanuman-ashtak'],
    ],
    [
        'type' => 'festival', 'match' => 'janmashtami', 'priority' => 3,
        'badge_hi' => 'जन्माष्टमी – श्रीकृष्ण जन्मोत्सव',
        'note_hi' => 'जन्माष्टमी पर रात्रि जागरण, कृष्ण जन्म एवं झांकी का विशेध विधान है।',
        'tracks' => ['aarti-kunj-bihari-ki', 'achyutam-keshavam', 'krishna-govind-hare-murari', 'om-jai-shri-krishna-bhajan', 'govind-bolo-hari-gopal-bolo', 'radhe-krishna-radhe-krishna', 'hare-rama-hare-krishna-dhun'],
    ],
    [
        'type' => 'festival', 'match' => 'holi', 'priority' => 3,
        'badge_hi' => 'होली – रंगोत्सव',
        'note_hi' => 'होली पर कृष्ण रासलीला और रंग गीतों का गान विशेध प्रिय है।',
        'tracks' => ['achyutam-keshavam', 'krishna-govind-hare-murari', 'rang-dare-kanhaiya', 'radhe-krishna-radhe-krishna'],
    ],
    [
        'type' => 'festival', 'match' => 'maha-shivaratri', 'priority' => 3,
        'badge_hi' => 'महाशिवरात्रि',
        'note_hi' => 'महाशिवरात्रि पर रात्रि जागरण, शिव तांडव और अभिषेक का विशेध विधान है।',
        'tracks' => ['shiva-tandava-stotram', 'om-jai-shiv-omkara', 'shiv-amritwani', 'mahamrityunjaya-mantra-108', 'shiv-stuti-ashutosh', 'mahadev-shankar-hain', 'shiva-panchakshari-stotram', 'om-namah-shivaya-dhun', 'namo-namo-namoh-namoh'],
    ],
    [
        'type' => 'festival', 'match' => 'ganesh', 'priority' => 3,
        'badge_hi' => 'गणेश उत्सव',
        'note_hi' => 'गणेश चतुर्थी/विसर्जन पर गणपति बाप्पा की आरती और मंगल मूर्ति की स्तुति शुभ है।',
        'tracks' => ['jai-ganesh-deva', 'sukh-karta-dukh-harta', 'ganesh-amritwani', 'vakratunda-mahakaya', 'sankat-nashan-ganesh-stotram'],
    ],
    [
        'type' => 'festival', 'match' => 'navratri', 'priority' => 3,
        'badge_hi' => 'नवरात्रि – देवी आराधना',
        'note_hi' => 'नवरात्रि के नौ दिन माँ दुर्गा की आराधना, कलश स्थापना और देवी आरती विशेध शुभ है।',
        'tracks' => ['jai-ambe-gauri', 'durga-chalisa', 'ambe-tu-hai-jagdambe-aarti'],
    ],
    [
        'type' => 'festival', 'match' => 'vijaya-dashami', 'priority' => 3,
        'badge_hi' => 'विजयादशमी (दशहरा)',
        'note_hi' => 'दशहरे पर श्रीराम की विजय का गान और धर्म की जीत का स्मरण शुभ है।',
        'tracks' => ['raghupati-raghav-raja-ram', 'vaishnav-jan-to', 'ram-aarti-raghuvir', 'ram-raksha-stotram'],
    ],
    [
        'type' => 'festival', 'match' => 'rama-navami', 'priority' => 3,
        'badge_hi' => 'राम नवमी',
        'note_hi' => 'राम नवमी पर श्रीराम जन्मोत्सव, रामधुन और राम आरती का गान विशेध फलदायी है।',
        'tracks' => ['raghupati-raghav-raja-ram', 'vaishnav-jan-to', 'ram-aarti-raghuvir', 'ram-chandra-kripalu-bhajman', 'ram-raksha-stotram'],
    ],
    [
        'type' => 'festival', 'match' => 'raksha-bandhan', 'priority' => 3,
        'badge_hi' => 'रक्षाबंधन',
        'note_hi' => 'रक्षाबंधन पर श्रीकृष्ण-भीम संबंधी कथा के साथ भक्ति गीत शुभ माने जाते हैं।',
        'tracks' => ['achyutam-keshavam', 'krishna-govind-hare-murari', 'om-jai-shri-krishna-bhajan'],
    ],
    [
        'type' => 'festival', 'match' => 'guru-purnima', 'priority' => 3,
        'badge_hi' => 'गुरु पूर्णिमा',
        'note_hi' => 'गुरु पूर्णिमा पर गुरु वंदना, गुरुर ब्रह्मा स्तोत्र और संत भक्ति पाठ विशेध शुभ है।',
        'tracks' => ['devon-ke-guru-brihaspti', 'guru-purnima-special', 'gayatri-mantra-108'],
    ],
    [
        'type' => 'festival', 'match' => '-chauth', 'priority' => 3,
        'badge_hi' => 'चतुर्थी व्रत – करवा चौथ / सकट चौथ',
        'note_hi' => 'करवा चौथ में चंद्र दर्शन व सुहाग की कामना, सकट चौथ में गणेश व्रत शुभ है।',
        'tracks' => ['karwa-chauth-maiya-jab-tak', 'aarti-kunj-bihari-ki', 'jai-ganesh-deva', 'krishna-govind-hare-murari'],
    ],
    [
        'type' => 'festival', 'match' => 'makar-sankranti', 'priority' => 3,
        'badge_hi' => 'मकर संक्रांति',
        'note_hi' => 'संक्रांति पर सूर्य आराधना, तिल दान और गायत्री जाप विशेध शुभ माने जाते हैं।',
        'tracks' => ['gayatri-mantra-108', 'surya-aarti-om-jai-surya'],
    ],
    [
        'type' => 'festival', 'match' => 'chhath', 'priority' => 3,
        'badge_hi' => 'छठ पूजा – सूर्य षष्ठी',
        'note_hi' => 'छठ व्रत में सूर्य देव और छठी मैया को अर्घ्य दिया जाता है – छठ गीत व सूर्य आरती शुभ।',
        'tracks' => ['gayatri-mantra-108', 'kaanch-hi-baans-ke-bahangiya', 'uga-hai-suraj-dev', 'surya-aarti-om-jai-surya'],
    ],
    [
        'type' => 'festival', 'match' => 'govardhan', 'priority' => 3,
        'badge_hi' => 'गोवर्धन पूजा',
        'note_hi' => 'गोवर्धन पूजा पर श्रीकृष्ण की लीला का स्मरण और गोपाल भक्ति विशेध शुभ है।',
        'tracks' => ['achyutam-keshavam', 'krishna-govind-hare-murari', 'om-jai-shri-krishna-bhajan'],
    ],
    [
        'type' => 'festival', 'match' => 'gita-jayanti', 'priority' => 3,
        'badge_hi' => 'गीता जयंती',
        'note_hi' => 'गीता जयंती पर भगवद्गीता का पाठ और कृष्ण उपदेश का स्मरण शुभ है।',
        'tracks' => ['vaishnav-jan-to', 'krishna-govind-hare-murari', 'bhagavad-gita-sampurna', 'hare-rama-hare-krishna-dhun'],
    ],
    [
        'type' => 'festival', 'match' => 'devutthana', 'priority' => 3,
        'badge_hi' => 'देवोत्थान (प्रबोधिनी) एकादशी',
        'note_hi' => 'देवउठनी एकादशी से विष्णु का जागरण होता है – आरती, अमृतवाणी और कीर्तन विशेध शुभ।',
        'tracks' => ['om-jai-jagdish-hare-lata', 'aarti-kunj-bihari-ki', 'vishnu-amritwani', 'govind-bolo-hari-gopal-bolo', 'kanakadhara-stotram', 'vishnu-sahasranamam', 'ashtalakshmi-stotram', 'radhe-krishna-radhe-krishna', 'hare-rama-hare-krishna-dhun'],
    ],
    [
        'type' => 'festival', 'match' => 'rathyatra', 'priority' => 3,
        'badge_hi' => 'जगन्नाथ रथयात्रा',
        'note_hi' => 'रथयात्रा पर भगवान जगन्नाथ (विष्णु-कृष्ण) के भजन और कीर्तन विशेध शुभ हैं।',
        'tracks' => ['raghupati-raghav-raja-ram', 'achyutam-keshavam'],
    ],
    [
        'type' => 'festival', 'match' => 'tulasi-vivah', 'priority' => 3,
        'badge_hi' => 'तुलसी विवाह',
        'note_hi' => 'तुलसी विवाह से विवाह पंचमी का आरंभ होता है – विष्णु आरती व अमृतवाणी विशेध शुभ।',
        'tracks' => ['krishna-govind-hare-murari', 'om-jai-jagdish-hare-anuradha', 'vishnu-amritwani'],
    ],
    [
        'type' => 'festival', 'match' => 'akshaya-tritiya', 'priority' => 3,
        'badge_hi' => 'अक्षय तृतीया',
        'note_hi' => 'अक्षय तृतीया पर विष्णु-लक्ष्मी आराधना और दान का विशेध महत्व है।',
        'tracks' => ['om-jai-lakshmi-mata', 'mere-ghar-aao-lakshmi-maa', 'om-jai-jagdish-hare-lata'],
    ],
    [
        'type' => 'festival', 'match' => 'kali-puja', 'priority' => 3,
        'badge_hi' => 'काली पूजा',
        'note_hi' => 'काली पूजा में देवी शक्ति की आराधना और देवी आरती विशेध शुभ है।',
        'tracks' => ['jai-ambe-gauri', 'durga-chalisa', 'ambe-tu-hai-jagdambe-aarti'],
    ],
    [
        'type' => 'festival', 'match' => 'dahi-handi', 'priority' => 3,
        'badge_hi' => 'दहीहंडी',
        'note_hi' => 'दहीहंडी पर कृष्ण बाल्यलीला के भजन और उत्सव का गान शुभ है।',
        'tracks' => ['achyutam-keshavam', 'aarti-kunj-bihari-ki', 'om-jai-shri-krishna-bhajan'],
    ],

    /* ---------------- नए त्योहार/व्रत (verified tracks के साथ) ---------------- */
    [
        'type' => 'festival', 'match' => 'vasant-panchami', 'priority' => 3,
        'badge_hi' => 'वसंत पंचमी – सरस्वती पूजा',
        'note_hi' => 'वसंत पंचमी पर माँ सरस्वती की पूजा और विद्या-आरंभ विशेध शुभ माना जाता है।',
        'tracks' => ['saraswati-vandana-ya-kundendu', 'gayatri-mantra-108', 'saraswati-aarti-om-jai-saraswati'],
    ],
    [
        'type' => 'festival', 'match' => 'navaratri', 'priority' => 3,
        'badge_hi' => 'शारदीय नवरात्रि – देवी आराधना',
        'note_hi' => 'शारदीय नवरात्रि में घटस्थापना, नौ दिन देवी पाठ और दुर्गा चालीसा विशेध फलदायी है।',
        'tracks' => ['jai-ambe-gauri', 'durga-chalisa', 'ambe-tu-hai-jagdambe-aarti'],
    ],
    [
        'type' => 'festival', 'match' => 'teej', 'priority' => 3,
        'badge_hi' => 'तीज (हरियाली/कजरी/हरतालिका) – शिव-पार्वती व्रत',
        'note_hi' => 'तीज पर माँ पार्वती के लिए शिव-पार्वती व्रत और शिव आराधना विशेध शुभ है।',
        'tracks' => ['om-jai-shiv-omkara', 'shiv-amritwani', 'mahadev-shankar-hain'],
    ],
    [
        'type' => 'festival', 'match' => 'shravana-somvara', 'priority' => 3,
        'badge_hi' => 'सावन सोमवार – शिव आराधना',
        'note_hi' => 'सावन के सोमवार रुद्राभिषेक, बेलपत्र अर्पण और शिव भजन अत्यंत फलदायी हैं।',
        'tracks' => ['mahadev-shankar-hain', 'shiv-amritwani', 'om-jai-shiv-omkara', 'shiva-tandava-stotram', 'om-namah-shivaya-dhun', 'shiva-panchakshari-stotram'],
    ],
    [
        'type' => 'festival', 'match' => 'shani-jayanti', 'priority' => 3,
        'badge_hi' => 'शनि जयंती',
        'note_hi' => 'शनि जयंती पर शनि देव का अभिषेक, शनैश्वर भजन और हनुमान कृपा विशेध शुभ है।',
        'tracks' => ['shanaishwara-shani-bhajan', 'bajrang-baan', 'hanuman-chalisa', 'shani-aarti-jai-jai-shani-dev'],
    ],
    [
        'type' => 'festival', 'match' => 'dhanteras', 'priority' => 3,
        'badge_hi' => 'धनतेरस',
        'note_hi' => 'धनतेरस पर लक्ष्मी-गणेश पूजा और धन-समृद्धि की कामना से आरती विशेध शुभ है।',
        'tracks' => ['om-jai-lakshmi-mata', 'mere-ghar-aao-lakshmi-maa', 'jai-ganesh-deva'],
    ],
    [
        'type' => 'festival', 'match' => 'bhai-dooj', 'priority' => 3,
        'badge_hi' => 'भाई दूज',
        'note_hi' => 'भाई दूज पर भाई-बहन के संबंधों की रक्षा की कामना से विष्णु आरती व प्रार्थना शुभ है।',
        'tracks' => ['om-jai-jagdish-hare-lata', 'vaishnav-jan-to'],
    ],
    [
        'type' => 'festival', 'match' => 'pitru', 'priority' => 3,
        'badge_hi' => 'पितृ पक्ष – श्राद्ध',
        'note_hi' => 'पितृ पक्ष में पितृ स्मरण, तर्पण और शांति हेतु गायत्री व महामृत्युंजय जाप विशेध शुभ है।',
        'tracks' => ['mahamrityunjaya-mantra-108', 'gayatri-mantra-108'],
    ],
    [
        'type' => 'festival', 'match' => 'ratha-saptami', 'priority' => 3,
        'badge_hi' => 'रथाष्टमी – सूर्य आराधना',
        'note_hi' => 'रथाष्टमी को सूर्य देव का रथ दिशाएँ बदलता है – सूर्य आरती व गायत्री जाप शुभ।',
        'tracks' => ['surya-aarti-om-jai-surya', 'gayatri-mantra-108', 'aditya-hridayam-stotram'],
    ],
    [
        'type' => 'festival', 'match' => 'varalakshmi', 'priority' => 3,
        'badge_hi' => 'वरलक्ष्मी व्रत',
        'note_hi' => 'वरलक्ष्मी व्रत में माँ लक्ष्मी से सौभाग्य-वरदान की कामना से आरती विशेध शुभ है।',
        'tracks' => ['om-jai-lakshmi-mata', 'mere-ghar-aao-lakshmi-maa', 'kanakadhara-stotram', 'ashtalakshmi-stotram'],
    ],
    [
        'type' => 'festival', 'match' => 'nag-panchami', 'priority' => 3,
        'badge_hi' => 'नाग पंचमी',
        'note_hi' => 'नाग पंचमी पर नाग देवता की पूजा और शिव-कृष्ण (कालिय नाग) भक्ति विशेध शुभ है।',
        'tracks' => ['om-jai-shiv-omkara', 'krishna-govind-hare-murari'],
    ],
];

return [
    'tithi_groups' => $tithi_groups,
    'rules' => $rules,
];
