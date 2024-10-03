// import { OPCUAServer, ServerState, coerceLocalizedText } from "node-opcua";
// import chalk from "chalk";
// ^^^^ These imports given as examples in the documentation do not work
const { OPCUAServer, ServerState, coerceLocalizedText } = require("node-opcua");
const chalk = require("chalk");


(async () => {

try {
    // Server Code
    const server = new OPCUAServer({ 
        port: 26543,
        buildInfo: {
            manufacturerName: "MyCompany",
            productName: "myFirstOPCUAServer",
            softwareVersion: "1.0.0"
        },
     });

    await server.start();

    const endpointUrl = server.getEndpointUrl();
    console.log(" server is ready on ", endpointUrl);
    console.log("CTRL+C to stop");

    // Shutdown Management
    // Press Ctrl + C to stop: process.once("SIGINT",()=>{/* */}).
    process.once("SIGINT", () => {
        // Prevent re-entrance"
        console.log(" Received server interruption from user ");
        console.log(" shutting down ...");
        
        server.engine.serverStatus.shutdownReason = coerceLocalizedText("Shutdown by administrator");
        
        server.shutdown(10000, () => {
            console.log(" shutting down completed ");
            console.log(" done ");
            process.exit(0);
        });
    });

} catch(err) {
        console.log("error", err);
        process.exit(-1);
    }
})();
/*
const {OPCUAServer} = require("node-opcua");
(async () => {
    try {
        const server = new OPCUAServer({port: 26543});
        await server.start();
        const endpointUrl = server.getEndpointUrl();
        console.log(" server is ready and can be accessed with endpoint uri: ", endpointUrl);
        console.log("CTRL+C to stop");
    }
    catch(err) {
        console.log(err);
        process.exit(-1);
    }
})();
*/

