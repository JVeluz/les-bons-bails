import application from "./application";
import "./database";

if (process.env.JWT_SECRET === undefined) {
    console.error("❌ JWT_SECRET is not defined in environment variables");
    process.exit(1);
}

const port: number = 3000;

async function start() {
    application.listen(port, () => {
        console.log(`🚀 Server listening on port ${port}`);
    });
}

start();