sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], function (Controller, JSONModel, MessageToast, MessageBox) {
    "use strict";

    return Controller.extend("ehsmportal.controller.Login", {

        onInit: function () {
            // Controls which form panel is visible: "login" or "reset"
            this._oViewModel = new JSONModel({
                mode : "login",
                busy : false
            });
            this.getView().setModel(this._oViewModel, "viewModel");

            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("login").attachPatternMatched(this._onRouteMatched, this);
        },

        _onRouteMatched: function () {
            this.byId("empId").setValue("");
            this.byId("password").setValue("");
            this._oViewModel.setProperty("/mode", "login");
        },

        // ── LOGIN ────────────────────────────────────────────────────
        onLogin: function () {
            var sEmpId    = this.byId("empId").getValue().trim();
            var sPassword = this.byId("password").getValue().trim();

            if (!sEmpId || !sPassword) {
                MessageToast.show("Please enter Employee ID and Password.");
                return;
            }

            this._oViewModel.setProperty("/busy", true);

            this.getView().getModel().create("/LoginSet", {
                EmpId    : sEmpId,
                Password : sPassword,
                Action   : "",
                Role     : "",
                Status   : "",
                Message  : ""
            }, {
                success: function (oData) {
                    this._oViewModel.setProperty("/busy", false);
                    if (oData.Status === "S") {
                        MessageToast.show(oData.Message);
                        this.getOwnerComponent().getRouter().navTo("dashboard");
                    } else {
                        MessageBox.error(oData.Message || "Invalid credentials.");
                    }
                }.bind(this),
                error: function () {
                    this._oViewModel.setProperty("/busy", false);
                    MessageBox.error("Login failed. Please try again.");
                }.bind(this)
            });
        },

        // ── SWITCH TO RESET FORM ─────────────────────────────────────
        onForgotPassword: function () {
            // Clear reset fields before showing form
            this.byId("resetEmpId").setValue("");
            this.byId("newPassword").setValue("");
            this.byId("confirmPassword").setValue("");
            this._oViewModel.setProperty("/mode", "reset");
        },

        // ── SWITCH BACK TO LOGIN FORM ────────────────────────────────
        onBackToLogin: function () {
            this._oViewModel.setProperty("/mode", "login");
        },

        // ── RESET PASSWORD ───────────────────────────────────────────
        onResetPassword: function () {
            var sEmpId           = this.byId("resetEmpId").getValue().trim();
            var sNewPassword     = this.byId("newPassword").getValue().trim();
            var sConfirmPassword = this.byId("confirmPassword").getValue().trim();

            // ── Validation ──
            if (!sEmpId) {
                MessageToast.show("Please enter your Employee ID.");
                return;
            }
            if (!sNewPassword) {
                MessageToast.show("Please enter a new password.");
                return;
            }
            if (sNewPassword !== sConfirmPassword) {
                MessageBox.error("Passwords do not match. Please try again.");
                return;
            }

            this._oViewModel.setProperty("/busy", true);

            // POST with Action = "RESET" to trigger backend reset logic
            this.getView().getModel().create("/LoginSet", {
                EmpId    : sEmpId,
                Password : sNewPassword,
                Action   : "RESET",
                Role     : "",
                Status   : "",
                Message  : ""
            }, {
                success: function (oData) {
                    this._oViewModel.setProperty("/busy", false);
                    if (oData.Status === "S") {
                        // On success — show message then return to login
                        // pre-fill Employee ID so user only needs to type new password
                        MessageBox.success(
                            oData.Message || "Password reset successful!",
                            {
                                onClose: function () {
                                    this.byId("empId").setValue(sEmpId);
                                    this.byId("password").setValue("");
                                    this._oViewModel.setProperty("/mode", "login");
                                }.bind(this)
                            }
                        );
                    } else {
                        MessageBox.error(oData.Message || "Password reset failed. Check Employee ID.");
                    }
                }.bind(this),
                error: function () {
                    this._oViewModel.setProperty("/busy", false);
                    MessageBox.error("Reset failed. Please try again.");
                }.bind(this)
            });
        }

    });
});