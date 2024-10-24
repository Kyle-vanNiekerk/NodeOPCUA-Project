(async function main() {
    const { OPCUAClient, /*UserIdentityInfoUserName,*/ UserTokenType } = await import("node-opcua");

    try {
        const client = OPCUAClient.create({
            endpointMustExist: false
        });

        const endpoint = "opc.tcp://MYHOSTNAME:20500";
        await client.connect(endpoint);

        const session = await client.createSession({
            userName: "user1",
            password: "password1",
            type: UserTokenType.UserName,
        } /*as typeof UserIdentityInfoUserName)*/);
        await session.close();

        console.log("Connection succeeded");
        await client.disconnect();

    } catch (err) {
        console.log("Error", err);
    }
})();