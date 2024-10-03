import { DataType } from "node-opcua";

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

    // get the addressSpace
    const addressSpace = server.engine.addressSpace!;
    // get own namespace
    const namespace = addressSpace.getOwnNamespace();
    // Adding a folder
    const myFolder = namespace.addFolder(addressSpace.rootFolder.objects, {
        browseName: "MyFolder",
    });
    // Add Objects
    const myObject = namespace.addObject({
        browseName: "MyObject",
        organizedBy: myFolder,
    });
    const myObject1 = namespace.addObject({
        browseName: "MyObject1",
        organizedBy: myFolder.nodeId,
    });
    const myObject2 = namespace.addObject({
        browseName: "MyObject2",
        organizedBy: "ns=0;i=84", // myFolder.nodeId.toString();
    });
    const myObject3 = namespace.addObject({
        nodeId: "s=my_object_id", // Specify NodeId
        browseName: "MyObject3",
        organizedBy: "ns=0;i=84", // myFolder.nodeId.toString();
    });
    // Adding a Variable
    const myVariable = namespace.addVariable({
        browseName: "myVariable1",
        dataType: DataType.Double,
        propertyOf: myObject,
    });
    const myVariable1 = namespace.addVariable({
        browseName: "myVariable2",
        dataType: DataType.Double,
        propertyOf: "ns=1,s=my_object_id",
    });

    console.log(myObject.toString());
    console.log(myObject1.toString());
    console.log(myObject2.toString());
    console.log(myObject3.toString());
    console.log(myFolder.toString());

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