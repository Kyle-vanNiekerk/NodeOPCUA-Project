// Undefined address space?
const {OPCUAServer, DataType, VariantArrayType, UAVariable, UAMethod, UAObject} = require("node-opcua");

function add_variables(server: typeof OPCUAServer){

    const addressSpace = server.engine.addressSpace!;
    const namespace = addressSpace.getOwnNamespace();
    const myFolder = namespace.addFolder(addressSpace.rootFolder.objects, {
        browseName: "MyFolder",
    });

    const myObject = namespace.addObject({
        browseName: "MyObject",
        organizedBy: myFolder,
    });

    // Adding a Matrix Variable
    const myVariable = namespace.addVariable({
        browseName: "MyVariable",
        dataType: DataType.Double,
        arrayDimensions: [2, 3, 5],
        valueRank: 3, // 3 dimensions
        componentOf: myObject,
    });

    // Initialise Matrix Variable
    myVariable.setValueFromSource({
        dataType: DataType.Double,
        arrayType: VariantArrayType.Matrix,
        dimensions: [2, 3, 5],
        value: new Float64Array([
            111, 112, 113, 114, 115,
            121, 122, 123, 124, 125,
            131, 132, 133, 134, 135,

            211, 212, 213, 214, 215,
            221, 222, 223, 224, 225,
            231, 232, 233, 234, 235
        ]),
    });

}

async function main(){
    console.log("running")
    try{
        const server = new OPCUAServer({
            port: 26543,
            buildInfo: {
                manufacturerName: "MyCompany",
                productName: "MyFirstOPCUAServer",
                softwareVersion: "1.0.0"
            },
        });

        await server.initialize();
        add_variables(server);

        await server.start();
        const endpointUrl = server.getEndpointUrl()!;

        console.log(" server is ready on ", endpointUrl);
        console.log("CTRL+C to stop");

    } catch (err) {
        console.log("error", err);
        process.exit(-1);
    }
}

main();