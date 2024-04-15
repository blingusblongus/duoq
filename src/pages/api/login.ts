import { lucia } from "@/auth";
import type { APIContext } from "astro";
import { User, db, eq } from "astro:db";

export async function POST(context: APIContext): Promise<Response> {
    const formData = await context.request.formData();

    const id = formData.get("id");

    if (typeof id !== "string") {
        return new Response("Invalid Summoner id", { status: 400 });
    }

    const existing = await db.select().from(User).where(eq(User.id, id)).get();
    console.log("existing", existing, "id:", id);

    if (!existing) {
        await db.insert(User).values({ id });
    }

    if (context.locals.session) {
        await lucia.invalidateSession(context.locals.session.id);
    }
    const session = await lucia.createSession(id, {});
    const sessionCookie = lucia.createSessionCookie(session.id);
    context.cookies.set(
        sessionCookie.name,
        sessionCookie.value,
        sessionCookie.attributes,
    );

    return context.redirect("/");
}
