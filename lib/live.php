<?php
declare(strict_types=1);

/**
 * Resolve the currently-live YouTube video ID for a given channel.
 * Returns the video id if the channel is live now, otherwise null.
 */
function resolve_live_id(string $channelId): ?string
{
    // Try curl first (handles redirects better)
    if (extension_loaded('curl')) {
        $url = "https://www.youtube.com/channel/$channelId/live";
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => false,
            CURLOPT_HEADER => true,
            CURLOPT_NOBODY => true,
            CURLOPT_USERAGENT => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            CURLOPT_TIMEOUT => 8,
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_SSL_VERIFYHOST => false,
        ]);
        $header = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode === 302 && $header !== false) {
            if (preg_match('/[?&]v=([A-Za-z0-9_-]{11})/', $header, $m)) {
                return $m[1];
            }
        }
    }

    // Fallback: try the /live page HTML for canonical link
    $url = "https://www.youtube.com/channel/$channelId/live";
    $ctx = stream_context_create([
        'http' => [
            'method' => 'GET',
            'header' => "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36\r\n",
            'timeout' => 8,
            'ignore_errors' => true,
        ],
        'ssl' => [
            'verify_peer' => false,
            'verify_peer_name' => false,
        ],
    ]);
    $html = @file_get_contents($url, false, $ctx);
    if ($html !== false) {
        // Look for the canonical URL which points to the live video
        if (preg_match('/<link rel="canonical" href="[^"]*[?&]v=([A-Za-z0-9_-]{11})"/', $html, $m)) {
            return $m[1];
        }
        // Also check for ytInitialData in the page
        if (preg_match('/"videoId":"([A-Za-z0-9_-]{11})"/', $html, $m)) {
            return $m[1];
        }
    }
    return null;
}

/**
 * Resolve with caching: TTL minutes (default 5) to avoid hammering YouTube.
 */
function resolve_live_id_cached(string $channelId, int $ttlMinutes = 5): ?string
{
    $cacheDir = __DIR__ . '/../data/live-cache';
    if (!is_dir($cacheDir)) {
        @mkdir($cacheDir, 0775, true);
    }
    $cacheFile = $cacheDir . '/' . $channelId . '.json';
    $now = time();

    // fresh cache?
    if (is_file($cacheFile)) {
        $data = json_decode(@file_get_contents($cacheFile), true);
        if (is_array($data) && isset($data['ts'], $data['id']) && ($now - (int)$data['ts'] < $ttlMinutes * 60)) {
            return $data['id'] ?: null;
        }
    }

    // fetch fresh
    $id = resolve_live_id($channelId);

    // write cache (even if null — short negative cache)
    @file_put_contents($cacheFile, json_encode(['ts' => $now, 'id' => $id]), LOCK_EX);
    return $id;
}