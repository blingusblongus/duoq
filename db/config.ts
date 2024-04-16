import { defineDb, defineTable, column } from "astro:db";

const Comment = defineTable({
    columns: {
        author: column.text(),
        body: column.text(),
    },
});

const User = defineTable({
    columns: {
        id: column.text({
            primaryKey: true,
        }),
        puuid: column.text({
            unique: true,
        }),
        game_name: column.text(),
        tag_line: column.text(),
    },
});

const Summoner = defineTable({
    columns: {
        puuid: column.text({
            primaryKey: true,
        }),
        game_name: column.text(),
        tag_line: column.text(),
    },
});

const Match = defineTable({
    columns: {
        id: column.text({
            primaryKey: true,
        }),
    },
});

const Session = defineTable({
    columns: {
        id: column.text({
            primaryKey: true,
        }),
        expiresAt: column.date(),
        userId: column.text({
            references: () => User.columns.id,
        }),
    },
});

export default defineDb({
    tables: { Comment, User, Session, Summoner, Match },
});
