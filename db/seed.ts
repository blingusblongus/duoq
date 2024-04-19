import { db, Comment, Match } from "astro:db";

// https://astro.build/db/seed
export default async function seed() {
    await db.insert(Comment).values([{ author: "Me", body: "my comment" }]);

    // const matches = [
    //     "NA1_4975131718",
    //     "NA1_4975121191",
    //     "NA1_4975108600",
    //     "NA1_4975089025",
    //     "NA1_4975053730",
    //     "NA1_4975021981",
    //     "NA1_4974975564",
    //     "NA1_4974956150",
    //     "NA1_4974926803",
    //     "NA1_4974857659",
    // ];
    //
    // const matchValues = matches.map((id) => ({
    //     id,
    // }));
    //
    // await db.insert(Match).values(matchValues);
}
