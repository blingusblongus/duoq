import { riotService, type Summoner } from "@/services/RiotService";
import type { APIContext } from "astro";
import {
    Tracked_Duo,
    Summoner as Summoner_Table,
    db,
    eq,
    and,
    inArray,
    Summoner_Match,
    count,
} from "astro:db";

export async function POST(context: APIContext) {
    console.log("hitting set-summoner");
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

        const [s1, s2] = [
            // @ts-expect-error - context.locals.user type error
            context.locals.user.puuid as string,
            summonerDetails.puuid,
        ].sort();

        console.log(s1, s2);

        const existing = await db
            .select()
            .from(Tracked_Duo)
            // .leftJoin(
            //     Summoner_Table,
            //     eq(Tracked_Duo.summoner1, Summoner_Table.puuid),
            // )
            // .leftJoin(
            //     Summoner_Table,
            //     eq(Tracked_Duo.summoner2, Summoner_Table.puuid),
            // )
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

        // This should be a subquery, probably
        const sharedMatches =
            (
                await db
                    .selectDistinct({
                        matchId: Summoner_Match.matchId,
                    })
                    .from(Summoner_Match)
                    .where(and(inArray(Summoner_Match.summonerId, [s1, s2])))
            ).length || 0;
        const sharedWins =
            (
                await db
                    .selectDistinct({
                        matchId: Summoner_Match.matchId,
                    })
                    .from(Summoner_Match)
                    .where(
                        and(
                            inArray(Summoner_Match.summonerId, [s1, s2]),
                            eq(Summoner_Match.win, true),
                        ),
                    )
            ).length || 0;

        console.log(sharedWins, sharedMatches);

        const res = await db
            .insert(Tracked_Duo)
            .values({
                summoner1: s1,
                summoner2: s2,
                total_matches: sharedMatches,
                won_matches: sharedWins,
            })
            .returning();
        console.log("Tracking added", res);
        return context.redirect("/");
    } catch (err) {
        console.error(err);
    }

    return context.redirect("/");
}
