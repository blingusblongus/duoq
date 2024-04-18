import type { APIContext } from "astro";

export async function POST(context: APIContext) {
    console.log("hitting set-summoner");
    const formData = await context.request.formData();
    const riotId = formData.get("riot-id");

    console.log(formData);

    console.log("riot-id", riotId);

    if (typeof riotId !== "string") {
        return new Response("Invalid summoner name", { status: 400 });
    }

    // Set the cookie with a response
    return new Response(null, {
        status: 303,
        headers: {
            "Set-Cookie": `summonerDetails=${encodeURIComponent(riotId)}; Path=/; HttpOnly`,
            Location: "/",
        },
    });
}
