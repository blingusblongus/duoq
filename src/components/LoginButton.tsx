import { lucia } from "@/auth";
import { Button } from "./ui/button";

export const LoginButton = () => {
    const login = async () => {
        const session = await lucia.createSession("testId", {});
        await lucia.validateSession(session.id);
    };
    return <Button onClick={login}>Login</Button>;
};
