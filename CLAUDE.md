# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

A static, dependency-free travel map site (`index.html`, `script.js`, `CNAME`) served by GitHub Pages at `maps.iltc.app`. There is no build step, package manager, test suite, or linter — pushing to `master` deploys.

## Running locally

Open `index.html` directly, or serve it (the Google Charts loader works over `file://`, but a server matches production):

```bash
python3 -m http.server 8000
```

## Architecture

All rendering goes through Google Charts `geochart`, loaded from `gstatic.com` with an API key hardcoded at the top of `script.js`. jQuery (CDN) is used only for `.empty()` and `.css('width')`. `drawMaps()` is the `setOnLoadCallback` and calls `drawWorld()` / `drawCN()` / `drawUS()`, each of which empties its `<div class="map">` and redraws from an inline data array.

Adding or updating a visit means editing only those data literals in `script.js` — there is no external data file.

### Two data-table shapes

The world and China maps use a 2-column table `['State', {type:'string', role:'tooltip'}]`. Only listed regions appear colored; anything absent is unstyled. The tooltip value doubles as the visit date and accepts free text (`'When I was young'`, `'Hometown'`).

The US map is different by design (commit `9d50341`): it enumerates `allStates`, then builds a 3-column table `[state, 0|1, tooltip]` so unvisited states render explicitly in grey via `colors: ['#F5F5F5', '#267114']` with `legend: 'none'`. Keep both shapes as-is when editing; converting one to the other changes the visual output.

### Region identifiers

Region names must match Google GeoChart's identifiers exactly, not colloquial names — e.g. `'Heilongjiang Sheng'`, `'Beijing Shi'`, `'HK'`, `'Macao SAR'`. A wrong name silently drops the region from the map. The China and US maps pass `{region: "CN"|"US", resolution: "provinces"}`.

### Cross-map navigation and resize

Clicking China or United States on the world map sets `window.location.hash` to `'cn'` / `'us'`, jumping to the matching `<section id>` in `index.html`. Adding a drill-down map requires a new section id, a new draw function, and a branch in the world map's `select` listener.

`window.onresize` redraws all three maps, but only when `#world-map`'s computed width actually changed — GeoChart does not reflow on its own, and the width guard prevents redraw storms. Map widths are set by the CSS breakpoints in `index.html` (1250px / 1050px / 750px / 480px).

## Conventions

Commits follow `feat:` / `fix:` / `chore:` prefixes.
