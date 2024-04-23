import { riotService } from "@/services/RiotService";
import type { APIContext } from "astro";
import {
    Tracked_Duo,
    Summoner as Summoner_Table,
    db,
    eq,
    and,
    sql,
} from "astro:db";

export async function POST(context: APIContext) {
    const formData = await context.request.formData();
    const riotId = formData.get("riot-id") || "";

    if (typeof riotId !== "string") {
        return new Response("Invalid summoner name", { status: 400 });
    }
    const [gameName, tagLine] = riotId.split("#");
    if (!gameName || !tagLine) {
        return new Response("Invalid summoner name", { status: 400 });
    }

    // Get Summoner Info
    try {
        const summonerDetails = await riotService.getSummonerByRiotId(
            gameName,
            tagLine,
        );

        const { puuid } = summonerDetails;
        await db
            .insert(Summoner_Table)
            .values({
                puuid,
                game_name: gameName,
                tag_line: tagLine,
                games_tracked: 0,
                games_won: 0,
            })
            .onConflictDoNothing();

        // Sort summoners so they can be used to look up by idx
        const [s1, s2] = [
            // @ts-expect-error - context.locals.user type error
            context.locals.user.puuid as string,
            summonerDetails.puuid,
        ].sort();

        const existing = await db
            .select()
            .from(Tracked_Duo)
            .where(
                and(
                    eq(Tracked_Duo.summoner1, s1),
                    eq(Tracked_Duo.summoner2, s2),
                ),
            )
            .get();

        if (existing) {
            console.log("existing Tracked_Duo found:", existing);
            return context.redirect("/");
        }

        // If no existing tracked_duo record, aggregate one
        const sq2 = sql`SELECT 
        COUNT(DISTINCT a.matchId) AS total_matches,
        SUM(CASE WHEN a.win = true THEN 1 ELSE 0 END) AS won_matches
        FROM 
            Summoner_Match a
        JOIN 
            Summoner_Match b ON a.matchId = b.matchId
        WHERE 
            a.summonerId = ${s1} AND b.summonerId = ${s2}`;

        const shared_matches = (await db.run(sq2).then((res) => res.rows)) as {
            total_matches: number;
            won_matches: number;
        }[];

        const { total_matches, won_matches } = shared_matches[0];

        const res = await db
            .insert(Tracked_Duo)
            .values({
                summoner1: s1,
                summoner2: s2,
                total_matches: total_matches || 0,
                won_matches: won_matches || 0,
            })
            .returning();

        console.log("Tracking added", res);
        return context.redirect("/");
    } catch (err) {
        console.error(err);
    }

    return context.redirect("/");
}
