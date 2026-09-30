<?php

use App\Http\Controllers\CatalogController;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\GuideController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\PageController;
use App\Http\Controllers\RobotsController;
use App\Http\Controllers\SitemapController;
use Illuminate\Support\Facades\Route;

Route::get('/', HomeController::class)->name('home');

Route::get('/guides/{slug}', GuideController::class)
    ->where('slug', '[a-z0-9-]+')
    ->name('guides.show');

Route::get('/about', PageController::class)->defaults('page', 'about')->name('about');
Route::get('/contact', [ContactController::class, 'show'])->name('contact');
Route::post('/contact', [ContactController::class, 'store'])->name('contact.store');
Route::get('/privacy', PageController::class)->defaults('page', 'privacy')->name('privacy');
Route::get('/cookies', PageController::class)->defaults('page', 'cookies')->name('cookies');
Route::get('/terms', PageController::class)->defaults('page', 'terms')->name('terms');
Route::get('/editorial-policy', PageController::class)->defaults('page', 'editorial-policy')->name('editorial');

Route::get('/sitemap.xml', SitemapController::class)->name('sitemap');
Route::get('/robots.txt', RobotsController::class)->name('robots');

Route::get('/{slug}', CatalogController::class)
    ->where('slug', '[a-z0-9-]+')
    ->name('catalog.show');
