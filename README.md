# ruforge-guides

Community resources shown on game pages in [RuForge](https://ruforge.app). One JSON file per game in `games/`.

## Submitting

Most submissions come from the app: open a game, Guides tab, add a link. That opens a pull request here for review.

Manual pull requests are welcome too:

1. Edit or add `games/<slug>.json`. The format is in `schema/game.schema.json`; `games/minecraft.json` is a working example.
2. Adding a new game? Run `node scripts/build-index.mjs` to update `index.json`.
3. Run `npm ci && npm run validate && npm run index:check` before opening the PR. CI runs the same checks.

## Format

```json
{
  "slug": "minecraft",
  "name": "Minecraft",
  "steamAppId": 123,
  "msStoreId": "9NBLGGH2JHXJ",
  "sections": [
    {
      "title": "Wikis",
      "resources": [
        {
          "url": "https://minecraft.wiki/",
          "name": "Minecraft Wiki",
          "line": "One line on what it is.",
          "open": "glance",
          "credit": "optional, who suggested it"
        }
      ]
    }
  ]
}
```

- `slug`: lowercase letters, digits and single hyphens. Matches the file name.
- `steamAppId` / `msStoreId`: optional, used by the app to match your installed game.
- Sections are free-form. Reuse an existing title when one fits.
- `open`: `glance` opens inside RuForge in a preview card; `browser` opens your default browser. Use `browser` for sites that need a login or break when embedded.
- `https` only. One entry per URL per game.

## What gets accepted

Useful, free to use, and about that game: wikis, maps, calculators, trackers, mod hosts, guides. No piracy, cheats for online play, referral links or paywalled content.
