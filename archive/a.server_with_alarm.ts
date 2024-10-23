/* BROKEN,
    12:04:43.052Z :address_space  :1094  modelChangeTransaction
    CRASHES THE SERVER
*/

(async function main(){
    const { 
        opcua, OPCUAServer, UAObject, OPCUACertificateManager, nodesets, standardUnits
    } = require("node-opcua");
    const callbackify = require("util");
    const chalk = require("chalk");

    try {
        const server = new OPCUAServer({
            nodeset_filename: [
                nodesets.standard,
                nodesets.di,
            ],
        });

        await server.initialize();
        const addressSpace = server.engine.addressSpace;
        const namespace = addressSpace.getOwnNamespace();

        // Install Alarms and Conditions Service
        addressSpace.installAlarmsAndConditionsService();

        // Create the Tank Object
        const nsDI = addressSpace.getNamespaceIndex("http://opcfoundation.org/UA/DI/");
        //console.log(addressSpace.rootFolder); // Debug log

        const deviceSet = addressSpace.rootFolder.objects.getFolderElementByName("DeviceSet", nsDI) as typeof UAObject;

        console.log(addressSpace.rootFolder.objects.getFolderElementByName("DeviceSet", nsDI))

        const tank = namespace.addObject({
            nodeId: "s=Tank",
            description: "The Object representing the Tank",
            eventNotifier: 1,
            notifierOf: addressSpace.rootFolder.objects.server,
            organizedBy: deviceSet
        });
        
        console.log("running");

        // Create the Tank Level Variable
        const tankLevel = namespace.addAnalogDataItem({
            browseName: "TankLevel",
            nodeId: "s=TankLevel",
            dataType: "Double",
            description: "Fill level in percentage (0% to 100%) of the water tank",
            eventSourceOf: tank,
            engineeringUnits: standardUnits.percent,
            engineeringUnitsRange: {low:0, high:100},
            componentOf: tank
        });

        // Create the Alarm
        const alarm = namespace.instantiateExclusiveLimitAlarm("ExclusiveLimitAlarmType", {
            browseName: "TankLevelCondition",
            componentOf: tank,
            conditionSource: tankLevel,
            highHighLimit: 95.0,
            highLimit: 80.0,
            inputNode: tankLevel,
            lowLimit: 10.0,
            lowLowLimit: 5.0,
            optionals: [
                "ConfirmedState", "Confirm" // confirm state and confirm Method
            ]
        });

        // Install a Simulation for the Tank Level
        let t = 0;
        const timerId = setInterval(() => {
            const value = 100 * Math.cos(t / 100);
            t += 0.25;
            tankLevel.setValueFromSource({
                dataType: "Double",
                value,
            });
        }, 100);

        addressSpace.registerShutdownTask(() => clearInterval(timerId));

        await server.start();
        const endpointUrl = server.getEndpointUrl();
        console.log("Server is ready on", endpointUrl);

        console.log("Press CTRL+C to stop");
        await new Promise((resolve) => process.once("SIGINT", resolve));
        await server.shutdown();

    } catch (err) {
        if (err instanceof Error) {
            console.log(err.message);
        } else {
            console.log('An unknown error occurred');
        }
    }

})();
