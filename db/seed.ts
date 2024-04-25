import { Match, db, Summoner, Summoner_Match, sql } from "astro:db";
import fs from "fs";
import path from "path";
import type { FullMatch } from "./examples/Match";

// https://astro.build/db/seed
export default async function seed() {
    try {
        const directory = "db/examples/matches";
        const files = fs.readdirSync(directory);
        const match_queries = [];
        const summoner_queries = [];
        const summoner_match_queries = [];

        for (let file of files) {
            const fullPath = path.join(directory, file);
            const stats = fs.statSync(fullPath);

            if (stats.isFile()) {
                const content = fs.readFileSync(fullPath, "utf8");
                const match: FullMatch = JSON.parse(content);

                const {
                    metadata: { participants: participant_ids, matchId },
                    info: {
                        participants,
                        gameDuration,
                        gameMode,
                        gameType,
                        gameVersion,
                    },
                } = match;

                match_queries.push(
                    db.insert(Match).values({
                        id: matchId,
                        gameDuration,
                        gameMode,
                        gameType,
                        gameVersion,
                    }),
                );
                for (let {
                    win,
                    puuid,
                    championName,
                    kills,
                    deaths,
                    assists,
                    individualPosition,
                    teamPosition,
                    riotIdGameName,
                    totalHeal: healing,
                    riotIdTagline,
                    totalDamageDealtToChampions: damage,
                    teamId,
                } of participants) {
                    summoner_queries.push(
                        db
                            .insert(Summoner)
                            .values({
                                puuid,
                                game_name: riotIdGameName,
                                tag_line: riotIdTagline,
                                games_tracked: 1,
                                games_won: win ? 1 : 0,
                            })
                            .onConflictDoUpdate({
                                target: Summoner.puuid,
                                set: {
                                    games_tracked: sql`${Summoner.games_tracked} + 1`,
                                    games_won: sql`${Summoner.games_won} + ${win ? 1 : 0}`,
                                },
                            }),
                    );
                    summoner_match_queries.push(
                        db.insert(Summoner_Match).values({
                            matchId,
                            win,
                            summonerId: puuid,
                            championName,
                            kills,
                            deaths,
                            assists,
                            healing,
                            damage,
                            individualPosition,
                            teamPosition,
                            teamId,
                        }),
                    );
                }
            }
        }

        // @ts-expect-error - not sure how to make these types agree
        await db.batch([
            ...match_queries,
            ...summoner_queries,
            ...summoner_match_queries,
        ]);
    } catch (err) {
        console.error(err);
    }
}
