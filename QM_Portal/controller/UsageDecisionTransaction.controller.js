sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], function (
    Controller,
    MessageToast,
    MessageBox
) {
    "use strict";

    return Controller.extend(
        "qmportal1.controller.UsageDecisionTransaction", {

        /* =========================================================== */
        /* LIFECYCLE                                                    */
        /* =========================================================== */

        onInit: function () {

            // YOUR route name — capital U
            this.getOwnerComponent()
                .getRouter()
                .getRoute("UsageDecisionTransaction")
                .attachPatternMatched(
                    this._onObjectMatched,
                    this
                );
        },

        /* =========================================================== */
        /* ROUTE MATCHED                                                */
        /* Receives inspLot from URL pattern:                          */
        /* UsageDecisionTransaction/{inspLot}                          */
        /* =========================================================== */

        _onObjectMatched: function (oEvent) {

            var sInspLot =
                oEvent.getParameter("arguments").inspLot;

            // Populate the Inspection Lot field
            this.byId("idUDInspLot").setValue(sInspLot || "");

            // Clear all other fields first
            this.byId("idUDDecision").setValue("");
            this.byId("idUDDecisionBy").setValue("");
            this.byId("idUDDecisionDate").setValue("");
            this.byId("idRemarks").setValue("");
            this.byId("idUDLotQty").setValue("");
            this.byId("idUDInspectedQty").setValue("");

            // YOUR model name: transactionModel
            var oModel =
                this.getOwnerComponent()
                    .getModel("transactionModel");

            // Check if a usage decision already exists
            // YOUR entity set: /UsageDecisionSet
            oModel.read(
                "/UsageDecisionSet('" + sInspLot + "')",
                {
                    success: function (oData) {

                        // Decision already exists — populate and lock
                        this.byId("idUDDecision")
                            .setValue(oData.Decision   || "");
                        this.byId("idRemarks")
                            .setValue(oData.Remarks    || "");
                        this.byId("idUDDecisionBy")
                            .setValue(oData.DecisionBy || "");
                        this.byId("idUDDecisionDate")
                            .setValue(oData.DecisionDate || "");

                        // Lock — decision is permanent
                        this._lockScreen();

                        MessageToast.show(
                            "Usage Decision already taken. Changes not allowed."
                        );

                        // Still load result record data for display
                        this._loadResultRecord(sInspLot, true);

                    }.bind(this),

                    error: function () {

                        // No decision yet — enable for new entry
                        this.byId("idUDDecision").setValue("");
                        this.byId("idRemarks").setValue("");
                        this.byId("idUDDecisionBy").setValue("");
                        this.byId("idUDDecisionDate").setValue("");

                        this._unlockScreen();

                        // Load result record quantities for display
                        this._loadResultRecord(sInspLot, false);

                    }.bind(this)
                }
            );
        },

        /* =========================================================== */
        /* LOAD RESULT RECORD                                          */
        /* Reads inspected qty from YOUR /ResultRecordSet              */
        /* =========================================================== */

        _loadResultRecord: function (sInspLot, bIsLocked) {

            var oModel =
                this.getOwnerComponent()
                    .getModel("transactionModel");

            // YOUR entity set: /ResultRecordSet
            oModel.read(
                "/ResultRecordSet('" + sInspLot + "')",
                {
                    success: function (oData) {

                        this.byId("idUDLotQty")
                            .setValue(oData.LotQty      || "");
                        this.byId("idUDInspectedQty")
                            .setValue(oData.InspectedQty || "");

                        if (bIsLocked) {
                            this.byId("idUDLotQty")
                                .setEditable(false);
                            this.byId("idUDInspectedQty")
                                .setEditable(false);
                        }

                    }.bind(this),

                    error: function () {
                        MessageBox.error(
                            "Unable to load Result Record. " +
                            "Please record quantities first."
                        );
                    }
                }
            );
        },

        /* =========================================================== */
        /* LOCK / UNLOCK HELPERS                                       */
        /* =========================================================== */

        _lockScreen: function () {
            this.byId("btnApprove").setEnabled(false);
            this.byId("btnReject").setEnabled(false);
            this.byId("idRemarks").setEditable(false);
        },

        _unlockScreen: function () {
            this.byId("btnApprove").setEnabled(true);
            this.byId("btnReject").setEnabled(true);
            this.byId("idRemarks").setEditable(true);
        },

        /* =========================================================== */
        /* APPROVE / REJECT                                            */
        /* =========================================================== */

        onApprove: function () {

            if (!this.byId("btnApprove").getEnabled()) {
                MessageBox.warning(
                    "Usage Decision already taken. Cannot approve again."
                );
                return;
            }
            this._saveDecision("APPROVED");
        },

        onReject: function () {

            if (!this.byId("btnReject").getEnabled()) {
                MessageBox.warning(
                    "Usage Decision already taken. Cannot reject again."
                );
                return;
            }
            this._saveDecision("REJECTED");
        },

        /* =========================================================== */
        /* SAVE DECISION                                               */
        /* =========================================================== */

        _saveDecision: function (sDecision) {

            var fLotQty = parseFloat(
                this.byId("idUDLotQty").getValue()
            ) || 0;

            var fInspectedQty = parseFloat(
                this.byId("idUDInspectedQty").getValue()
            ) || 0;

            // Qty match guard
            if (fLotQty <= 0 || fInspectedQty <= 0) {
                MessageBox.error(
                    "Result Record not found. Please record quantities first."
                );
                return;
            }

            if (
                Math.round(fLotQty * 1000) !==
                Math.round(fInspectedQty * 1000)
            ) {
                MessageBox.error(
                    "Lot Quantity (" + fLotQty.toFixed(3) +
                    ") must equal Inspected Quantity (" +
                    fInspectedQty.toFixed(3) +
                    ") before taking Usage Decision."
                );
                return;
            }

            var sInspLot = this.byId("idUDInspLot").getValue();
            var sRemarks = this.byId("idRemarks").getValue().trim();

            if (!sRemarks) {
                sRemarks = sDecision === "APPROVED" ? "Accepted" : "Rejected";
            }

            // YOUR model name: transactionModel
            var oModel =
                this.getOwnerComponent()
                    .getModel("transactionModel");

            // YOUR entity set: /UsageDecisionSet
            var oPayload = {
                InspLot : sInspLot,
                Decision: sDecision,
                Remarks : sRemarks
            };

            oModel.create(
                "/UsageDecisionSet",
                oPayload,
                {
                    success: function () {

                        MessageToast.show(
                            "Usage Decision " +
                            (sDecision === "APPROVED"
                                ? "Approved ✔"
                                : "Rejected ✖") +
                            " saved successfully."
                        );

                        // Lock permanently after save
                        this._lockScreen();

                        // Update appState
                        var oAppState =
                            this.getOwnerComponent()
                                .getModel("appState");

                        if (oAppState) {
                            oAppState.setProperty(
                                "/selectedLot/usageDecision",
                                sDecision
                            );
                            oAppState.setProperty(
                                "/selectedLot/usageRemarks",
                                sRemarks
                            );
                        }

                        // Navigate back to UsageDecision list
                        this.getOwnerComponent()
                            .getRouter()
                            .navTo("UsageDecision");

                    }.bind(this),

                    error: function (oError) {
                        MessageBox.error(
                            "Usage Decision Save Failed."
                        );
                        console.error(oError);
                    }
                }
            );
        },

        /* =========================================================== */
        /* NAVIGATION                                                   */
        /* =========================================================== */

        onNavBack: function () {
            this.getOwnerComponent()
                .getRouter()
                .navTo("UsageDecision");
        }

    });
});