import { log } from "console";
import app from "./src/app";
import { config } from "./src/config/config";


const startServer = () =>{
    const port = config.port || 3000;
    app.listen(port,()=>{
        log(`Listening on port ${port}`);
    });
};

startServer();