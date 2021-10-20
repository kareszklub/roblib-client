#!/bin/sh

## typescript compile
npx tsc -p .

## generate browser lib
# write a single line into it (keep source maps correct)
echo > out/lib_browser.js
# write lib.ts but without the first line
tail -n +2 out/lib.js >> out/lib_browser.js
