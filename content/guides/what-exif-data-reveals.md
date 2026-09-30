---
title: What EXIF data reveals
seo_title: What EXIF data reveals
seo_description: What camera metadata can show, and how to remove it in your browser.
updated: 2026-09-24
status: live
---

## What can be in a photo

EXIF is metadata embedded in many JPEG and some other files. It can record camera make and model, lens, exposure time, ISO, the date and time the shutter fired, software used to edit the image, and sometimes a GPS fix. Thumbnails and color profiles may ride along in the same block. Viewers on your phone often show date and location because the file still carries those tags.

## Why it matters

Sharing the original export—not a re-save from a chat app—can leak more than the picture. A vacation photo might include coordinates near your home if location services were on. Journalists and activists sometimes strip metadata before publishing; families posting kids’ photos may want the same caution. Even without GPS, serial numbers and timestamps can tie images together across posts.

## How to remove it here

Use [strip image metadata](/strip-image-metadata). The page summarizes what it finds, describes GPS only as embedded location (never a street address), then re-encodes pixels so tags are gone. Processing happens in your browser; we do not store EXIF on a server because the file never uploads.

## What this site does not do

We do not keep a database of your photos or their metadata. Stripping does not guarantee anonymity in the image itself—visible license plates or faces remain—so treat metadata removal as one step in a broader sharing checklist. For smaller files after cleaning, try [compress image](/compress-image).
