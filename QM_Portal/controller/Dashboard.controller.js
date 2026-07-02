sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageBox"
], function (Controller, MessageBox) {
    "use strict";

    return Controller.extend("qmportal1.controller.Dashboard", {

        onInit: function () {
            sap.ui.core.UIComponent.getRouterFor(this)
                .getRoute("Dashboard")
                .attachPatternMatched(this._onRouteMatched, this);
        },

        _onRouteMatched: function () {
            var oAppState = this.getOwnerComponent().getModel("appState");
            if (!oAppState) { return; }

            var sUser = oAppState.getProperty("/loggedInUser") || "";
            var sRole = oAppState.getProperty("/role")         || "";

            var oUserCtrl = this.byId("hdrUserId");
            var oRoleCtrl = this.byId("hdrUserRole");

            if (oUserCtrl) { oUserCtrl.setText(sUser); }
            if (oRoleCtrl) { oRoleCtrl.setText(sRole); }
        },

        onInspectionLotPress: function () {
            this.getOwnerComponent().getRouter().navTo("InspectionLot");
        },

        onResultRecordPress: function () {
            this.getOwnerComponent().getRouter().navTo("ResultRecord");
        },

        onUsageDecisionPress: function () {
            this.getOwnerComponent().getRouter().navTo("UsageDecision");
        },

        onLogout: function () {
            this.byId("logoutDialog").open();
        },

        onConfirmLogout: function () {
            this.byId("logoutDialog").close();

            // Clear the session state so credentials/role don't linger
            var oAppState = this.getOwnerComponent().getModel("appState");
            if (oAppState) {
                oAppState.setProperty("/loggedInUser", "");
                oAppState.setProperty("/role",         "");
            }

            // Also clear header controls immediately
            var oUserCtrl = this.byId("hdrUserId");
            var oRoleCtrl = this.byId("hdrUserRole");
            if (oUserCtrl) { oUserCtrl.setText(""); }
            if (oRoleCtrl) { oRoleCtrl.setText(""); }

            this.getOwnerComponent().getRouter().navTo("Login");
        },

        onCancelLogout: function () {
            this.byId("logoutDialog").close();
        },

        /* =========================================================== */
        /* FORMATTERS                                                   */
        /* =========================================================== */

        formatRoleBadgeState: function (sRole) {
            if (sRole === "SAFETY_MANAGER") { return "Success"; }
            if (sRole === "CONSULTANT")     { return "Warning"; }
            return "Information"; // ENGINEER or unknown
        }

    });
});