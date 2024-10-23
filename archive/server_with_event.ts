(async function main(){
    
    const {OPCUAServer} = await import("node-opcua");

    try{
        const server = new OPCUAServer({ 
            port: 26543,
        });

        await server.start();
        populateAddressSpace(server);

        console.log(" server is ready on ", server.getEndpointUrl());
        console.log("CTRL+C to stop");

    }catch(err){
        console.log("Error", err);
        process.exit(1);
    }
})();

const {OPCUAServer, IEventData} = require("node-opcua");
function populateAddressSpace(server: typeof OPCUAServer){
    
    const addressSpace = server.engine.addressSpace!;
    const namespace = addressSpace.getOwnNamespace();

    // Create Area1:
    const area1 = namespace.addObject({
        browseName: "Area1",
        organizedBy: addressSpace.rootFolder.objects,
        notifierOf: addressSpace.rootFolder.objects.server,
    });

    // Create Tank1 Inside Area1
    const tank1 = namespace.addObject({
        browseName: "Tank1",
        componentOf: area1,
        notifierOf: area1,
    });

    // Create PumpStartEventType
    const pumpStartEventType = namespace.addEventType({
        browseName: "PumpStartEventType",
    });

    // Create Pump
    const pump = namespace.addObject({
        browseName: "Pump",
        componentOf: tank1,
        eventSourceOf: tank1,
        eventNotifier: 1,
    });

    // Event Handler to See Bubbling-up in Action
    const serverObj = addressSpace.findNode("Server")!;
    serverObj.on("event", (e: typeof IEventData) => {
        console.log("server is raising an event");
    });
    pump.on("event", (e: typeof IEventData) => {
        console.log("pump is raising an event");
    });
    tank1.on("event", (e: typeof IEventData) => {
        console.log("tank1 is raising an event");
    });
        area1.on("event", (e: typeof IEventData) => {
            console.log("area1 is raising an event");
    });

    // Simulate a PumpStartEvent Being Raised on a Regular Basis
    setInterval(() => {
        const eventData = {};
        pump.raiseEvent(pumpStartEventType, eventData);
    }, 3000);
    // now with the event being raised in UAExpert
}

/*  THIS WAS NEVER USED
    // Create Security Manager and Certificate
    const configFolder = envPaths.default("NodeOPCUA-by-example").config;
    const rootFolder = path.join(configFolder, "PKI");

    const fqdn = process.env.HOSTNAME || (await extractFullyQualifiedDomainName());    
    const applicationUri = makeApplicationUrn(
        fqdn,
        "MyOPCUAServerApplicationName2"
    );
    const certificateFile = path.join(rootFolder, "certificate1.pem");
    console.log("Server certificate ", certificateFile);

    const serverCertificateManager = new OPCUACertificateManager({
        automaticallyAcceptUnknownCertificate: true,
        rootFolder,
    });

    await serverCertificateManager.initialize();

    if (!fs.existsSync(certificateFile)) {
        await serverCertificateManager.createSelfSignedCertificate({
            applicationUri,
            dns: [fqdn],
            outputFile: certificateFile,
            subject: "/CN=MyOPCUAServerApplicationName2/O=Sterfive/L=Orleans/C=FR",
            startDate: new Date(),
            validity: 365 * 10, // 10 years
        });
    }

    console.log("Certificate rejected folder    ", serverCertificateManager.rejectedFolder);
    console.log("Certificate trusted folder     ", serverCertificateManager.trustedFolder);
    console.log("Server Private Key             ", serverCertificateManager.privateKey);
    console.log("Server cerficate               ", certificateFile);

    // Create PumpStartEventType
    const pumpStartEventType = namespace.addEventType({

    })*/
