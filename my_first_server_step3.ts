const { OPCUAServer, ServerState, DataType, UAObject, UAVariable, UAMethod, coerceLocalizedText } = require("node-opcua");
const chalk = require("chalk");

function add_some_server_veriables(server: typeof OPCUAServer){
    // get the addressSpace
    const addressSpace = server.engine.addressSpace!;
    // get own namespace
    const namespace = addressSpace.getOwnNamespace();
    // Adding a folder
    const myFolder = namespace.addFolder(addressSpace.rootFolder.objects, {
        browseName: "MyFolder",
    });
    // Add Object
    const myObject = namespace.addObject({
        nodeId: "s=my_object_id", // Specify NodeId
        browseName: "MyObject3",
        organizedBy: "ns=0;i=84", // myFolder.nodeId.toString();
    });
    // Adding a Variable
    const myVariable1 = namespace.addVariable({
        browseName: "myVariable",
        dataType: DataType.Double,
        propertyOf: myObject,
    });
    // Access object, properties and components
    const myObjectFound = addressSpace.findNode("ns=1;s=my_object_id");
    if(!myObjectFound)
    {
        throw new Error("Cannot find node ns=1;s=my_object_id");
    }
    // Access and modify variable
    const myVariableFound = myObjectFound.getPropertyByName("myVariable");
    if(!myVariableFound)
    {
        throw new Error("Cannot find variable with browseName myVariable");
    }
    myVariableFound.setValueFromSource({
        dataType: DataType.Double,
        value: 42,
    });
   
   const myObjectFound2 = addressSpace.findNode("ns=1;s=my_object_id");
   (myObjectFound2.myVariable /*as UAVariable*/).setValueFromSource({});
}

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
    
    await server.initialize();

    add_some_server_veriables(server);

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