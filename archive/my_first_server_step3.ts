const { 
    OPCUAServer, ServerState, DataType, DataValue, UAObject, UAVariable, UAMethod, Variant, StatusCodes, timestamp, coerceLocalizedText,
    StatusCode, BindVariableOptionsVariation2, CallbackT, StatusCodeCallback, ErrorCallback, SessionContext
} = require("node-opcua");
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
    const MyObject = namespace.addObject({
        nodeId: "s=my_object_id", // Specify NodeId
        browseName: "MyObject",
        organizedBy: "ns=0;i=84", // myFolder.nodeId.toString();
    });
    // Adding a Variable
    const myVariable1 = namespace.addVariable({
        browseName: "myVariable",
        dataType: DataType.Double,
        propertyOf: MyObject,
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
   (myObjectFound2.myVariable).setValueFromSource({});

    // Binding variables with external values
    async function bind_variables(){
    await (async function technique1() {
        /* THIS DOES NOT WORK
            //technique 1 - straight value
            const myVariable1 = namespace.addVariable({
                browseName: "MyVariable1",
                dataType: DataType.Double,
                propertyOf: MyObject,
                value: {
                    DataType: DataType.Double,
                    value: 36.0,
                }
            });

            console.log(myVariable1.readValue().toString());
            (myVariable1 as any)._dataValue.value.value = 60.0; //  <------- THE ISSUE LIES HERE, DOCUMENTATION IS INCORRECT, dataValue is never declared
            
            // the `touchValue` method ensures that value timestamp is updated and
            // change notifications are propagated to monitored items
            myVariable1.touchValue();

            console.log(myVariable1.readValue().toString());
            */
        })();
        await (async function technique2() {
            //technique 2 - using a getter
            function doSomethingToExtractTheValue(): number {
                //.... to do
                return 3.14;
            } 
            const myVariable2 = namespace.addVariable({
            browseName: "MyVariable2",
            dataType: DataType.Double,
            propertyOf: MyObject,
            value: {
                get: function (this) {
                // do something here to extract the value (from the sensor for instance )
                const value2 = doSomethingToExtractTheValue();
                
                return new Variant({
                    dataType: DataType.Double,
                    value: value2,
                
                });
                },
            },
        });
        console.log("BOUND METHOD 2");
        })();
        await (async function technique3() {
        //technique 3 - using a getter and a setter
            let value3 = 30;
            const myVariable3 = namespace.addVariable({
                browseName: "MyVariable3",
                dataType: DataType.Double,
                propertyOf: MyObject,
                value: {
                    get: function (this) {
                        return new Variant({
                        dataType: DataType.Double,
                        value: value3,
                        });
                    },
            set: function (this, value: any) {
                value3 = value.value;
                return StatusCodes.Good;
            },
        },
        });
        console.log("BOUND METHOD 3");

        })();
        await (async function technique4() {
            //technique 4 - using a timestamped getter
            // variation2 async
            let dataValue4 = new DataValue({
                value: new Variant({
                    dataType: DataType.Double,
                    value: 40,
                }),
            });
            
            const myVariable4 = namespace.addVariable({
                browseName: "MyVariable4",
                dataType: DataType.Double,
                propertyOf: MyObject,
                value: {
                timestamped_get: function (this){
                        dataValue4.sourceTimestamp = new Date();
                        dataValue4.value.value += 1;
                        return dataValue4;
                    },
                },
            });
            console.log("BOUND METHOD 4")
        })();
        await (async function technique5() {
            //technique 5 - using an asynchronous timestamped getter
            let dataValue5 = new DataValue({
                value: new Variant({
                    dataType: DataType.Double,
                    value: 50,
                }),
            });

            const myVariable5 = namespace.addVariable({
                browseName: "MyVariable5",
                dataType: DataType.Double,
                propertyOf: MyObject,
                value: {
                    timestamp_get: function(
                        this,
                        callback: (err: Error | null, dataValue5: any) => void
                    ): void {
                        dataValue5.sourceTimestamp =  new Date();
                        dataValue5.value.value +=1;
                        callback(null, dataValue5);
                    }
                },
            });
            console.log("BOUND METHOD 5");
        })();
        await (async function technique6() {
            //technique 6 - using an asynchronous timestamped getter and setter
            /*
            const dataValue6 = new DataValue({
                value: new Variant({
                dataType: DataType. Double,
                value: 3.15,
                
                }),
                
                });
                
                function someLongOperation(callback: any) {
                // simulate a long operation by delaying when the callback method
                // is called.
                setTimeout(callback, 100);
                
                const option6: BindVariableOptionsVariation2 = {
                    timestamped_get(callback: CallbackT<DataValue> ) {
                        someLongOperation(() => {
                        console.log("reading: done!");
                        callback(null, dataValue6); 
                }
                
                timestamped_set(dataValue: DataValue, callback: StatusCodeCallback): void {
                    someLongOperation(() => {
                        dataValue6.value = dataValue. value;
                        dataValue6.sourceTimestamp = dataValue.sourceTimestamp;
                        dataValue6.sourcePicoseconds = dataValue.sourcePicoseconds;
                        console.log("writing: done!");
                        callback(null, StatusCodes.Good);
 
                    });
                
                },
                
            };
                
            const variable6 = namespace. addVariable( {
                browseName: "MyVariable6",
                description: "with an asynchronous setter and getter using callback functions",
                dataType: "Double",
                propertyOf: myObject,
                value: option6,
            });

            // Retreive data from server
            console.log("DataValue 6 before =", dataValue6.toString());
            const dataValueToWrite = new DataValue({
                value: { dataType: DataType.Double, value: 12345 },
            });
            await variable6.writeValue(null, dataValueToWrite);

            // Invoke async reading
            const dataValueVerif = await variable6.readValueAsync(SessionContext.defaultContext);
            console.log("DataValue 6 after =", dataValueVerif.toString());
            */
        })();
        await (async function technique7() {
            //technique 7 - using an asynchronous timestamped getter and setter (with async/await)
            const dataValue7 = new DataValue({
                value: new Variant({
                    dataType: DataType.Double,
                    value: 3.15,
                }),
            });
            
            async function simulateLongAsyncOperation(durationInMillisecond: number) {
                await new Promise((resolve) => setTimeout(resolve, durationInMillisecond));
                }
                /** the async/await getter function returning a promise */
                async function myAsyncGetFunc(): Promise<any> {
                    await simulateLongAsyncOperation(100);
                    console.log("Reading variable 7 done");
                    return dataValue7;
                }
                /** the async/await setter function returning a promise */
                async function myAsyncSetFunc(dataValue: any): Promise<any> {
                    dataValue7.value = dataValue.value;
                    dataValue7.sourceTimestamp = dataValue.sourceTimestamp;
                    dataValue7.sourcePicoseconds = dataValue.sourcePicoseconds;
                    await simulateLongAsyncOperation(100);
                    console.log("writing variable 7 done");
                    return StatusCodes.Good;
                }

        /** the adapter function for the getter */
            function getterWithCallback(
                callback: (err: Error | null, dataValue?: any) => void
            ): void {
                myAsyncGetFunc()
                    .then((dataValue: any) => callback(null, dataValue))
                    .catch((err: Error) => callback(err));
            }
         /** the adapter function for the setter */

        function setterWithCallback(
            dataValue: any,
            callback: (err: Error | null, statusCode?: any) => void
        ): void {
            myAsyncSetFunc(dataValue)
                .then((statusCode) => callback(null, statusCode))
                .catch((err: Error) => callback(err));
        }

        const option7 = {
            timestamped_get: getterWithCallback,
            timestamped_set: setterWithCallback,
        };

        const variable7 = namespace.addVariable({
            browseName: "MyVariable7",
            description: "with an asynchronous setter and getter using async/await and promise",
            dataType: "Double",
            propertyOf: MyObject,
            value: option7,
        });

        // Write Value from Server app
        console.log("DataValue7 Before = ", dataValue7.toString());
        const dataValueToWrite = new DataValue({
            value: {dataType: DataType.Double, value: 12345},
        });
        await variable7.writeValue( SessionContext.defaultContext, dataValueToWrite);

        // Invoke async
        const dataValueVerif = await variable7.readValueAsync(SessionContext.defaultContext);
        console.log("DataValue 7 after =", dataValueVerif.toString());

        })();
    }   

    bind_variables();
}

// Main
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