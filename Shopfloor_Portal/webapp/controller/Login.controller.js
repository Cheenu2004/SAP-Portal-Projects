sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/Fragment"
], function (Controller, MessageBox, MessageToast, JSONModel, Fragment) {
    "use strict";

    return Controller.extend("shopfloor.portal.controller.Login", {
        onInit: function () {
            this.getOwnerComponent().getRouter().getRoute("login").attachPatternMatched(this._onRouteMatched, this);
        },

        _onRouteMatched: function () {
            var oView = this.getView();
            oView.byId("userIdInput").setValue("");
            oView.byId("passwordInput").setValue("");
            oView.byId("errorMessageStrip").setVisible(false);
            
            // Also reset password visibility to hidden
            var oInput = oView.byId("passwordInput");
            oInput.setType("Password");
            oInput.setValueHelpIconSrc("sap-icon://show");
        },

        onLogin: function () {
            var oView = this.getView();
            var sUserId = oView.byId("userIdInput").getValue();
            var sPassword = oView.byId("passwordInput").getValue();
            var oModel = this.getOwnerComponent().getModel();
            var oRouter = this.getOwnerComponent().getRouter();
            var oErrorStrip = oView.byId("errorMessageStrip");

            if (!sUserId || !sPassword) {
                MessageBox.error("Please enter both User ID and Password.");
                return;
            }

            sap.ui.core.BusyIndicator.show(0);
            oErrorStrip.setVisible(false);

            var oPayload = {
                "UserId": sUserId,
                "Password": sPassword
            };

            oModel.create("/ShopFloorLoginSet", oPayload, {
                success: function (oData) {
                    sap.ui.core.BusyIndicator.hide();
                    if (oData.Message === "Login Successful") {
                        // Store user info
                        var oUserModel = this.getOwnerComponent().getModel("userModel");
                        oUserModel.setData(oData);
                        localStorage.setItem("shopfloor_user", JSON.stringify(oData));
                        
                        MessageToast.show("Login Successful");

                        // Navigate to dashboard
                        oRouter.navTo("dashboard");
                    } else {
                        oErrorStrip.setText(oData.Message || "Login Failed");
                        oErrorStrip.setVisible(true);
                    }
                }.bind(this),
                error: function (oError) {
                    sap.ui.core.BusyIndicator.hide();
                    var sMsg = "Error connecting to service";
                    try {
                        var oResponse = JSON.parse(oError.responseText);
                        sMsg = oResponse.error.message.value;
                    } catch (e) {}
                    MessageBox.error(sMsg);
                }
            });
        },
        
        onTogglePassword: function() {
            var oInput = this.getView().byId("passwordInput");
            if (oInput.getType() === "Password") {
                oInput.setType("Text");
                oInput.setValueHelpIconSrc("sap-icon://hide");
            } else {
                oInput.setType("Password");
                oInput.setValueHelpIconSrc("sap-icon://show");
            }
        },

        onChangePasswordPress: function () {
            var oView = this.getView();
            
            if (!this._pChangePasswordDialog) {
                this._pChangePasswordDialog = Fragment.load({
                    id: oView.getId(),
                    name: "shopfloor.portal.view.ChangePasswordDialog",
                    controller: this
                }).then(function (oDialog) {
                    oView.addDependent(oDialog);
                    return oDialog;
                });
            }
            this._pChangePasswordDialog.then(function(oDialog) {
                // Clear fields
                oView.byId("cpUserIdInput").setValue("");
                oView.byId("cpCurrentPasswordInput").setValue("");
                oView.byId("cpNewPasswordInput").setValue("");
                oView.byId("cpMessageStrip").setVisible(false);
                
                oDialog.open();
            });
        },

        onChangePasswordSubmit: function () {
            var oView = this.getView();
            var sUserId = oView.byId("cpUserIdInput").getValue();
            var sCurrentPassword = oView.byId("cpCurrentPasswordInput").getValue();
            var sNewPassword = oView.byId("cpNewPasswordInput").getValue();
            var oMessageStrip = oView.byId("cpMessageStrip");

            if (!sUserId || !sCurrentPassword || !sNewPassword) {
                oMessageStrip.setText("Please enter User ID, Current Password, and New Password.");
                oMessageStrip.setVisible(true);
                return;
            }

            var oModel = this.getOwnerComponent().getModel();
            var oPayload = {
                "UserId": sUserId,
                "Password": sCurrentPassword,
                "NewPassword": sNewPassword,
                "Message": ""
            };

            sap.ui.core.BusyIndicator.show(0);
            oMessageStrip.setVisible(false);

            oModel.create("/ShopFloorLoginSet", oPayload, {
                success: function (oData) {
                    sap.ui.core.BusyIndicator.hide();
                    if (oData.Message === "Password Changed Successfully") {
                        MessageToast.show(oData.Message);
                        this.onChangePasswordCancel();
                    } else {
                        oMessageStrip.setText(oData.Message || "Password Change Failed");
                        oMessageStrip.setVisible(true);
                    }
                }.bind(this),
                error: function (oError) {
                    sap.ui.core.BusyIndicator.hide();
                    var sMsg = "Error connecting to service";
                    try {
                        var oResponse = JSON.parse(oError.responseText);
                        sMsg = oResponse.error.message.value;
                    } catch (e) {}
                    oMessageStrip.setText(sMsg);
                    oMessageStrip.setVisible(true);
                }
            });
        },

        onChangePasswordCancel: function () {
            if (this._pChangePasswordDialog) {
                this._pChangePasswordDialog.then(function(oDialog) {
                    oDialog.close();
                });
            }
        }
    });
});
