sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageBox",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], function (Controller, MessageBox, Filter, FilterOperator) {
    "use strict";

    /**
     * Login.controller.js
     *
     * Models now come from manifest.json (preload:false).
     * loginModel exists immediately — just call oModel.read() directly.
     * No Component.initODataModels() needed.
     */
    return Controller.extend("qmportal1.controller.Login", {

        onInit: function () {
            sap.ui.core.UIComponent.getRouterFor(this)
                .getRoute("Login")
                .attachPatternMatched(this._onRouteMatched, this);
        },

        _onRouteMatched: function () {
            // Clear credentials and error strip every time the Login page is shown
            var oUserInput    = this.byId("userInput");
            var oPasswordInput = this.byId("passwordInput");
            var oErrorStrip   = this.byId("loginErrorStrip");

            if (oUserInput)    { oUserInput.setValue(""); }
            if (oPasswordInput) { oPasswordInput.setValue(""); }
            if (oErrorStrip)   { oErrorStrip.setVisible(false); }
        },

        onLogin: function () {
            var oErrorStrip = this.byId("loginErrorStrip");
            oErrorStrip.setVisible(false);

            var sUser = this.byId("userInput").getValue().trim();
            var sPass = this.byId("passwordInput").getValue().trim();

            if (!sUser || !sPass) {
                oErrorStrip.setText("Please enter both User ID and Password.");
                oErrorStrip.setVisible(true);
                return;
            }

            var oLoginModel = this.getOwnerComponent().getModel("loginModel");
            if (!oLoginModel) {
                oErrorStrip.setText("Login service is not available.");
                oErrorStrip.setVisible(true);
                return;
            }

            this.getView().setBusy(true);

            var aFilters = [
                new Filter("wf_user_id",  FilterOperator.EQ, sUser),
                new Filter("wf_password", FilterOperator.EQ, sPass)
            ];

            oLoginModel.read("/ZQM_LOGIND_902065", {
                filters: aFilters,

                success: function (oData) {
                    this.getView().setBusy(false);

                    if (oData.results && oData.results.length > 0) {
                        var oLoginRecord = oData.results[0];
                        var sLoggedInUser = oLoginRecord.wf_user_id || sUser;
                        var sRole         = (oLoginRecord.wf_role || "").trim().toUpperCase();

                        // Store user id and role globally in appState
                        var oAppState = this.getOwnerComponent().getModel("appState");
                        if (oAppState) {
                            oAppState.setProperty("/loggedInUser", sLoggedInUser);
                            oAppState.setProperty("/role",         sRole);
                        }
                        this.getOwnerComponent().getRouter().navTo("Dashboard");
                    } else {
                        oErrorStrip.setText("Invalid User ID or Password. Please try again.");
                        oErrorStrip.setVisible(true);
                    }
                }.bind(this),

                error: function (oError) {
                    this.getView().setBusy(false);
                    var sMsg = "Unable to connect to SAP Login Service.";
                    try {
                        if (oError.responseText) {
                            var oBody = JSON.parse(oError.responseText);
                            if (oBody.error && oBody.error.message && oBody.error.message.value) {
                                sMsg = oBody.error.message.value;
                            }
                        }
                    } catch (e) { /* use default */ }
                    oErrorStrip.setText(sMsg);
                    oErrorStrip.setVisible(true);
                }.bind(this)
            });
        },

        /* =========================================================== */
        /* FORGOT PASSWORD LOGIC                                        */
        /* =========================================================== */

        onForgotPasswordPress: function () {
            if (!this._oResetModel) {
                this._oResetModel = new sap.ui.model.json.JSONModel({
                    UserId: "",
                    Password: "",
                    ConfirmPassword: ""
                });
                this.getView().setModel(this._oResetModel, "resetModel");
            } else {
                this._oResetModel.setData({
                    UserId: "",
                    Password: "",
                    ConfirmPassword: ""
                });
            }
            this.byId("forgotPasswordDialog").open();
        },

        onResetPasswordCancel: function () {
            this.byId("forgotPasswordDialog").close();
        },

        onResetPasswordSubmit: function () {
            var oData = this._oResetModel.getData();
            var sUserId = (oData.UserId || "").trim();
            var sPassword = (oData.Password || "").trim();
            var sConfirm = (oData.ConfirmPassword || "").trim();

            if (!sUserId || !sPassword || !sConfirm) {
                MessageBox.error("All fields are mandatory.");
                return;
            }

            if (sPassword !== sConfirm) {
                MessageBox.error("New Password and Confirm Password do not match.");
                return;
            }

            if (sPassword.length > 20) {
                MessageBox.error("Password length must not exceed 20 characters.");
                return;
            }

            var oTransModel = this.getOwnerComponent().getModel("transactionModel");
            if (!oTransModel) {
                MessageBox.error("Transaction service is not available.");
                return;
            }

            var oPayload = {
                UserId: sUserId,
                Password: sPassword
            };

            this.getView().setBusy(true);

            oTransModel.create("/PasswordResetSet", oPayload, {
                success: function () {
                    this.getView().setBusy(false);
                    MessageBox.success("Password successfully updated.");
                    this.byId("forgotPasswordDialog").close();
                }.bind(this),
                error: function (oError) {
                    this.getView().setBusy(false);
                    var sMsg = "Failed to update password.";
                    try {
                        if (oError.responseText) {
                            var oBody = JSON.parse(oError.responseText);
                            if (oBody.error && oBody.error.message && oBody.error.message.value) {
                                sMsg = oBody.error.message.value;
                            }
                        }
                    } catch (e) { /* use default */ }
                    MessageBox.error(sMsg);
                }.bind(this)
            });
        }

    });
});