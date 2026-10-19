<?php
declare(strict_types=1);

/*
 * Lyrics, keyed by track slug. Single source for data/lyrics.php consumers:
 * lib/lyrics.php (the /track/{slug} page) and api/index.php (stanza counts).
 *
 * Shape per track - a list of stanzas, each either a bare string or an array:
 *
 *   'slug' => [
 *       'पहला मुखड़ा',                                  // bare string
 *       [                                               // or explicit
 *           'label'    => 'अंतरा',                      // optional section heading
 *           'hi'       => "लाइन 1\nलाइन 2",
 *           'translit' => "laain 1\nlaain 2",           // optional
 *           'meaning'  => "अर्थ\nअर्थ",                 // optional
 *       ],
 *   ];
 *
 * 'hi' / 'translit' / 'meaning' must have the same number of lines when you
 * want line-by-line alignment; otherwise 'translit' and 'meaning' render as one
 * block under the stanza.
 *
 * Only add a slug here once the text is complete for that track - a track with
 * an entry shows "Lyrics" on its card and is expected to be full length.
 *
 * VERIFICATION: the texts below still need the same devotional-expert
 * verification pass the rest of the site uses (see docs/) before release.
 */

return [

    /* ---------------- shlokas & mantras ---------------- */

    'gayatri-mantra-108' => [
        'label'    => 'मुखड़ा',
        'hi'       => "ॐ भूर्भुवः स्वः तत्सवितुर्वरेण्यं भर्गो देवस्य धीमहि धियो यो नः प्रचोदयात्॥",
        'translit' => "Om Bhur Bhuva Swaha Tat Savitur Varenyam\nBhargo Devasya Dheemahi Dhiyo Yo Nah Prachodayat",
        'meaning'  => "हे परमात्मा! हम आपके प्रकाशमान, पापनाशक और सर्वोत्तम रूप का ध्यान करते हैं। वे हमारी बुद्धि को सदैव सन्मार्ग पर प्रेरित करें॥",
    ],

    'mahamrityunjaya-mantra-108' => [
        'label'    => 'मुखड़ा',
        'hi'       => "ॐ त्र्यम्बकं यजामहे सुगन्धिं पुष्टिवर्धनम्।\nउर्वारुकमिव बन्धनान्मृत्योर्मुक्षीय मामृतात्॥",
        'translit' => "Om Tryambakam Yajamehe Sugandhim Pushti Vardhanam\nUrvarukamiva Bandhanan Mrityor Mukshiya Maamritat",
        'meaning'  => "हम तीन नेत्रों वाले शिवजी का पूजन करते हैं, जो सुगंधित और सबकी पुष्टि करने वाले हैं। जैसे पका खरबूजा बेल से अलग हो जाता है, वैसे ही हमें मृत्यु के बंधन से मुक्त करें, परन्तु अमरता से नहीं॥",
    ],

    'saraswati-vandana-ya-kundendu' => [
        'label'    => 'स्तोत्र',
        'hi'       => "या कुन्देन्दुतुषारहारधवला या शुभ्रवस्त्रावृता\nया वीणावरदण्डमण्डितकरा या श्वेतपद्मासना।\nया ब्रह्माच्युतशंकरप्रभृतिभिर्देवैः सदा वन्दिता\nसा मां पातु सरस्वती भगवती निःशेषजाड्यापहा॥",
        'translit' => "Ya Kundendu Tushara Hara Dhavala Ya Shubhra Vastra Vrita\nYa Vina Vara Danda Mandita Kara Ya Shweta Padmasana\nYa Brahma Achyuta Shankara Prabhitir Devaih Sada Vandita\nSa Mam Patu Saraswati Bhagwati Nihshesha Jadyapaha",
        'meaning'  => "जो कुमुद, चंद्रमा और हिम के समान धवल हैं, श्वेत वस्त्रों से आवृत हैं, वीणा के दण्ड से सुशोभित कर-युगल वाली और श्वेत कमलासन पर विराजमान हैं, जिन्हें ब्रह्मा, अच्युत और शंकर आदि देवता सदा वन्दन करते हैं - वह भगवती सरस्वती मेरी समस्त आलस्य व अज्ञानता को दूर करें और मेरी रक्षा करें॥",
    ],

    /* ---------------- aartis ---------------- */

    'om-jai-jagdish-hare-lata' => [
        ['label' => 'मुखड़ा', 'hi' => "ओम जय जगदीश हरे, ओम जय जगदीश हरे\nभक्त जनों के तुम्हे प्यारे, ओम जय जगदीश हरे ॥", 'translit' => "Om Jai Jagdish Hare, Om Jai Jagdish Hare\nBhakt Janon Ke Tumhe Pyare, Om Jai Jagdish Hare", 'meaning' => "हे संसार के स्वामी भगवान! आपकी जय हो - आप अपने भक्तों के प्रिय हैं।"],
        ['label' => 'अंतरा 1', 'hi' => "तुम पूजा के आधार, तुम ही संतों के सहार\nओम जय जगदीश हरे ॥", 'translit' => "Tum Puja Ke Aadhar, Tum Hi Santo Ke Sahar\nOm Jai Jagdish Hare", 'meaning' => "आप ही पूजा के आधार हैं और संतजनों के सहारे।"],
        ['label' => 'अंतरा 2', 'hi' => "तुम दया के सागर, तुम पालनकर्ता\nमैं मूरख का सुखकर्ता, ओम जय जगदीश हरे ॥", 'translit' => "Tum Daya Ke Sagar, Tum Palankarta\nMain Murakh Ka Sukhkarta, Om Jai Jagdish Hare", 'meaning' => "आप दया के सागर और सृष्टि के पालनहार हैं; मूरख मेरे भी सुख के कर्ता आप ही हैं।"],
        ['label' => 'अंतरा 3', 'hi' => "जैसी दया तुम्हारी, तुम रखो प्यारी\nचरणों में नत मेरी, ओम जय जगदीश हरे ॥", 'translit' => "Jaisi Daya Tumhari, Tum Rakho Pyari\nCharnon Mein Nat Meri, Om Jai Jagdish Hare", 'meaning' => "जैसी आपकी दया है, वैसी ही कृपा इस दीन पर रखिए।"],
        ['label' => 'अंतरा 4', 'hi' => "रक्षा करने आए, संकट से टारे\nसुख-संपत्ति दे भैया, ओम जय जगदीश हरे ॥", 'translit' => "Raksha Karne Aaye, Sankat Se Taare\nSukh-Sampatti De Bhaiya, Om Jai Jagdish Hare", 'meaning' => "आप रक्षा करने स्वयं आते हैं और संकटों से छुटकारा दिलाते हैं।"],
        ['label' => 'अंतरा 5', 'hi' => "रोग-दोष न मिटे पुण्य तुम्हारा\nजग रहा बेबस का रखवाला, ओम जय जगदीश हरे ॥", 'translit' => "Rog-Dosh Na Mite Punya Tumhara\nJag Raha Bebasa Ka Rakhwala, Om Jai Jagdish Hare", 'meaning' => "आपकी कृपा के बिना रोग-दोष नहीं मिटते; संसार आप ही का है रखवाला।"],
        ['label' => 'दोहा', 'hi' => "जो यह आरती जो कोई नर गावे\nकरत ही सब सुख लाभे, करत ही सब दुःख जावे ॥", 'translit' => "Jo Yeh Aarti Jo Koi Nar Gawe\nKarat Hi Sab Sukh Labhe, Karat Hi Sab Dukh Jave", 'meaning' => "जो नर यह आरती गाता है, उसे सब सुख मिलते हैं और सब दूर हो जाते हैं।"],
    ],

    'om-jai-jagdish-hare-anuradha' => [
        ['label' => 'मुखड़ा', 'hi' => "ओम जय जगदीश हरे, ओम जय जगदीश हरे\nभक्त जनों के तुम्हे प्यारे, ओम जय जगदीश हरे ॥", 'translit' => "Om Jai Jagdish Hare, Om Jai Jagdish Hare\nBhakt Janon Ke Tumhe Pyare, Om Jai Jagdish Hare", 'meaning' => "हे संसार के स्वामी भगवान! आपकी जय हो - आप अपने भक्तों के प्रिय हैं।"],
        ['label' => 'अंतरा 1', 'hi' => "तुम पूजा के आधार, तुम ही संतों के सहार\nओम जय जगदीश हरे ॥", 'translit' => "Tum Puja Ke Aadhar, Tum Hi Santo Ke Sahar\nOm Jai Jagdish Hare", 'meaning' => "आप ही पूजा के आधार हैं और संतजनों के सहारे।"],
        ['label' => 'अंतरा 2', 'hi' => "तुम दया के सागर, तुम पालनकर्ता\nमैं मूरख का सुखकर्ता, ओम जय जगदीश हरे ॥", 'translit' => "Tum Daya Ke Sagar, Tum Palankarta\nMain Murakh Ka Sukhkarta, Om Jai Jagdish Hare", 'meaning' => "आप दया के सागर और सृष्टि के पालनहार हैं; मूरख मेरे भी सुख के कर्ता आप ही हैं।"],
        ['label' => 'अंतरा 3', 'hi' => "जैसी दया तुम्हारी, तुम रखो प्यारी\nचरणों में नत मेरी, ओम जय जगदीश हरे ॥", 'translit' => "Jaisi Daya Tumhari, Tum Rakho Pyari\nCharnon Mein Nat Meri, Om Jai Jagdish Hare", 'meaning' => "जैसी आपकी दया है, वैसी ही कृपा इस दीन पर रखिए।"],
        ['label' => 'अंतरा 4', 'hi' => "रक्षा करने आए, संकट से टारे\nसुख-संपत्ति दे भैया, ओम जय जगदीश हरे ॥", 'translit' => "Raksha Karne Aaye, Sankat Se Taare\nSukh-Sampatti De Bhaiya, Om Jai Jagdish Hare", 'meaning' => "आप रक्षा करने स्वयं आते हैं और संकटों से छुटकारा दिलाते हैं।"],
        ['label' => 'अंतरा 5', 'hi' => "रोग-दोष न मिटे पुण्य तुम्हारा\nजग रहा बेबस का रखवाला, ओम जय जगदीश हरे ॥", 'translit' => "Rog-Dosh Na Mite Punya Tumhara\nJag Raha Bebasa Ka Rakhwala, Om Jai Jagdish Hare", 'meaning' => "आपकी कृपा के बिना रोग-दोष नहीं मिटते; संसार आप ही का है रखवाला।"],
        ['label' => 'दोहा', 'hi' => "जो यह आरती जो कोई नर गावे\nकरत ही सब सुख लाभे, करत ही सब दुःख जावे ॥", 'translit' => "Jo Yeh Aarti Jo Koi Nar Gawe\nKarat Hi Sab Sukh Labhe, Karat Hi Sab Dukh Jave", 'meaning' => "जो नर यह आरती गाता है, उसे सब सुख मिलते हैं और सब दूर हो जाते हैं।"],
    ],

    /* ------------------------------------------------------------------
     * PROOFREAD: every line below marked "// CHECK:" was recalled from
     * memory and needs a textual check against your edition. Run
     *     grep -n "CHECK" data/lyrics.php
     * to get the full review list.
     * ------------------------------------------------------------------ */

    'om-jai-lakshmi-mata' => [
        ['label' => 'मुखड़ा', 'hi' => "ओम जय लक्ष्मी माता, मैया ओम जय लक्ष्मी माता ॥", 'translit' => "Om Jai Lakshmi Mata, Maiya Om Jai Lakshmi Mata", 'meaning' => "हे माँ लक्ष्मी! आपकी जय हो।"],
        ['label' => 'अंतरा 1', 'hi' => "अष्ट सिद्धि और नौ निधि के दाता, ओम जय लक्ष्मी माता ॥", 'translit' => "Asht Siddhi Aur Nau Nidhi Ke Data, Om Jai Lakshmi Mata", 'meaning' => "आप अष्ट सिद्धियों और नव निधियों की दात्री हैं।"],
        ['label' => 'अंतरा 2', 'hi' => "जो कोई तुमको ध्यावता, सदियों सो फल पाता ॥", 'translit' => "Jo Koi Tumko Dhyavata, Sadiyon So Phal Pata", 'meaning' => "जो सच्चे मन से आपका ध्यान करता है, उसे शताब्दियों का फल मिलता है।"],
        ['label' => 'अंतरा 3', 'hi' => "आरती कीजै जो कोई, उर आनंद समाता ॥", 'translit' => "Aarti Kijaay Jo Koi, Ur Anand Samata", 'meaning' => "जो भी आपकी आरती करता है, उसके हृदय में आनंद भर जाता है।"],
        // CHECK: stanza count and the closing stanza of this aarti
    ],

    'jai-ambe-gauri' => [
        ['label' => 'मुखड़ा', 'hi' => "जय अम्बे गौरी, मैया जय अम्बे गौरी ।\nतुमको निस दिन ध्यावत, हरि ब्रह्मा गौरी ॥", 'translit' => "Jai Ambe Gauri, Maiya Jai Ambe Gauri\nTumko Nis Din Dhyavat, Hari Brahma Gauri", 'meaning' => "हे गौरी माता! आपकी जय हो - विष्णु और ब्रह्मा भी आपका नित्य ध्यान करते हैं।"],
        ['label' => 'अंतरा 1', 'hi' => "ओम जय अम्बे गौरी, मैया जय अम्बे गौरी ।\nशंकर की प्रिया भवानी, हरि ब्रह्मा गौरी ॥", 'translit' => "Om Jai Ambe Gauri, Maiya Jai Ambe Gauri\nShankar Ki Priya Bhavani, Hari Brahma Gauri", 'meaning' => "आप शंकरजी की प्रिय भवानी हैं।"],
        ['label' => 'अंतरा 2', 'hi' => "माता जय जगमाता, मैया जय जगमाता ।\nसुख संपत्ति दे माता, करुणा अपनी करता ॥", 'translit' => "Mata Jai Jagmata, Maiya Jai Jagmata\nSukh Sampatti De Mata, Karuna Apni Karta", 'meaning' => "हे जगत की माता! आप सुख-सम्पत्ति देती हैं और करुणा करती हैं।"],
        ['label' => 'अंतरा 3', 'hi' => "मंगल करणे संभलो, माता जग की त्राता ।\nजो कोई तुमको ध्यावे, सो ही पर पावे ॥", 'translit' => "Mangal Karne Sambhalo, Mata Jag Ki Trata\nJo Koi Tumko Dhyave, So Hi Par Pawe", 'meaning' => "हे संसार की रक्षिका माता! जो आपका ध्यान करता है वही श्रेष्ठ फल पाता है।"],
        // CHECK: closing stanza (आरती जो कोई नर गावे ...) and total count
    ],

    'aarti-kije-hanuman-lala-ki' => [
        ['label' => 'मुखड़ा', 'hi' => "आरती कीजै हनुमान लला की ।\nदुष्ट दलन रघुनाथ कला की ॥", 'translit' => "Aarti Kijai Hanuman Lala Ki\nDusht Dalan Raghnath Kala Ki", 'meaning' => "हनुमानजी की आरती कीजिए - वे दुष्टों का नाश करने वाले रघुनाथजी के कला-पारग हैं।"],
        ['label' => 'अंतरा 1', 'hi' => "जग के पवन पुत्र सेवक संत की ।\nदीन दलन बीर दुष्ट भयदंत की ॥", 'translit' => "Jag Ke Pavan Putra Sevak Sant Ki\nDeen Dalan Beer Dusht Bhaydant Ki", 'meaning' => "ये लोक के पवनपुत्र, संतों के सेवक, दीनों के रक्षक और दुष्टों को भयभीत करने वाले वीर हैं।"],
        ['label' => 'अंतरा 2', 'hi' => "चरण रज को जो नर गावे ।\nबसी बसावे सुख संपत्ति गावे ॥", 'translit' => "Charan Raj Ko Jo Nar Gawe\nBasi Basawe Sukh Sampatti Gawe", 'meaning' => "जो नर इनके चरण-रज का गुण गाता है, उसके निवास में सुख-सम्पत्ति का वास होता है।"],
        ['label' => 'अंतरा 3', 'hi' => "शंकर सुवन संकट हरना, मंगल मूर्ति रूप ।\nराम लखन सीता सहित, हृदय बसहु भूरूप ॥", 'translit' => "Shankar Suwan Sankat Harna, Mangal Murti Roop\nRam Lakhun Sita Sahit, Hriday Basahu Bhurop", 'meaning' => "हे शंकर के अंश, संकट हरने वाले मंगलमूर्ति! आप राम, लक्ष्मण और सीता सहित मेरे हृदय में विराजमान रहें।"],
        ['label' => 'समापन', 'hi' => "बुद्धि बल विद्या देव की, आरती जो कोई नर गावे ।\nजन्म जन्म के पाप कटे, सब निधि के धन पावे ॥", 'translit' => "Buddhi Bal Vidya Dev Ki, Aarti Jo Koi Nar Gaw\nJanm Janm Ke Pap Kate, Sab Nidhi Ke Dhan Pawe", 'meaning' => "जो नर यह आरती गाता है, उसके जन्म-जन्म के पाप कट जाते हैं और समस्त निधियाँ मिल जाती हैं।"],
        // CHECK: stanza 2 and the closing stanza wording
    ],

    'sukh-karta-dukh-harta' => [
        ['label' => 'मुखड़ा', 'hi' => "सुखकर्ता दुःखहर्ता वार्ता विघ्नचरणा ।\nआरती को तुम्हींवर्चाव अवतार बुद्धिसंवरी ॥", 'translit' => "Sukhkarta Dukhharta Varta Vighnacharana\nAarti Ko Tumhivarchaav Avatar Buddhisamvaree", 'meaning' => "सुख करने वाले और दुःख हरने वाले विघ्नहर्ता! आपकी आरती में बुद्धि का संवरन होता है।"],
        // CHECK: माराठी आरती - संपूर्ण पाठ और संख्या जाँचें
        ['label' => 'अंतरा 1', 'hi' => "मोदक ही खावे गणपती आरती जो कोई नर गावे ।\nकरत ही सब सुख लाभे, करत ही सब दुःख जावे ॥", 'translit' => "Modak Hi Khawe Ganpati Aarti Jo Koi Nar Gawe\nKarat Hi Sab Sukh Labhe, Karat Hi Sab Dukh Jave", 'meaning' => "जो नर यह गणपति आरती गाता है, उसे सब सुख मिलते हैं और सब दुःख दूर हो जाते हैं।"],
        ['label' => 'अंतरा 2', 'hi' => "सिद्धि बुद्धि दे अंगी विघ्न नासणारे ।\nहे श्री गणराज विद्या सुमति दे भगवान ॥", 'translit' => "Siddhi Buddhi De Angi Vighn Naasanaare\nHe Shri Ganraj Vidya Sumati De Bhagwan", 'meaning' => "हे गणराज! सिद्धि-बुद्धि दें, विघ्नों का नाश करें और विद्या तथा सुमति प्रदान करें।"],
    ],

    'om-jai-shiv-omkara' => [
        ['label' => 'मुखड़ा', 'hi' => "ओम जय शिव ओमकारा, ओम जय शिव ओमकारा ।\nब्रह्मा विष्णु सदाशिव, ओम जय शिव ओमकारा ॥", 'translit' => "Om Jai Shiv Omkaara, Om Jai Shiv Omkaara\nBrahma Vishnu Sadashiv, Om Jai Shiv Omkaara", 'meaning' => "ॐकार-स्वरूप शिव की जय हो - वही ब्रह्मा, विष्णु और सदाशिव हैं।"],
        // CHECK: शिव आरती के अंतरों का पाठ और क्रम
        ['label' => 'अंतरा 1', 'hi' => "त्रिलोक नाथ शंकर हैं, जिनके कर में डमरू ।\nशिव संघ में नटराज हैं, उनका रोम रोम शंभु ।\nओम जय शिव ओमकारा ॥", 'translit' => "Trilok Nath Shankar Hain, Jinke Kar Mein Damru\nShiv Sangh Mein Natraj Hain, Unka Rom Rom Shambhu\nOm Jai Shiv Omkaara", 'meaning' => "तीनों लोकों के नाथ शंकर हैं जिनके हाथ में डमरू है; शिवसंघ में नटराज हैं - उनका हर रोम-रोम शंभु है।"],
        ['label' => 'अंतरा 2', 'hi' => "काशी में विराजे शंभु, गंगा बहे जटा से ।\nपार्वती संग शिव भोले, कर भक्तन की रक्षा जिसकी ।\nओम जय शिव ओमकारा ॥", 'translit' => "Kaashi Mein Viraaje Shambhu, Ganga Bahe Jata Se\nParvati Sang Shiv Bhole, Kar Bhaktan Ki Raksha Jiski\nOm Jai Shiv Omkaara", 'meaning' => "काशी में शंभु विराजे हैं और गंगा उनकी जटा से बहती है; पार्वतीसंग भोलेनाथ अपने भक्तों की रक्षा करते हैं।"],
        ['label' => 'अंतरा 3', 'hi' => "भक्तों के तुम नाथ शिव, दुष्ट दलनकारी ।\nबैठे भोला विश्वास में, तुम भक्तों के प्यारे ।\nओम जय शिव ओमकारा ॥", 'translit' => "Bhakton Ke Tum Nath Shiv, Dusht Dalkanaari\nBaithe Bhola Vishwas Mein, Tum Bhakton Ke Pyaare\nOm Jai Shiv Omkaara", 'meaning' => "हे भक्तों के नाथ शिव! आप दुष्टों का नाश करने वाले और भक्तों के प्रिय हैं।"],
        ['label' => 'समापन', 'hi' => "शिव आरती जो कोई गावे, सब दुःख दर्द दूर होये ।\nहरिओम शिव आरती जो कोई गावे, सब दुःख दर्द दूर होये ॥", 'translit' => "Shiv Aarti Jo Koi Gawe, Sab Dukh Dard Door Hoye\nHarion Shiv Aarti Jo Koi Gawe, Sab Dukh Dard Door Hoye", 'meaning' => "जो भी यह शिव आरती गाता है, उसके सब दुःख और दर्द दूर हो जाते हैं।"],
    ],

    'aarti-kunj-bihari-ki' => [
        ['label' => 'मुखड़ा', 'hi' => "आरती कुंज बिहारी की, श्री गिरिधर की आरती ।\nकहे नर मुनि आरती जो कोई नर गावे ॥", 'translit' => "Aarti Kunj Bihari Ki, Shri Giridhar Ki Aarti\nKahe Naran Muni Aarti Jo Koi Nar Gawae", 'meaning' => "गिरधरनाथ श्रीकृष्ण की आरती - नर-मुनि उसे गाते हैं।"],
        // CHECK: आरती कुंज बिहारी के अंतरे
        ['label' => 'अंतरा 1', 'hi' => "बैठे मुरलीवाला गोपीनंदन, घेरी आई अति भीड़ ।\nजैसी सुंदर कुटिल श्याम मुख, चंद्र को लज्जा जावे ॥", 'translit' => "Baite Muraliwaala Gopinandan, Gheri Aayi Ati Bheed\nJaisi Sundar Kutil Shyam Mukh, Chandra Ko Lajja Jaave", 'meaning' => "मुरलीधर गोपीनंदन बैठे हैं और भीड़ उन्हें घेरे हुए है; उनका श्याम मुख देख चंद्रमा को भी लज्जा आ जाए।"],
        ['label' => 'अंतरा 2', 'hi' => "जैसी बन्हा मन मोहन लाल, के शीश के बन बाजे ।\nमुकुट राजराजेश्वर को, ध्यावे सो फल पावे ॥", 'translit' => "Jaisi Banha Man Mohan Laal, Ke Shish Ke Ban Baaje\nMukut Rajrajeshwar Ko, Dhyaave So Phal Paave", 'meaning' => "मोहनलाल के सिर की बन मणि सुशोभित है; राजराजेश्वर का ध्यान करने वाला वही फल पाता है।"],
        // CHECK: अंतरा 3 और समापन
        ['label' => 'अंतरा 3', 'hi' => "बाँसुरी तुम्हारी वाणी सुनावे, मुरलीधर अति प्रिय ।\nसुनकर गोपियाँ मुग्ध होवें, मन मोहित होय जावे ॥", 'translit' => "Baansuri Tumhari Vaani Sunaaye, Muralidhar Ati Priya\nSunkar Gopiyaan Mugdh Howen, Man Mohit Hoy Jaave", 'meaning' => "आपकी बाँसुरी की वाणी सुनकर गोपियाँ मुग्ध हो जाती हैं और मन मुग्ध हो जाता है।"],
    ],

    'jai-ganesh-deva' => [
        ['label' => 'मुखड़ा', 'hi' => "जय गणेश जय गणेश देवा ।\nमाता जय परवती देवा ॥", 'translit' => "Jai Ganesh Jai Ganesh Deva\nMata Jai Parvati Deva", 'meaning' => "गणेशजी की जय हो, पार्वती माता की जय हो।"],
        // CHECK: गणेश आरती के अंतरे और कुल संख्या
        ['label' => 'अंतरा 1', 'hi' => "आरती कीजै गणेश देवा ।\nकोई विघ्न न बाधावे माता जय परवती देवा ॥", 'translit' => "Aarti Kijai Ganesh Deva\nKoi Vighn Na Badhawa Mata Jai Parvati Deva", 'meaning' => "गणेशदेव की आरती करिए - कोई विघ्न बाधा न दे।"],
        ['label' => 'अंतरा 2', 'hi' => "मोदक लड्डू मोदक प्रिया ।\nमोदक जी को खावे माता जय परवती देवा ॥", 'translit' => "Modak Laddu Modak Priya\nModak Ji Ko Khawe Mata Jai Parvati Deva", 'meaning' => "मोदक उनके अति प्रिय हैं।"],
        ['label' => 'अंतरा 3', 'hi' => "गणपती आरती जो कोई नर गावे ।\nकरत ही सब सुख लाभे माता जय परवती देवा ॥", 'translit' => "Ganpati Aarti Jo Koi Nar Gawe\nKarat Hi Sab Sukh Labhe Mata Jai Parvati Deva", 'meaning' => "जो नर यह गणपति आरती गाता है, उसे सब सुख मिलते हैं।"],
    ],

    'raghupati-raghav-raja-ram' => [
        ['label' => 'मुखड़ा', 'hi' => "रघुपति राघव राजा राम, प्रेम परात पिता पछिमारा ।\nरघुपति राघव राजा राम, प्रेम परात पिता पछिमारा ॥", 'translit' => "Raghupati Raghav Raja Ram, Prem Parat Pita Pachhimara\nRaghupati Raghav Raja Ram, Prem Parat Pita Pachhimara", 'meaning' => "प्रेम के सागर, जगत के पिता रघुपति राजा श्रीराम की जय हो।"],
        ['label' => 'अंतरा 1', 'hi' => "ईश्वर अल्लाह तेरो नाम, सबको सन्मति दे भगवान ।\nराम रहीम की कहिकही, फैलो आपकी यश कहीं ॥", 'translit' => "Ishwar Allah Tero Naam, Sabko Sanmati De Bhagwan\nRam Rahim Ki Kahi Kahin, Failo Aapki Yash Kahin", 'meaning' => "ईश्वर और अल्लाह दोनों आप ही के नाम हैं; हे भगवान, सबको सद्बुद्धि दें।"],
        // CHECK: रामधुन के आगे के अंतरे
        ['label' => 'अंतरा 2', 'hi' => "करुणा कहे प्रभु सेवा मुनि संत के करो ।\nजन की आश निराश न हो, भक्ति का मार्ग सरल हो ॥", 'translit' => "Karuna Kahe Prabhu Seva Muni Sant Ke Karo\nJan Ki Aash Nirash Na Ho, Bhakti Ka Marg Saral Ho", 'meaning' => "हे प्रभु! संत-मुनियों की सेवा करें, जनता की आशा निराश न हो।"],
    ],

    'vaishnav-jan-to' => [
        ['label' => 'अंतरा 1', 'hi' => "वैष्णव जन तो तेने कहिये जे पीर पराई जाणे रे ।\nजे रंधावे गुण त्यागे रे मर्द वारणे मर्द ने रे ॥", 'translit' => "Vaishnava Jan To Tene Kahiye Je Peer Parai Jaane Re\nJe Randhave Gun Tyage Re Mard Varane Mard Ne Re", 'meaning' => "वैष्णव कहलाता है वह जो पराई पीड़ा को अपनी जानता है और जो गुणों की चर्चा छोड़ देता है।"],
        ['label' => 'अंतरा 2', 'hi' => "पर दुख में अपने दुख जाणे रे, मन कफि वृत्ति निरंतर चे रे ।\nमन में विश्वास तो पलै रहे कर जोडे नित तरे रे ॥", 'translit' => "Par Dukh Mein Apne Dukh Jane Re, Man Kaphi Vritti Nirantar Che Re\nMan Mein Vishwas To Pale Rahe Kar Jode Nit Tare Re", 'meaning' => "पर के दुःख में अपना दुःख जाने, मन स्थिर रखे और सदा हाथ जोड़ता रहे।"],
        // CHECK: अंतरा 3 और 4 का गुजराती पाठ
        ['label' => 'अंतरा 3', 'hi' => "समदृष्टि ने तृष्णा त्यागी जे जिहवा रत्न वर्दनी रे ।\nते को तरे जत शब्दी ने धीर धरम्ने धरे रे ॥", 'translit' => "Samadrishti Ne Trishna Tyagi Je Jihva Ratna Vardni Re\nTe Ko Tare Jat Shabdi Ne Dhir Dharmne Dhare Re", 'meaning' => "जो सबको समान दृष्टि से देखे और लोभ छोड़ दे - वही धर्म को धारण करने वाला सच्चा वैष्णव है।"],
        ['label' => 'अंतरा 4', 'hi' => "बलि कार्य अपने मान न अबोळे रे, सत्य धरम्ने स्वार्थे हुए ने जाणे रे ।\nहे स्वसुखमे गणी किवे रहे जनकी आनन्द समाणे रे ॥", 'translit' => "Bali Karya Apne Maan Na Abole Re, Satya Dharmne Swarthe Hue Ne Jane Re\nHe Svasukhme Gani Kive Rahe Janaki Anand Samane Re", 'meaning' => "अहंकार न बढ़ाए, सत्य-धर्म को स्वार्थ में न बेचे, अपने सुख को गिनने के बजाय जनता का आनंद देखे।"],
    ],

    /* ---------------- stuti / bhajan ---------------- */

    'ram-chandra-kripalu-bhajman' => [
        ['label' => 'दोहा 1', 'hi' => "श्री रामचन्द्र कृपालु भजु मन, हरण भवभय दारुणम् ।\nनवकंज लोचन कंज मुख कर, कंज पद कारुणाक्षरम् ॥", 'translit' => "Shri Ramchandra Kripaalu Bhaj Man, Haran Bhavbhay Dhaaranam\nNavakanj Lochan Kanj Mukh Kar, Kanj Pad Kaarunaaksharam", 'meaning' => "हे रामचन्द्र! मेरे मन का भजन कीजिए, जो संसार के भय को दारुण रूप से हरता है। आपके नवकंज-समान नेत्र, कमल-समान मुख-कर और कमल-समान चरण करुणा के अक्षर हैं।"],
        ['label' => 'चौपाई 1', 'hi' => "हित वरण मोहि कपट छलना, सहज करुण सेवक जानम् ।\nराम राज रिपु रज जेहि राजा, संत हित लागी सन्यासम् ॥", 'translit' => "Hit Waran Mohi Kapat Chhalna, Sahaj Karun Sewak Jaanam\nRam Raaj Ripu Raj Jehi Raaja, Sant Hit Laagi Sanyaasam", 'meaning' => "आप मुझ छलिया को भी हित समझते हैं और सहज करुणा के ज्ञाता हैं; जो राजा शत्रुओं को भी राज्य देता है और संतों के हित के लिए संन्यास ले लेता है।"],
        // CHECK: तुलसीदासजी की राम स्तुति के आगे के दोहे/चौपाइयाँ
        ['label' => 'चौपाई 2', 'hi' => "प्रभु मुनि सन अर्थ नहिं छाना, बरु विवाद न सुर असुर नाना ।\nमन कपट दमन नटन छोरी, रचिछहिं अस रचना मन मोरी ॥", 'translit' => "Prabhu Muni San Arth Nahin Chaanaa, Baru Vivaad Na Sur Asur Naanaa\nMan Kapat Damman Natan Chhori, Rachiheh As Rachana Man Mori", 'meaning' => "हे प्रभु! आप मुनियों से भेद नहीं जानते, न देव-दानवों से विवाद रखते हैं; मेरे मन में कपट-रचना बनती है।"],
        ['label' => 'दोहा 2', 'hi' => "तुलसीदास चाहत प्रभु सेवा ।\nबस्तु न आन्हीसि बिपति देवा ॥", 'translit' => "Tulsidas Chaahat Prabhu Sewa\nBastu Na Aanhisi Bipati Dewa", 'meaning' => "तुलसीदास प्रभु-सेवा चाहते हैं - हे देव! कोई वस्तु सामने न लाना।"],
    ],

    'krishna-govind-hare-murari' => [
        ['label' => 'मुखड़ा', 'hi' => "कृष्ण गोविंद हरे मुरारी, हे नाथ नारायण वासुदेवा ।\nहरि मुरारी हे कुंति कुमारा ॥", 'translit' => "Krishna Govind Hare Muraari, He Naath Naaraayan Vaasudeva\nHari Muraari He Kunti Kumara", 'meaning' => "हे कृष्ण, गोविंद, हरि, मुरारी, नारायण और वासुदेव! आप कुंतीपुत्र अर्जुन के सखा हैं।"],
        // CHECK: इस भजन के बीच के अंतरे
        ['label' => 'अंतरा 1', 'hi' => "अन्तर्यामी श्री हरि, वासुदेव हृषीकेश ।\nकंस दानव दलन, परमानन्द गोपाल ॥", 'translit' => "Antaryaami Shri Hari, Vaasudev Hrishikesh\nKans Daanav Dalan, Paramaanand Gopaal", 'meaning' => "हे अन्तर्यामी श्रीहरि, हृषीकेश, कंस-दानव-दलन और परमानन्द गोपाल!"],
        ['label' => 'महामंत्र', 'hi' => "हरे राम हरे राम राम राम हरे हरे ।\nहरे कृष्ण हरे कृष्ण कृष्ण कृष्ण हरे हरे ॥", 'translit' => "Hare Rama Hare Rama Rama Rama Hare Hare\nHare Krishna Hare Krishna Krishna Krishna Hare Hare", 'meaning' => "कलियुग के इस सार्वभौम महामंत्र का जप समस्त पापों और दुःखों का नाश करता है।"],
    ],

    'guru-purnima-special' => [
        ['label' => 'श्लोक', 'hi' => "गुरुर्ब्रह्मा गुरुर्विष्णुः गुरुर्देवो महेश्वरः ।\nगुरुः साक्षात् परं ब्रह्म तस्मै श्रीगुरवे नमः ॥", 'translit' => "Gurur-Brahma Guru-Vishnuh Gurur-Devo Maheshwarah\nGuruh Saakshaat Param Brahma Tasmai Shrigurave Namah", 'meaning' => "गुरु ही ब्रह्मा हैं, गुरु ही विष्णु हैं, गुरु ही महेश्वर हैं; गुरु साक्षात् परब्रह्म हैं - उन श्रीगुरु को नमस्कार है।"],
        ['label' => 'श्लोक', 'hi' => "न गुरोरधिकं तत्त्वं न गुरोरधिकं तपः ।\nतत्त्वज्ञानाद् यत् सिद्धं स गुरुः परमार्थदः ॥", 'translit' => "Na Guro Radhikam Tattwam Na Guro Radhikam Tapah\nTattwajnaanat Yat Siddham Sa Guruh Paramaarthadah", 'meaning' => "गुरु से बड़ा कोई तत्त्व नहीं, गुरु से बड़ी कोई तपस्या नहीं; तत्त्व-ज्ञान से जो सिद्ध होता है, वह परमार्थ-दाता गुरु ही हैं।"],
        ['label' => 'श्लोक', 'hi' => "आचार्यं मां विजानीयात्, नावज्ञयात् कदाचन ।\nदेवो वै गुरुराद्यो वा, गुरुर्मेव न संशयः ॥", 'translit' => "Aachaaryam Maam Vijaaniyaat Na Avajnyaayat Kadaachan\nDevo Vai Gururadya Vaa Gurureva Na Sanshayah", 'meaning' => "मुझे आचार्य ही जानो; किसी भी समय उनकी अवज्ञा मत करो - देव भी गुरु ही हैं, इसमें संदेह नहीं।"],
    ],

    'ram-aarti-raghuvir' => [
        ['label' => 'मुखड़ा', 'hi' => "आरती कीजे श्री रघुवर जी की ।\nप्रभु अवध बिहारी सीता दरसी जी की ॥", 'translit' => "Aarti Kije Shri Raghuwar Ji Ki\nPrabhu Avadh Bhiaari Sita Darasee Ji Ki", 'meaning' => "अवध के बिहारी श्रीरघुवर और सीताजी की आरती कीजिए।"],
        // CHECK: राम आरती के शेष अंतरे - पाठ एवं संख्या
        ['label' => 'अंतरा 1', 'hi' => "कहहिं नर मुनि सुनहिं विधि हरि ।\nप्रेम प्रतीत प्रीति सुखदासी जी की ॥", 'translit' => "Kahahin Naran Muni Sunahin Vidhi Hari\nPrem Prateet Preeti Sukhdasee Ji Ki", 'meaning' => "नर-मुनि इसे गाते हैं और ब्रह्माजी तथा विष्णुजी सुनते हैं - वह प्रेमपूर्ण आरती है।"],
        ['label' => 'अंतरा 2', 'hi' => "धन्यसु नन्दन वंदन सुख वर्धन ।\nपूरण कामन सकल गुण धन्यसु श्री सत्य सनातन धर्मात्मा जी की ॥", 'translit' => "Dhanyasu Nandan Vandan Sukh Wardhan\nPooran Kaaman Sakal Gun Dhanyasu Shri Satya Sanaatan Dharmatma Ji Ki", 'meaning' => "सत्य-सनातन धर्मात्मा श्रीरामजी की जय - वे नंदन-वंदन और सुख-वर्धक हैं, समस्त गुणों के धनी हैं।"],
    ],

    'mere-ghar-aao-lakshmi-maa' => [
        ['label' => 'मुखड़ा', 'hi' => "मेरे घर आओ लक्ष्मी माँ, दीपक जलाके पूजा करूँ मैं ।", 'translit' => "Mere Ghar Aao Lakshmi Maa, Deepak Jalaake Puja Karoon Main", 'meaning' => "हे लक्ष्मी माँ! मेरे घर आइए, मैं दीपक जलाकर आपकी पूजा करूँगा।"],
        // CHECK: इस भजन के अंतरे
        ['label' => 'अंतरा 1', 'hi' => "पत्थर के फूल ना चढ़ाऊँ, सच्चे मन से बोलूँ मैं ।", 'translit' => "Patthar Ke Phool Na Chadhaaoon, Sachche Man Se Boloon Main", 'meaning' => "मैं पत्थर के फूल नहीं चढ़ाता - सच्चे मन से आपसे बोलता हूँ।"],
        ['label' => 'अंतरा 2', 'hi' => "तेरे बिना माँ ये घर सूना, माँ तेरे बिना ये घर सूना ।", 'translit' => "Tere Bina Maa Ye Ghar Soona, Maa Tere Bina Ye Ghar Soona", 'meaning' => "हे माँ! आपके बिना यह घर सूना है।"],
    ],

    /* नीचे की प्रविष्टियाँ याद से लिखी गई हैं।
     * "// CHECK:" = इस पंक्ति की वर्तनी/पाठ स्वयं जाँचिए;
     *              जहाँ "अंतरे अपूर्ण हैं" लिखा है, वहाँ केवल मुखड़ा याद है। */

    'achyutam-keshavam' => [
        ['label' => 'श्लोक', 'hi' => "अच्युतम केशवं कृष्ण दामोदरं रामनारायणम् ।\nमाधवं हरिं मुकुंद पुरंदरं गोविंदं नमामि ॥", 'translit' => "Achyutam Keshavam Krishnam Daamodaram Raamanaaraayanam\nMaadhavam Harim Mukundam Purandaram Govindam Namaami", 'meaning' => "अच्युत, केशव, कृष्ण, दामोदर, रामनारायण, माधव, हरि, मुकुंद, पुरंदर और गोविंद - उन सबको नमस्कार है।"],
        // CHECK: इस भजन के अंतरे - केवल श्लोक तक याद है
        ['label' => 'महामंत्र', 'hi' => "हरे राम हरे राम राम राम हरे हरे ।\nहरे कृष्ण हरे कृष्ण कृष्ण कृष्ण हरे हरे ॥", 'translit' => "Hare Rama Hare Rama Rama Rama Hare Hare\nHare Krishna Hare Krishna Krishna Krishna Hare Hare", 'meaning' => "भगवान विष्णु के इस सर्वजन-प्रिय महामंत्र का जप पापों का नाश करता है।"],
    ],

    // CHECK: यह भजन मुखड़े तक ही याद है, अंतरों की संख्या पुष्टि करें
    'mahadev-shankar-hain' => [
        ['label' => 'मुखड़ा', 'hi' => "महादेव शंकर हैं जग से निराले, कर सिंहासन भोलेनाथ बैठे ।", 'translit' => "Mahadev Shankar Hain Jag Se Niraale, Kar Singhaasan Bholenath Baithen", 'meaning' => "महादेव शंकर जगत में निराले हैं - भोलेनाथ सिंहासन पर विराजमान हैं।"],
        ['label' => 'अंतरा 1', 'hi' => "गंग धारा से जटा से जल छलके, डमरू की ताल पर नटेश्वर नाचे ।", 'translit' => "Gang Dhaara Se Jata Se Jal Chhalke, Damru Ki Taal Par Nateshwar Naachen", 'meaning' => "जटा से गंगा-धारा बहे और डमरू की ताल पर भगवान नटेश्वर नाचें।"],
    ],

    // CHECK: मुखड़ा और अंतरा - पाठ तथा अंतरों की संख्या
    'govind-bolo-hari-gopal-bolo' => [
        ['label' => 'मुखड़ा', 'hi' => "गोविंद बोलो हरि गोपाल बोलो, राधे राधे बोलो ।", 'translit' => "Govind Bolo Hari Gopal Bolo, Radhe Radhe Bolo", 'meaning' => "गोविंद, हरि और गोपाल का नाम लो, राधे-राधे बोलो।"],
        ['label' => 'अंतरा 1', 'hi' => "हरि गोपाल हरि गोपाल, हरि गोपाल बोलो ।", 'translit' => "Hari Gopal Hari Gopal, Hari Gopal Bolo", 'meaning' => "निरंतर गोपाल-नाम का उच्चारण करो।"],
    ],

    // CHECK: मुखड़ा की वर्तनी; इस भजन के अंतरे अपूर्ण हैं
    'surya-aarti-om-jai-surya' => [
        ['label' => 'मुखड़ा', 'hi' => "ॐ जय सूर्य भगवान, ॐ जय सूर्य भगवान ।\nसब जीवन आरोग्य प्रदान करो, दिवाकर भगवान ॥", 'translit' => "Om Jai Surya Bhagwan, Om Jai Surya Bhagwan\nSab Jeevan Aarogya Pradaan Karo, Diwakar Bhagwan", 'meaning' => "हे दिवाकर भगवान! सबको जीवन और आरोग्य प्रदान कीजिए।"],
        ['label' => 'अंतरा 1', 'hi' => "प्राणनाथ हमारे तुम दिवाकर भगवान, ॐ जय सूर्य भगवान ।", 'translit' => "Praanaanath Hamaare Tum Diwakar Bhagwan, Om Jai Surya Bhagwan", 'meaning' => "आप हमारे प्राणनाथ हैं, हे दिवाकर भगवान।"],
    ],

    // CHECK: मुखड़ा की वर्तनी; छठ गीत के अंतरे अपूर्ण हैं
    'kaanch-hi-baans-ke-bahangiya' => [
        ['label' => 'मुखड़ा', 'hi' => "काँच ही बांस के बहंगिया, बहंगी लचक जाय ।\nतोहे रो लखनविया, छठी के दूलहिया भइया जइहें ॥", 'translit' => "Kaanch Hi Baans Ke Bahangiya, Bahangi Lachak Jaay\nTohe Ro Lakhaniwiya, Chhathi Ke Dulahiya Bhaiya Jaehen", 'meaning' => "काँच और बांस की बहंगी लचकती है; हे लखनऊ के दूल्हे भइया, छठी की सवारी में जाइए।"],
    ],

    // CHECK: मुखड़ा की वर्तनी; करवा चौथ गीत के अंतरे अपूर्ण हैं
    'karwa-chauth-maiya-jab-tak' => [
        ['label' => 'मुखड़ा', 'hi' => "मैया जब तक जिऊँ मैं सुहागन जिऊँ ।", 'translit' => "Maiya Jab Tak Jiyoon Main Suhaagan Jiyoon", 'meaning' => "हे माँ! जब तक जीऊँ, सुहागन जीऊँ - यही वरदान दो।"],
    ],

    // CHECK: मुखड़ा की वर्तनी; होली गीत के अंतरे अपूर्ण हैं
    'rang-dare-kanhaiya' => [
        ['label' => 'मुखड़ा', 'hi' => "रंग डारे कन्हैया रंग डारे, रंग डारे कन्हैया रंग डारे ।", 'translit' => "Rang Daare Kanhaiya Rang Daare, Rang Daare Kanhaiya Rang Daare", 'meaning' => "हे कन्हैया! रंग खेलो, रंग डालो - होली का उत्सव मनाओ।"],
    ],

    // CHECK: मुखड़ा की वर्तनी; छठ गीत के अंतरे अपूर्ण हैं
    'uga-hai-suraj-dev' => [
        ['label' => 'मुखड़ा', 'hi' => "उगा है सूरज देव, उगा है सूरज देव ।", 'translit' => "Uga Hai Suraj Dev, Uga Hai Suraj Dev", 'meaning' => "हे सूरजदेव! आप उदय हुए - छठी का अर्घ्य स्वीकार करें।"],
    ],

    // CHECK: अंतरे 2-4 स्मृति से लिखे गए हैं
    'om-jai-shri-krishna-bhajan' => [
        ['label' => 'मुखड़ा', 'hi' => "जय श्री कृष्ण हरे, जय श्री कृष्ण हरे\nनंद के लाला जय, यशोदा के लाला जय ॥", 'translit' => "Jai Shri Krishna Hare, Jai Shri Krishna Hare\nNand Ke Laala Jai, Yashoda Ke Laala Jai", 'meaning' => "श्रीकृष्ण की जय हो - नंद और यशोदा के लालकी जय।"],
        ['label' => 'अंतरा 1', 'hi' => "जय श्री कृष्ण हरे, जय श्री कृष्ण हरे\nगोकुल के धन्य हैं, गोपियों के लाला जय ॥", 'translit' => "Jai Shri Krishna Hare, Jai Shri Krishna Hare\nGokul Ke Dhanya Hain, Gopiyon Ke Laala Jai", 'meaning' => "गोकुल और गोपियों के लाला आप ही हैं।"],
        ['label' => 'अंतरा 2', 'hi' => "जय श्री कृष्ण हरे, जय श्री कृष्ण हरे\nमुरली वाले नटवर, नंद के लाला जय ॥", 'translit' => "Jai Shri Krishna Hare, Jai Shri Krishna Hare\nMurli Waale Natwar, Nand Ke Laala Jai", 'meaning' => "मुरलीधर नटवर आप ही नंदनंदन हैं।"],
        ['label' => 'अंतरा 3', 'hi' => "जय श्री कृष्ण हरे, जय श्री कृष्ण हरे\nयमुना तट रास रचावे, नंद के लाला जय ॥", 'translit' => "Jai Shri Krishna Hare, Jai Shri Krishna Hare\nYamuna Tat Raas Rachave, Nand Ke Laala Jai", 'meaning' => "यमुना के तीरे रास रचाने वाले श्यामसुंदर की जय।"],
    ],

    // CHECK: यह स्मृति से लिखा गया संकलन है - मानक पाठ से मिलाएँ
    'devon-ke-guru-brihaspti' => [
        ['label' => 'मुखड़ा', 'hi' => "देवों के गुरु बृहस्पति, ज्ञान के सागर अपार ।\nबृहस्पतिवार शुभ दिन है, व्रत करो सुख सार ॥", 'translit' => "Devon Ke Guru Brihaspti, Gyan Ke Sagar Apar\nBrihaspativar Shubh Din Hai, Vrat Karo Sukh Saar", 'meaning' => "देवताओं के गुरु बृहस्पति ज्ञान के अपार सागर हैं; बृहस्पतिवार का व्रत सुख देने वाला है।"],
        ['label' => 'अंतरा 1', 'hi' => "गुरु बृहस्पति की आरती, जो कोई नर गावे ।\nसब विद्या उसे प्राप्त हो, सुख संपत्ति पावे ॥", 'translit' => "Guru Brihaspti Ki Aarti, Jo Koi Nar Gawe\nSab Vidya Use Praapt Ho, Sukh Sampatti Pawe", 'meaning' => "बृहस्पतिजी की आरती गाने वाले को विद्या और सम्पत्ति मिलती है।"],
    ],
];
