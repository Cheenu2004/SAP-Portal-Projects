sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageBox"
], function (Controller, MessageBox) {
    "use strict";

    return Controller.extend("ehsmportal.controller.Dashboard", {

        onRiskPress: function () {
            this.getOwnerComponent()
                .getRouter()
                .navTo("risk");
        },

        onIncidentPress: function () {
            this.getOwnerComponent()
                .getRouter()
                .navTo("incident");
        },

        onLogout: function () {
            MessageBox.confirm(
                "Are you sure you want to logout?",
                {
                    title      : "Confirm Logout",
                    icon       : MessageBox.Icon.WARNING,
                    actions    : [MessageBox.Action.YES, MessageBox.Action.NO],
                    emphasizedAction: MessageBox.Action.NO,
                    onClose    : function (sAction) {
                        if (sAction === MessageBox.Action.YES) {
                            this.getOwnerComponent()
                                .getRouter()
                                .navTo("login");
                        }
                        // NO → dialog closes, user stays on dashboard
                    }.bind(this)
                }
            );
        }

    });
});