import { defineDb, defineTable, column } from "astro:db";

const Summoner = defineTable({
    columns: {
        puuid: column.text({
            primaryKey: true,
        }),
        game_name: column.text(),
        tag_line: column.text(),
        games_tracked: column.number({ default: 1 }),
        games_won: column.number({ default: 0 }),
    },
});

const Match = defineTable({
    columns: {
        id: column.text({
            primaryKey: true,
        }),
        gameDuration: column.number(),
        gameMode: column.text(),
        gameType: column.text(),
        gameVersion: column.text(),
    },
});

const Summoner_Match = defineTable({
    columns: {
        id: column.number({ primaryKey: true }),
        summonerId: column.text({
            references: () => Summoner.columns.puuid,
        }),
        matchId: column.text({
            references: () => Match.columns.id,
        }),
        win: column.boolean(),
        championName: column.text(),
        kills: column.number(),
        deaths: column.number(),
        assists: column.number(),
        healing: column.number(),
        damage: column.number(),
        individualPosition: column.text(),
        teamPosition: column.text(),
    },
    indexes: [{ on: ["summonerId", "matchId"] }],
});

const Tracked_Duo = defineTable({
    columns: {
        id: column.number({ primaryKey: true }),
        summoner1: column.text({}),
        summoner2: column.text({}),
        showSum1: column.boolean({ default: false }),
        showSum2: column.boolean({ default: false }),
        total_matches: column.number({
            default: 0,
        }),
        won_matches: column.number({
            default: 0,
        }),
    },
    indexes: [{ on: ["summoner1", "summoner2"] }],
});

export default defineDb({
    tables: { Summoner, Match, Summoner_Match, Tracked_Duo },
});
