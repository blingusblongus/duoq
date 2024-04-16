import { lucia } from "@/auth";
import type { APIContext } from "astro";
import { Match, db, eq, inArray, notExists, notInArray, sql } from "astro:db";

export async function POST(context: APIContext): Promise<Response> {
    // Fetch Latest games
    // RD33J--av8BMTN1OXIoRu3lGoQlHw1kYwv2GY5g6r43sEiWHg-TLoKgWoMZWNc8-e5wa7upon9klha

    // const puuid = context.cookies.get(lucia.sessionCookieName)?.value ?? null;
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

    console.log(existing);
    const notExisting = matches.filter((id) => existing.includes(id));

    console.log("notExisting", notExisting);

    // Add to Db if necessary

    // Reload page
    return context.redirect("/");
}
