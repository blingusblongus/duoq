import { riotService } from "@/services/RiotService";
import type { APIContext } from "astro";
import { sql, db, Summoner_Match } from "astro:db";

const validateSummoner = async (fullName: FormDataEntryValue) => {
    if (!fullName) throw Error("Summoner name is null");

    if (typeof fullName !== "string") {
        throw Error("Summoner name must be string");
    }

    const [gameName, tagline] = fullName.split("#");
    const puuid = (await riotService.getSummonerByRiotId(gameName, tagline))
        .puuid;
    return puuid;
};
export async function POST(context: APIContext) {
    const form = await context.request.formData();
    const summoner1 = form.get("summoner1");
    const summoner2 = form.get("summoner2");
    const summoner3 = form.get("summoner3");
    const summoner4 = form.get("summoner4");

    // @ts-expect-error - puuid typing
    const puuids = [context.locals.user.puuid];

    for (let s of [summoner1, summoner2, summoner3, summoner4]) {
        if (!s) continue;
        try {
            puuids.push(await validateSummoner(s));
        } catch (e) {
            if (typeof e === "string") {
                return new Response(e);
            }
            return new Response(
                "Unknown error in duo endpoint:" + JSON.stringify(e),
            );
        }
    }

    let sq;
    switch (puuids.length) {
        case 2:
            sq = sql`SELECT s1.teamPosition AS teamPosition1, s2.teamPosition AS teamPosition2, 
                COUNT(*) AS games_played,
                COUNT(*) FILTER (WHERE s1.win = true) AS games_won,
                COUNT(*) FILTER (WHERE s1.win = false) AS games_lost,
                COUNT(*) FILTER (WHERE s1.win = true) * 1.0 / COUNT(*) AS win_rate
                FROM ${Summoner_Match} s1
                JOIN ${Summoner_Match} s2 ON s1.matchId = s2.matchId AND s1.teamId = s2.teamId
                WHERE s1.summonerId = ${puuids[0]} AND s2.summonerId = ${puuids[1]}
                GROUP BY s1.teamPosition, s2.teamPosition
                ORDER BY win_rate DESC`;
            break;
        case 3:
            sq = sql`SELECT
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
                WHERE 
                    s1.summonerId = ${puuids[0]} AND 
                    s2.summonerId = ${puuids[1]} AND 
                    s3.summonerId = ${puuids[2]}
                GROUP BY teamPosition1, teamPosition2, teamPosition3
                ORDER BY win_rate DESC`;
            break;
        case 4:
            sq = sql`SELECT
                s1.teamPosition AS teamPosition1,
                s2.teamPosition AS teamPosition2,
                s3.teamPosition AS teamPosition3,
                s4.teamPosition AS teamPosition4,
                COUNT(*) AS games_played,
                COUNT(*) FILTER (WHERE s1.win = true) AS games_won,  -- Assuming all are on the same team, if s1 wins, all win
                COUNT(*) FILTER (WHERE s1.win = false) AS games_lost,
                COUNT(*) FILTER (WHERE s1.win = true) * 1.0 / COUNT(*) AS win_rate
                FROM ${Summoner_Match} s1
                JOIN ${Summoner_Match} s2 ON s1.matchId = s2.matchId AND s1.teamId = s2.teamId
                JOIN ${Summoner_Match} s3 ON s1.matchId = s3.matchId AND s1.teamId = s3.teamId
                JOIN ${Summoner_Match} s4 ON s1.matchId = s4.matchId AND s1.teamId = s4.teamId
                WHERE 
                    s1.summonerId = ${puuids[0]} AND 
                    s2.summonerId = ${puuids[1]} AND 
                    s3.summonerId = ${puuids[2]} AND
                    s4.summonerId = ${puuids[3]}
                GROUP BY teamPosition1, teamPosition2, teamPosition3, teamPosition4
                ORDER BY win_rate DESC`;
            break;
        case 5:
            sq = sql`SELECT
                s1.teamPosition AS teamPosition1,
                s2.teamPosition AS teamPosition2,
                s3.teamPosition AS teamPosition3,
                s4.teamPosition AS teamPosition4,
                s5.teamPosition AS teamPosition5,
                COUNT(*) AS games_played,
                COUNT(*) FILTER (WHERE s1.win = true) AS games_won,  -- Assuming all are on the same team, if s1 wins, all win
                COUNT(*) FILTER (WHERE s1.win = false) AS games_lost,
                COUNT(*) FILTER (WHERE s1.win = true) * 1.0 / COUNT(*) AS win_rate
                FROM ${Summoner_Match} s1
                JOIN ${Summoner_Match} s2 ON s1.matchId = s2.matchId AND s1.teamId = s2.teamId
                JOIN ${Summoner_Match} s3 ON s1.matchId = s3.matchId AND s1.teamId = s3.teamId
                JOIN ${Summoner_Match} s4 ON s1.matchId = s4.matchId AND s1.teamId = s4.teamId
                JOIN ${Summoner_Match} s5 ON s1.matchId = s5.matchId AND s1.teamId = s5.teamId
                WHERE 
                    s1.summonerId = ${puuids[0]} AND 
                    s2.summonerId = ${puuids[1]} AND 
                    s3.summonerId = ${puuids[2]} AND
                    s4.summonerId = ${puuids[3]} AND
                    s5.summonerId = ${puuids[4]}
                GROUP BY teamPosition1, teamPosition2, teamPosition3, teamPosition4, teamPosition5
                ORDER BY win_rate DESC`;
            break;
        default:
            return new Response("Unhandled puuids.length: " + puuids.length);
    }
    console.time("lookup time");
    const res = await db.run(sq).then((res) => res.rows);
    console.timeEnd("lookup time");

    return new Response(JSON.stringify(res));
}
