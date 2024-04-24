import { riotService } from "@/services/RiotService";
import type { APIContext } from "astro";
import { sql, db, Summoner_Match } from "astro:db";

export async function POST(context: APIContext) {
    const form = await context.request.formData();
    const summoner1 = form.get("summoner1");
    const summoner2 = form.get("summoner2");

    if (!summoner1)
        return new Response("No summoner provided", { status: 400 });

    if (typeof summoner1 !== "string") {
        return new Response("Input must be a string", { status: 400 });
    }

    // @ts-expect-error - still haven't resolved this locals typing
    const userPuuid = context.locals.user.puuid;

    try {
        const [gameName, tagline] = summoner1.split("#");
        const summoner1Puuid = (
            await riotService.getSummonerByRiotId(gameName, tagline)
        ).puuid;

        if (summoner2) {
            if (!summoner2)
                return new Response("No summoner provided", { status: 400 });

            if (typeof summoner2 !== "string") {
                return new Response("Input must be a string", { status: 400 });
            }
            const [gameName, tagline] = summoner2.split("#");
            const summoner2Puuid = (
                await riotService.getSummonerByRiotId(gameName, tagline)
            ).puuid;
            console.log(userPuuid, summoner1Puuid, summoner2Puuid);
            const sq = sql`SELECT
                s1.teamPosition AS teamPosition1,
                s2.teamPosition AS teamPosition2,
                s3.teamPosition AS teamPosition3,
                COUNT(*) AS games_played,
                COUNT(*) FILTER (WHERE s1.win = true) AS games_won,  -- Assuming all are on the same team, if s1 wins, all win
                COUNT(*) FILTER (WHERE s1.win = false) AS games_lost,
                COUNT(*) FILTER (WHERE s1.win = true) * 1.0 / COUNT(*) AS win_rate
                FROM ${Summoner_Match} s1
                JOIN ${Summoner_Match} s2 ON s1.matchId = s2.matchId AND s1.teamId = s2.teamId
                JOIN ${Summoner_Match} s3 ON s1.matchId = s3.matchId AND s1.teamId = s3.teamId
                WHERE s1.summonerId = ${userPuuid} AND s2.summonerId = ${summoner1Puuid} AND s3.summonerId = ${summoner2Puuid}
                GROUP BY teamPosition1, teamPosition2, teamPosition3
                ORDER BY win_rate DESC`;
            const res = await db.run(sq).then((res) => res.rows);
            return new Response(JSON.stringify(res));
        } else {
            const sq = sql`SELECT s1.teamPosition AS userPosition, s2.teamPosition AS friendPosition, 
                COUNT(*) AS games_played,
                COUNT(*) FILTER (WHERE s1.win = true) AS games_won,
                COUNT(*) FILTER (WHERE s1.win = false) AS games_lost,
                COUNT(*) FILTER (WHERE s1.win = true) * 1.0 / COUNT(*) AS win_rate
                FROM ${Summoner_Match} s1
                JOIN ${Summoner_Match} s2 ON s1.matchId = s2.matchId AND s1.teamId = s2.teamId
                WHERE s1.summonerId = ${userPuuid} AND s2.summonerId = ${summoner1Puuid}
                GROUP BY s1.teamPosition, s2.teamPosition
                ORDER BY win_rate DESC`;

            const res = await db.run(sq).then((res) => res.rows);
            return new Response(JSON.stringify(res));
        }
    } catch (err) {
        return new Response(JSON.stringify(err));
    }
}
