import { riotService, type Summoner } from "@/services/RiotService";
import type { APIContext } from "astro";
import { Match, db, eq, inArray, notExists, notInArray, sql } from "astro:db";

export async function POST(context: APIContext): Promise<Response> {
    // Fetch Latest games
    if (!context.locals.user) {
        return new Response("No user session", { status: 401 });
    }
    // @ts-expect-error - for some reason, even changing declarating file doesn't seem to be fixing locals typing
    const { puuid } = context.locals.user as Summoner;

    const matches = await riotService.getMatches(puuid);

    console.log(matches);
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

    const notExisting = matches.filter((id) => existing.includes(id));

    // Add to Db if necessary

    if (notExisting.length > 0) {
        // Query Riot API and add them to the db
    }

    // Reload page
    return context.redirect("/");
}
