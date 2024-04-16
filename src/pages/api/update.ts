import type { APIContext } from "astro";

export async function POST(context: APIContext): Promise<Response> {
    return context.redirect("/");
}
