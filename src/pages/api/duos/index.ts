import { riotService } from "@/services/RiotService";
import type { APIContext } from "astro";
import { sql, db, Summoner_Match } from "astro:db";

export async function POST(context: APIContext) {
    const form = await context.request.formData();
    const otherSumm = form.get("other-summoner");

    if (!otherSumm)
        return new Response("No summoner provided", { status: 400 });

    if (typeof otherSumm !== "string") {
        return new Response("Input must be a string", { status: 400 });
    }

    // @ts-expect-error - still haven't resolved this locals typing
    const userPuuid = context.locals.user.puuid;

    try {
        const [gameName, tagline] = otherSumm.split("#");
        const otherPuuid = (
            await riotService.getSummonerByRiotId(gameName, tagline)
        ).puuid;

        const sq = sql`SELECT s1.teamPosition AS userPosition, s2.teamPosition AS friendPosition, 
                COUNT(*) AS games_played,
                COUNT(*) FILTER (WHERE s1.win = true) * 1.0 / COUNT(*) AS win_rate
                FROM ${Summoner_Match} s1
                JOIN ${Summoner_Match} s2 ON s1.matchId = s2.matchId AND s1.teamId = s2.teamId
                WHERE s1.summonerId = ${userPuuid} AND s2.summonerId = ${otherPuuid}
                GROUP BY s1.teamPosition, s2.teamPosition
                ORDER BY win_rate DESC`;

        const res = await db.run(sq).then((res) => res.rows);

        return new Response(JSON.stringify(res));
    } catch (err) {
        return new Response(JSON.stringify(err));
    }
}
