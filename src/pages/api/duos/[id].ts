import type { APIContext, APIRoute } from "astro";
import { Tracked_Duo_Visibility, db, eq, and } from "astro:db";

export const DELETE: APIRoute = async ({ params, locals, redirect }) => {
    const { id } = params;
    // @ts-expect-error - still haven't resolved this locals typing
    const userPuuid = locals.user.puuid;

    console.log("DELETE ID", id);

    if (!id) return new Response("Bad data provide", { status: 400 });
    const parsedId = parseInt(id);

    if (typeof parsedId !== "number" || typeof userPuuid !== "string") {
        return new Response("Bad data provided", { status: 400 });
    }

    try {
        const result = await db
            .delete(Tracked_Duo_Visibility)
            .where(
                and(
                    eq(Tracked_Duo_Visibility.id, parsedId),
                    eq(Tracked_Duo_Visibility.visibleTo, userPuuid),
                ),
            );

        console.log(result);
    } catch (err) {
        return new Response("Request Couldn't be processed", { status: 500 });
    }

    console.log("redirecting");
    return redirect("/");
};
