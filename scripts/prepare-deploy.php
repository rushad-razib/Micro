<?php

/**
 * Build a cPanel-friendly tree under ./deploy.
 * Run after composer install --no-dev and npm run build.
 */
$root = dirname(__DIR__);
$deploy = $root.DIRECTORY_SEPARATOR.'deploy';

$copy = [
    'app',
    'bootstrap',
    'config',
    'content',
    'public',
    'resources/views',
    'routes',
    'vendor',
    'artisan',
    'composer.json',
    'composer.lock',
];

$removeFromBootstrapCache = [
    'packages.php',
    'services.php',
    'config.php',
    'routes-v7.php',
    'routes.php',
];

function rmrf(string $path): void
{
    if (! file_exists($path)) {
        return;
    }

    if (is_file($path) || is_link($path)) {
        unlink($path);

        return;
    }

    $items = scandir($path);
    if ($items === false) {
        return;
    }

    foreach ($items as $item) {
        if ($item === '.' || $item === '..') {
            continue;
        }
        rmrf($path.DIRECTORY_SEPARATOR.$item);
    }

    rmdir($path);
}

function copyPath(string $src, string $dest): void
{
    if (is_file($src)) {
        $dir = dirname($dest);
        if (! is_dir($dir)) {
            mkdir($dir, 0755, true);
        }
        copy($src, $dest);

        return;
    }

    if (! is_dir($dest)) {
        mkdir($dest, 0755, true);
    }

    $items = scandir($src);
    if ($items === false) {
        return;
    }

    foreach ($items as $item) {
        if ($item === '.' || $item === '..') {
            continue;
        }
        copyPath($src.DIRECTORY_SEPARATOR.$item, $dest.DIRECTORY_SEPARATOR.$item);
    }
}

if (! is_file($root.DIRECTORY_SEPARATOR.'public'.DIRECTORY_SEPARATOR.'build'.DIRECTORY_SEPARATOR.'manifest.json')) {
    fwrite(STDERR, "Missing public/build. Run npm run build first.\n");
    exit(1);
}

if (! is_file($root.DIRECTORY_SEPARATOR.'vendor'.DIRECTORY_SEPARATOR.'autoload.php')) {
    fwrite(STDERR, "Missing vendor. Run composer install --no-dev first.\n");
    exit(1);
}

rmrf($deploy);
mkdir($deploy, 0755, true);

foreach ($copy as $relative) {
    $src = $root.DIRECTORY_SEPARATOR.str_replace('/', DIRECTORY_SEPARATOR, $relative);
    if (! file_exists($src)) {
        fwrite(STDERR, "Missing {$relative}\n");
        exit(1);
    }
    copyPath($src, $deploy.DIRECTORY_SEPARATOR.str_replace('/', DIRECTORY_SEPARATOR, $relative));
}

foreach ($removeFromBootstrapCache as $file) {
    $path = $deploy.DIRECTORY_SEPARATOR.'bootstrap'.DIRECTORY_SEPARATOR.'cache'.DIRECTORY_SEPARATOR.$file;
    if (is_file($path)) {
        unlink($path);
    }
}

$envPath = $deploy.DIRECTORY_SEPARATOR.'.env';
if (is_file($envPath)) {
    unlink($envPath);
}

echo "Deploy tree ready at {$deploy}\n";
