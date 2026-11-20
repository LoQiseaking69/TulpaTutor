#!/usr/bin/env bash
# Builds every icon, splash and in-app image from assets/brand/ (the TulpaTutor logo and
# mascot poses). Needs ImageMagick. Replaces scripts/make-icons.sh output.
set -euo pipefail
cd "$(dirname "$0")/.."
export MAGICK_DEPTH=8
B=assets/brand; R=android/app/src/main/res; I=ios/App/App/Assets.xcassets; P=web/public/brand
BG="#0b0a22"
mkdir -p $P
# head crop (icon/avatar): top of the logo, bottom edge faded into the background
convert $B/tulpatutor-logo.jpg -crop 430x415+485+0 +repage -gravity north -background "$BG" -extent 430x430 \
  \( -size 430x340 xc:white -size 430x90 gradient:white-black -append \) -alpha off -compose CopyOpacity -composite /tmp/tt-head-a.png
convert -size 430x430 xc:"$BG" /tmp/tt-head-a.png -compose over -composite $B/head.png
HEAD1024="convert $B/head.png -filter Lanczos -resize 1024x1024 -unsharp 0x1"
$HEAD1024 /tmp/tt-icon-1024.png
# adaptive-icon foreground: head inside the 66% safe zone on the background colour
convert -size 1024x1024 xc:"$BG" \( /tmp/tt-icon-1024.png -resize 700x700 \) -gravity center -composite /tmp/tt-fg-1024.png
for d in mdpi:48:108 hdpi:72:162 xhdpi:96:216 xxhdpi:144:324 xxxhdpi:192:432; do
  IFS=: read -r n s f <<<"$d"
  convert /tmp/tt-icon-1024.png -resize ${s}x${s} $R/mipmap-$n/ic_launcher.png
  convert /tmp/tt-icon-1024.png -resize ${s}x${s} \( -size ${s}x${s} xc:black -fill white -draw "circle $((s/2)),$((s/2)) $((s/2)),1" \) -alpha off -compose CopyOpacity -composite $R/mipmap-$n/ic_launcher_round.png
  convert /tmp/tt-fg-1024.png -resize ${f}x${f} $R/mipmap-$n/ic_launcher_foreground.png
done
printf '<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">%s</color>\n</resources>\n' "$BG" > $R/values/ic_launcher_background.xml
# splash: full logo, edges feathered into a solid background
convert $B/tulpatutor-logo.jpg \( -size 1408x768 radial-gradient:white-black -level 0%,55% \) -alpha off -compose CopyOpacity -composite /tmp/tt-logo-soft.png
splash() { convert -size ${1}x${2} xc:"$BG" \( /tmp/tt-logo-soft.png -resize $(( ($1 < $2 ? $1 : $2) * 125 / 100 ))x \) -gravity center -composite "$3"; }
for d in mdpi:320:480 hdpi:480:800 xhdpi:720:1280 xxhdpi:960:1600 xxxhdpi:1280:1920; do
  IFS=: read -r n w h <<<"$d"
  splash $w $h $R/drawable-port-$n/splash.png
  splash $h $w $R/drawable-land-$n/splash.png
done
splash 1024 1024 $R/drawable/splash.png
convert /tmp/tt-icon-1024.png -background "$BG" -alpha remove -alpha off $I/AppIcon.appiconset/AppIcon-512@2x.png
for f in splash-2732x2732.png splash-2732x2732-1.png splash-2732x2732-2.png; do splash 2732 2732 $I/Splash.imageset/$f; done
# web
convert /tmp/tt-icon-1024.png -resize 512x512 web/public/icon-512.png
convert /tmp/tt-icon-1024.png -resize 192x192 web/public/icon-192.png
convert /tmp/tt-icon-1024.png -resize 180x180 web/public/apple-touch-icon.png
convert /tmp/tt-icon-1024.png -resize 64x64 web/public/favicon.png
convert /tmp/tt-logo-soft.png -resize 900x -quality 86 $P/logo.webp
convert $B/head.png -resize 256x256 -quality 88 $P/head.webp
for m in celebrate think oops wave; do convert $B/mascot-$m.jpg -quality 90 $P/mascot-$m.webp; done
# startup animation: the wings-spread logo, edges feathered into black (web/src/ui/intro.js)
convert $B/tulpatutor-startup.jpg -crop 688x500+0+520 +repage \
  \( -size 688x500 xc:black -fill white -draw "roundrectangle 24,18 664,482 90,90" -blur 0x22 \) -alpha off -compose Multiply -composite \
  -quality 90 $P/startup.webp
# native launch screens are plain black so they hand off seamlessly to the startup animation
for f in $R/drawable*/splash.png $I/Splash.imageset/*.png; do convert "$f" -fill black -colorize 100 "$f"; done
# 8-bit, opaque where possible, max compression (ImageMagick otherwise writes 16-bit RGBA)
for f in $R/mipmap-*/ic_launcher.png $R/mipmap-*/ic_launcher_foreground.png $R/drawable*/splash.png $I/AppIcon.appiconset/*.png $I/Splash.imageset/*.png web/public/icon-*.png web/public/apple-touch-icon.png web/public/favicon.png; do
  convert "$f" -background "$BG" -alpha remove -alpha off -depth 8 -strip -define png:compression-level=9 "PNG24:$f"
done
for f in $R/mipmap-*/ic_launcher_round.png; do convert "$f" -depth 8 -strip -define png:compression-level=9 "PNG32:$f"; done
echo "brand assets written"
