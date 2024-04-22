import { riotService, type Summoner } from "@/services/RiotService";
import type { APIContext } from "astro";
import {
    Match,
    Summoner as SummonerTable,
    Summoner_Match,
    db,
    inArray,
    sql,
} from "astro:db";

export async function POST(context: APIContext): Promise<Response> {
    // Fetch Latest games
    // @ts-expect-error - for some reason, even changing declarating file doesn't seem to be fixing locals typing
    if (!context.locals.user) {
        return new Response("No user session", { status: 401 });
    }
    // @ts-expect-error - for some reason, even changing declarating file doesn't seem to be fixing locals typing
    const { puuid } = context.locals.user as Summoner;

    const matches = await riotService.getMatchIds(puuid, 0, 10);

    if (!matches || matches.length === 0) {
        console.log("no matches. puuid:", puuid);
        return new Response("No matches found", { status: 201 });
    }

    // Compare against db
    const existing = await db
        .select()
        .from(Match)
        .where(inArray(Match.id, matches))
        .then((res) => res.map((record) => record.id));

    if (!existing) {
        return new Response("error retrieving matches", { status: 500 });
    }

    const notExisting = matches.filter((id) => !existing.includes(id));

    console.log(
        "These matches already exist",
        matches,
        "\nCount:",
        matches.length,
    );
    console.log(
        "These matches are new",
        notExisting,
        "\nCount:",
        notExisting.length,
    );

    // Add to Db if necessary
    if (notExisting.length > 0) {
        // Query Riot API and add them to the db
        const match_queries = [];
        const summoner_queries = [];
        const summoner_match_queries = [];

        for (let matchId of notExisting) {
            const {
                info: {
                    participants,
                    gameDuration,
                    gameMode,
                    gameType,
                    gameVersion,
                },
            } = await riotService.getMatchData(matchId);

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
            } of participants) {
                summoner_queries.push(
                    db
                        .insert(SummonerTable)
                        .values({
                            puuid,
                            game_name: riotIdGameName,
                            tag_line: riotIdTagline,
                            games_tracked: 1,
                            games_won: win ? 1 : 0,
                        })
                        .onConflictDoUpdate({
                            target: SummonerTable.puuid,
                            set: {
                                games_tracked: sql`${SummonerTable.games_tracked} + 1`,
                                games_won: sql`${SummonerTable.games_won} + ${win ? 1 : 0}`,
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
                    }),
                );
            }
        }

        try {
            // @ts-expect-error - this works despite type error
            await db.batch(match_queries);
            // @ts-expect-error - this works despite type error
            await db.batch(summoner_queries);
            // @ts-expect-error - this works despite type error
            await db.batch(summoner_match_queries);
        } catch (err) {
            console.error(err);
        }
    }

    // Reload page
    return context.redirect("/");
}
