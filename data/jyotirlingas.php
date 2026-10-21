<?php
declare(strict_types=1);

/*
 * The twelve Jyotirlingas and their YouTube LIVE darshan streams.
 *
 * Rules:
 *  - 'youtube_id' must point at a stream that is LIVE on YouTube, never at a
 *    recorded video. Null means "no live stream found yet" — such entries are
 *    returned by the API but hidden by the site until an id is supplied.
 *  - Re-verify any time with:
 *      node tools/live-check.mjs <id,id,...>        (is it live right now?)
 *      node tools/verify-player.mjs <id,id,...>     (does it embed/play?)
 *  - 'verified_on' is the date both checks last passed.
 */

return [
    [
        'order'       => 1,
        'slug'        => 'somnath',
        'name_hi'     => 'सोमनाथ',
        'name_en'     => 'Somnath',
        'place_hi'    => 'प्रभास पाटन, गुजरात',
        'place_en'    => 'Prabhas Patan, Gujarat',
        'youtube_id'  => '9qW0GDdqjTU',
        'channel'     => 'Somnath Temple - Official Channel',
        'verified_on' => '2026-10-21',
    ],
    [
        'order'       => 2,
        'slug'        => 'mallikarjuna',
        'name_hi'     => 'श्री मल्लिकार्जुन',
        'name_en'     => 'Mallikarjuna (Srisailam)',
        'place_hi'    => 'श्रीशैलम, आंध्र प्रदेश',
        'place_en'    => 'Srisailam, Andhra Pradesh',
        'youtube_id'  => null,
        'channel'     => '',
        'verified_on' => '',
    ],
    [
        'order'       => 3,
        'slug'        => 'mahakaleshwar',
        'name_hi'     => 'महाकालेश्वर',
        'name_en'     => 'Mahakaleshwar',
        'place_hi'    => 'उज्जैन, मध्य प्रदेश',
        'place_en'    => 'Ujjain, Madhya Pradesh',
        'youtube_id'  => 'pZik61fEsJc',
        'channel'     => 'divyadarshan',
        'verified_on' => '2026-10-21',
    ],
    [
        'order'       => 4,
        'slug'        => 'omkareshwar',
        'name_hi'     => 'ओंकारेश्वर',
        'name_en'     => 'Omkareshwar',
        'place_hi'    => 'खंडवा, मध्य प्रदेश',
        'place_en'    => 'Khandwa, Madhya Pradesh',
        'youtube_id'  => 'keJSAIK6QVc',
        'channel'     => 'Shri Omkareshwar Jyotirlinga Official',
        'verified_on' => '2026-10-21',
    ],
    [
        'order'       => 5,
        'slug'        => 'vaijnath',
        'name_hi'     => 'श्री वैजनाथ (परली)',
        'name_en'     => 'Vaijnath (Parli)',
        'place_hi'    => 'परली, महाराष्ट्र',
        'place_en'    => 'Parli, Maharashtra',
        'youtube_id'  => null,
        'channel'     => '',
        'verified_on' => '',
    ],
    [
        'order'       => 6,
        'slug'        => 'bhimashankar',
        'name_hi'     => 'भीमाशंकर',
        'name_en'     => 'Bhimashankar',
        'place_hi'    => 'पुणे, महाराष्ट्र',
        'place_en'    => 'Pune, Maharashtra',
        'youtube_id'  => null,
        'channel'     => '',
        'verified_on' => '',
    ],
    [
        'order'       => 7,
        'slug'        => 'rameshwaram',
        'name_hi'     => 'रामेश्वरम्',
        'name_en'     => 'Rameshwaram',
        'place_hi'    => 'रामेश्वरम, तमिलनाडु',
        'place_en'    => 'Rameswaram, Tamil Nadu',
        'youtube_id'  => null,
        'channel'     => '',
        'verified_on' => '',
    ],
    [
        'order'       => 8,
        'slug'        => 'grishneshwar',
        'name_hi'     => 'घृष्णेश्वर',
        'name_en'     => 'Grishneshwar',
        'place_hi'    => 'एलोरा, महाराष्ट्र',
        'place_en'    => 'Ellora, Maharashtra',
        'youtube_id'  => null,
        'channel'     => '',
        'verified_on' => '',
    ],
    [
        'order'       => 9,
        'slug'        => 'nageshwar',
        'name_hi'     => 'नागेश्वर',
        'name_en'     => 'Nageshwar',
        'place_hi'    => 'द्वारका, गुजरात',
        'place_en'    => 'Dwarka, Gujarat',
        'youtube_id'  => null,
        'channel'     => '',
        'verified_on' => '',
    ],
    [
        'order'       => 10,
        'slug'        => 'kashi-vishwanath',
        'name_hi'     => 'काशी विश्वनाथ',
        'name_en'     => 'Kashi Vishwanath',
        'place_hi'    => 'वाराणसी, उत्तर प्रदेश',
        'place_en'    => 'Varanasi, Uttar Pradesh',
        'youtube_id'  => 'WPZ0xL0-sKs',
        'channel'     => 'Live Darshan',
        'verified_on' => '2026-10-21',
    ],
    [
        'order'       => 11,
        'slug'        => 'trimbakeshwar',
        'name_hi'     => 'त्र्यंबकेश्वर',
        'name_en'     => 'Trimbakeshwar',
        'place_hi'    => 'नासिक, महाराष्ट्र',
        'place_en'    => 'Nashik, Maharashtra',
        'youtube_id'  => null,
        'channel'     => '',
        'verified_on' => '',
    ],
    [
        'order'       => 12,
        'slug'        => 'baidyanath',
        'name_hi'     => 'बैद्यनाथ धाम',
        'name_en'     => 'Baidyanath (Deoghar)',
        'place_hi'    => 'देवघर, झारखंड',
        'place_en'    => 'Deoghar, Jharkhand',
        'youtube_id'  => 'gXFBJQWcleg',
        'channel'     => 'KGS Astro',
        'verified_on' => '2026-10-21',
    ],
];
