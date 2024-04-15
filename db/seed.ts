import { db, Comment } from "astro:db";

// https://astro.build/db/seed
export default async function seed() {
    await db.insert(Comment).values([{ author: "Me", body: "my comment" }]);
}
