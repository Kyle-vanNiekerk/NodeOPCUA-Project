(async function main() {
    const { OPCUAServer, makeAccessRestrictionsFlag, DataType, AttributeIds, WellKnownRoles, PermissionType, allPermissions, makeRoles, NodeId } = await import("node-opcua");

    try {
        const userManager = {
            isValidUser: (userName: string, password: string): boolean => {
                if (userName === "user1" && password === "password1") {
                    return true;
                }
                if (userName === "user2" && password === "password2") {
                    return true;
                }
                return false;
            },

            // see OPCUA 1.04 part 3 4.8.2 Well know role
            // see OPCUA 1.04 part 3 4.8.2 Well know role
            // Anonymous The Role has very limited access for use when
            // a Session has anonymous credentials.
            // AuthenticatedUser The Role has limited access for use when a Session
            // has valid non-anonymous credentials
            // but has not been explicitly granted access to a Role.
            // Observer The Role is allowed to browse, read live data, read
            // historical data/events or subscribe to data/events.
            // Operator The Role is allowed to browse, read live data, read
            // historical data/events or subscribe to data/events.
            // In addition, the Session is allowed to write some live
            // data and call some Methods.
            // Engineer The Role is allowed to browse, read/write configuration
            // data, read historical data/events call Methods or
            // subscribe to data/events.
            // Supervisor The Role is allowed to browse, read live data, read
            // historical data/events, call Methods or subscribe
            // to data/events.
            // ConfigureAdmin The Role is allowed to change the non-security related
            // configuration settings.
            // SecurityAdmin The Role is allowed to change security related settings.

            getUserRoles: (username: string) => {
                if (username === "user1") {
                    return makeRoles("AuthenticatedUser;Observer;Operator");
                }
                if (username === "user2") {
                    return makeRoles("AuthenticatedUser;Supervisor;SecurityAdmin");
                }
                return makeRoles("Anonymous");
            }
        };

        const server = new OPCUAServer({
            port: 20500,
            // ...
            userManager,
            // ...
            allowAnonymous: false
        });
        await server.initialize();

        const addressSpace = server.engine.addressSpace!;
        const namespace = addressSpace.getOwnNamespace();

        const o = namespace.addObject({
            browseName: "MyObject",
            organizedBy: addressSpace.rootFolder.objects
        });

        const v = namespace.addVariable({
            nodeId: "s=VariableWithRestriction",
            browseName: "VariableWithPermissions",
            description: "Only Admin Can Write, Read only to authenticated user, require Encryption",
            dataType: "Double",
            value: { dataType: DataType.Double, value: 0},

            accessRestrictions: makeAccessRestrictionsFlag("None"),
            rolePermissions: [
                {
                    roleId: WellKnownRoles.ConfigureAdmin,
                    permissions: allPermissions,
                },
                {
                    roleId: WellKnownRoles.Anonymous,
                    permissions: PermissionType.None,
                },
                {
                    roleId: WellKnownRoles.AuthenticatedUser,
                    permissions: PermissionType.ReadRolePermissions,
                },
            ]
        })

        await server.start();
        console.log("Server started");

    } catch (err) {
        console.log("Error", err);
    }
})();