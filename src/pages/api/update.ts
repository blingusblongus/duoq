import type { APIContext } from "astro";
import { Match, db, eq, inArray, notExists, notInArray, sql } from "astro:db";

export async function POST(context: APIContext): Promise<Response> {
    // Fetch Latest games
    if (!context.locals.user) {
        return new Response("No user session", { status: 401 });
    }
    const { id } = context.locals.user;

    const matches = (await fetch(
        `https://americas.api.riotgames.com/lol/match/v5/matches/by-puuid/${id}/ids?start=0&count=20`,
        {
            headers: {
                "X-Riot-Token": import.meta.env.RIOT_API_KEY,
            },
        },
    )
        .then((res) => res.json())
        .catch((err) => console.log(err))) as string[];

    if (!matches || matches.length === 0) {
        console.log("no matches. id:", id);
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
