import app from "../src/app";
import config from "../src/config";
import "../src/db";

const main = async () => {
    app.listen(config.port, () => {
        console.log(`server is running on port ${config.port}`);
    });
};

main();
export default app; // 
