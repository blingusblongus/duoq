# DuoQ

DuoQ is an application designed to give insight on LoL statistics that aren't provided by existing solutions like Porofessor, etc.

## Analysis Goals / Roadmap

-   [ ] Winrate with other player
-   [ ] Winrate with both players in specific positions
-   [ ] Best winrates for players in two positions, considering champion selection
-   [ ] Winrate with larger groups
-   [ ] Best positions for groups of three or more
-   [ ] Best positions/champions for groups of three or more

## Dev Setup

### Env vars

See `.env.example`

### Mocking Riot API

-   For development, it's recommended to mock the riotAPI to reduce actual calls. Currently, this is implemented only for the heaviest calls (populating the db), meaning you still need a valid api key. Example matches are stored in the gitignored `db/examples/matches` directory.
-   If you need to populate the `db/examples/matches` directory, the dev environment has a shortcut for population that can be accessed via GET at the route: `/api/dev-save-json`
