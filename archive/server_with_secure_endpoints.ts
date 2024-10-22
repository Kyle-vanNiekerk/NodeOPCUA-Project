async function main(){
    const {OPCUAServer, OPCUACertificateManager, SecurityPolicy, MessageSecurityMode, extractFullyQualifiedDomainName, makeApplicationUrn} = await import("node-opcua");
    const path = await import("path");
    const fs = await import("fs");

    console.log("running");

        // Create PKI Root Folder
        const envPaths = await import("env-paths");
        const paths = envPaths.default("MyOPCUAServer");
    
        const configFolder = envPaths.default("NodeOPCUA-by-example").config;
        const rootFolder = path.join(configFolder, "PKI");
    
        // Create Certificate Manager
        const serverCertificateManager = new OPCUACertificateManager({
            automaticallyAcceptUnknownCertificate: true,
            rootFolder,
        });
    
        // Initialise the PKI
        await serverCertificateManager.initialize();
    
        console.log("Certificate rejected folder ", serverCertificateManager.rejectedFolder);
        console.log("Certificate trusted folder ", serverCertificateManager.trustedFolder);
        console.log("Server Private Key        ", serverCertificateManager.privateKey);
    
        // Once-off Creation of the Server Certificate
        const fqdn = process.env.HOSTNAME || (await extractFullyQualifiedDomainName());
        const applicationUri = makeApplicationUrn(fqdn, "MyOPCUAServerApplicationName");
    
        const certificateFile = path.join(rootFolder, "certificate.pem");
        console.log("Server certificate ", certificateFile);
    
        // Create Certificate:
        if (!fs.existsSync(certificateFile)) {
            await serverCertificateManager.createSelfSignedCertificate({
                applicationUri,
                dns: [fqdn],
                ip: await getIpAddresses(),
                outputFile: certificateFile,
                subject: "/CN=MyOPCUAServerApplicationName/O=Sterfive/L=Orleans/C=FR",
                startDate: new Date(),
                validity: 365 * 10, // 10 years
            });
        }

        try{
            const server = new OPCUAServer({
                port: 22701,
                serverCertificateManager,
                certificateFile,
    
                // make sure that we use our own application URI
                serverInfo: {
                    applicationUri,
                    // The globally unique identifier for the product.
                    productUri: "My-OPCUA-Server",
                    // A localized descriptive name for the application.
                    applicationName: { text: "My-OPCUA-Server", locale: null },
                }
            });
    
            await server.initialize();
            await server.start();

            console.log(".. server started ...");
            console.log("Server public key ", server.certificateFile);
            console.log("Server private key ", server.privateKeyFile);
    
            const endpointUrl = server.getEndpointUrl()!;
            console.log(" server is ready on ", endpointUrl);
            console.log("CTRL+C to stop");
    
        } catch (err) {
            console.log(err);
        }
    };

main();

// Function Definitions-------------------------------------------------------------------------------------------|

async function getIpAddresses() {
    const os = await import("os");
    const ipAddresses: string[] = [];
    const interfaces = os.networkInterfaces();
    Object.entries(interfaces).forEach(([interfaceName, iFaces]) => {
        let alias = 0;
        if (!iFaces) {
            return;
        }
        iFaces.forEach((iFace) => {
            if ("IPv4" !== iFace.family || iFace.internal !== false) {
                // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
                return;
            }
            if (alias >= 1) {
                // this single interface has multiple ipv4 addresses
                console.log(interfaceName + ":" + alias, iFace.address);
                ipAddresses.push(iFace.address);
            } else {
                // this interface has only one ipv4 address
                console.log(interfaceName, iFace.address);
                ipAddresses.push(iFace.address);
            }
            ++alias;
        });
    });
    return ipAddresses;
}
