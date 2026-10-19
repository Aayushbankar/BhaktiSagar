<?php
declare(strict_types=1);

/*
 * Bhakti Sagar - configuration
 * Works out of the box with XAMPP (root / empty password).
 * Override with environment variables when needed:
 *   BHAKTI_DB_HOST, BHAKTI_DB_PORT, BHAKTI_DB_NAME, BHAKTI_DB_USER, BHAKTI_DB_PASS
 */

return [
    'db' => [
        'host' => getenv('BHAKTI_DB_HOST') ?: '127.0.0.1',
        'port' => (int) (getenv('BHAKTI_DB_PORT') ?: 3306),
        'name' => getenv('BHAKTI_DB_NAME') ?: 'bhakti_sagar',
        'user' => getenv('BHAKTI_DB_USER') ?: 'root',
        'pass' => getenv('BHAKTI_DB_PASS') !== false ? getenv('BHAKTI_DB_PASS') : '',
        'charset' => 'utf8mb4',
    ],
    'timezone' => 'Asia/Kolkata',
    // Public origin used for canonical URLs, Open Graph and the sitemap.
    // Leave empty to derive it from the request (works on localhost).
    // Example: 'https://bhaktisagar.example'
    'site_url' => getenv('BHAKTI_SITE_URL') ?: '',
    'app_name' => 'भक्ति सागर',
    'app_name_en' => 'Bhakti Sagar',
];
