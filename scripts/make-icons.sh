#!/usr/bin/env bash
# Renders assets/*.svg into the Android and iOS icon and splash sets (needs rsvg-convert).
set -euo pipefail
cd "$(dirname "$0")/.."
A=assets; R=android/app/src/main/res
for d in mdpi:48:108 hdpi:72:162 xhdpi:96:216 xxhdpi:144:324 xxxhdpi:192:432; do
  IFS=: read -r n s f <<<"$d"
  rsvg-convert -w $s -h $s $A/icon.svg -o $R/mipmap-$n/ic_launcher.png
  rsvg-convert -w $s -h $s $A/icon.svg -o $R/mipmap-$n/ic_launcher_round.png
  rsvg-convert -w $f -h $f $A/icon-fg.svg -o $R/mipmap-$n/ic_launcher_foreground.png
done
for d in mdpi:320:480 hdpi:480:800 xhdpi:720:1280 xxhdpi:960:1600 xxxhdpi:1280:1920; do
  IFS=: read -r n w h <<<"$d"
  for o in port land; do
    [ $o = land ] && { t=$w; w=$h; h=$t; }
    s=$(( w > h ? w : h ))
    rsvg-convert -w $s -h $s $A/splash.svg | convert - -gravity center -crop ${w}x${h}+0+0 +repage $R/drawable-$o-$n/splash.png
    [ $o = land ] && { t=$w; w=$h; h=$t; }
  done
done
rsvg-convert -w 1024 -h 1024 $A/splash.svg -o $R/drawable/splash.png
printf '<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#060D26</color>\n</resources>\n' > $R/values/ic_launcher_background.xml
I=ios/App/App/Assets.xcassets
rsvg-convert -w 1024 -h 1024 $A/icon.svg | convert - -background "#060d26" -alpha remove -alpha off $I/AppIcon.appiconset/AppIcon-512@2x.png
for f in splash-2732x2732.png splash-2732x2732-1.png splash-2732x2732-2.png; do rsvg-convert -w 2732 -h 2732 $A/splash.svg -o $I/Splash.imageset/$f; done
rsvg-convert -w 512 -h 512 $A/icon.svg -o web/public/icon-512.png
echo "icons and splash screens written"
