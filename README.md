# Belladonna OS


## Ready-to-use release files

The repository root contains:

- `Belladonna-OS.json` — import directly into Torn PDA
- `Belladonna-OS.user.js` — combined userscript

The same files are also generated in `dist/` whenever `npm run build` is run.


Belladonna OS is a standalone Torn PDA intelligence and operations suite.

Members install one file:

- `dist/Belladonna-OS.json` through Torn PDA's **Import from JSON**
- or `dist/Belladonna-OS.user.js` as a userscript

The project does not require the Discord bot, a Belladonna server, or a website.

## Source layout

```text
config/
  app-config.js       App and optional integration settings
  faction-data.js     Manually maintained faction roster and active hours

src/
  00-runtime.js       Shared helpers, storage, API helper, launcher, and panels
  10-dashboard.js     Home dashboard
  20-settings.js      Profile, API health, theme, and local backup
  30-travel.js        Voyage Profit Nerd
  40-chain.js         Chain Command
  50-academy.js       Today's Lesson / Academy
  60-coverage.js      Faction coverage map
  70-recon.js         Recon Scanner
  80-oracle.js        Belladonna Oracle
  90-about-main.js    About screen and startup
  integrations/
    yata.js           Optional YATA adapter

scripts/
  build.js            Combines the modules into one userscript and PDA JSON

dist/
  Belladonna-OS.user.js
  Belladonna-OS.json
```

## Build

Install Node.js 18 or newer, then run:

```bash
npm run build
npm run check
```

No npm packages are required.

## Editing faction information

Open `config/faction-data.js`.

Each member has:

- Torn name and optional ID
- UTC/Torn-Time offset
- one or more local active-hour windows
- roles
- notes

The build converts that file into the Coverage module's editable roster.

## API keys

The user's Torn API key is entered inside Belladonna OS and stored locally by Torn PDA on that device.

Do not commit real Torn or YATA keys to GitHub.

## YATA

YATA support is isolated in `src/integrations/yata.js`.

Belladonna OS does not depend on YATA. The adapter is disabled by default because the current live spy endpoint and authentication contract should be confirmed directly with YATA before hard-coding them.

Once confirmed:

1. Set `enabled`, `baseUrl`, and the authentication approach.
2. Implement `getYataSpyReport(playerId)`.
3. Recon can call that function without changes elsewhere.

## Release rule

GitHub contains many readable source files. Players still receive one JSON.
