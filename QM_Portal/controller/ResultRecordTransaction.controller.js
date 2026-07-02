sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "qmportal1/model/ODataTransactionHelper"
], function (
    Controller,
    MessageToast,
    MessageBox,
    TransHelper
) {
    "use strict";

    return Controller.extend(
        "qmportal1.controller.ResultRecordTransaction", {

        /* =========================================================== */
        /* LIFECYCLE                                                    */
        /* =========================================================== */

        onInit: function () {

            // YOUR route name — capital R
            this.getOwnerComponent()
                .getRouter()
                .getRoute("ResultRecordTransaction")
                .attachPatternMatched(
                    this._onObjectMatched,
                    this
                );
        },

        /* =========================================================== */
        /* ROUTE MATCHED                                                */
        /* Receives inspLot and lotQty from the URL pattern:           */
        /* ResultRecordTransaction/{inspLot}/{lotQty}                  */
        /* =========================================================== */

        _onObjectMatched: function (oEvent) {

            var sInspLot =
                oEvent.getParameter("arguments").inspLot;

            var sLotQty =
                oEvent.getParameter("arguments").lotQty;

            // Populate the read-only header fields
            this.byId("idInspLot").setValue(sInspLot || "");
            this.byId("idLotQty").setValue(sLotQty   || "");

            var that = this;

            // Check if a result record already exists for this lot
            TransHelper.readByKey("ResultRecordSet", sInspLot).then(
                function (oData) {
                    // Existing record found — populate fields
                    that.byId("idUnrestricted")
                        .setValue(oData.UnrestrictedQty || "");
                    that.byId("idBlocked")
                        .setValue(oData.BlockedQty      || "");
                    that.byId("idProd")
                        .setValue(oData.ProdQty         || "");
                    that.byId("idInspected")
                        .setValue(oData.InspectedQty    || "");

                    // Lock if already decided
                    if (
                        oData.Status === "APPROVED" ||
                        oData.Status === "REJECTED"
                    ) {
                        that._lockForm();
                        MessageToast.show(
                            "Usage Decision already taken. Result Recording is locked."
                        );
                    } else {
                        that._unlockForm();
                    }
                },
                function () {
                    // No existing record — fresh entry
                    that.byId("idUnrestricted").setValue("");
                    that.byId("idBlocked").setValue("");
                    that.byId("idProd").setValue("");
                    that.byId("idInspected").setValue("");
                    that._unlockForm();
                }
            );
        },

        /* =========================================================== */
        /* FORM LOCK / UNLOCK HELPERS                                  */
        /* =========================================================== */

        _lockForm: function () {
            this.byId("idUnrestricted").setEditable(false);
            this.byId("idBlocked").setEditable(false);
            this.byId("idProd").setEditable(false);
            this.byId("idInspected").setEditable(false);
            this.byId("btnSaveResult").setEnabled(false);
        },

        _unlockForm: function () {
            this.byId("idUnrestricted").setEditable(true);
            this.byId("idBlocked").setEditable(true);
            this.byId("idProd").setEditable(true);
            this.byId("idInspected").setEditable(false); // always read-only (auto-computed)
            this.byId("btnSaveResult").setEnabled(true);
        },

        /* =========================================================== */
        /* LIVE QTY CHANGE — auto-sum into Inspected Qty               */
        /* =========================================================== */

        onQtyChange: function () {

            var u = parseFloat(this.byId("idUnrestricted").getValue()) || 0;
            var b = parseFloat(this.byId("idBlocked").getValue())      || 0;
            var p = parseFloat(this.byId("idProd").getValue())         || 0;

            this.byId("idInspected").setValue(u + b + p);
        },

        /* =========================================================== */
        /* SAVE                                                         */
        /* =========================================================== */

        onSave: function () {

            var fLotQty      = parseFloat(this.byId("idLotQty").getValue())      || 0;
            var fUnrestricted = parseFloat(this.byId("idUnrestricted").getValue()) || 0;
            var fBlocked      = parseFloat(this.byId("idBlocked").getValue())      || 0;
            var fProd         = parseFloat(this.byId("idProd").getValue())         || 0;
            var fTotal        = fUnrestricted + fBlocked + fProd;

            // Validations
            if (fTotal <= 0) {
                MessageBox.error(
                    "Please enter at least one inspected quantity."
                );
                return;
            }

            if (Math.round(fTotal * 1000) !== Math.round(fLotQty * 1000)) {
                MessageBox.error(
                    "Sum of quantities (" + fTotal.toFixed(3) +
                    ") must equal Lot Quantity (" + fLotQty.toFixed(3) + ")."
                );
                return;
            }

            this.byId("idInspected").setValue(fTotal);

            var oPayload = {
                InspLot        : this.byId("idInspLot").getValue(),
                LotQty         : String(Number(fLotQty).toFixed(5)),
                UnrestrictedQty: String(Number(fUnrestricted).toFixed(5)),
                BlockedQty     : String(Number(fBlocked).toFixed(5)),
                ProdQty        : String(Number(fProd).toFixed(5)),
                InspectedQty   : String(Number(fTotal).toFixed(5)),
                Status         : "RECORDED"
            };

            var that = this;
            TransHelper.create("ResultRecordSet", oPayload).then(
                function () {
                    MessageToast.show(
                        "Result Record Saved Successfully"
                    );

                    // Lock form after successful save
                    that._lockForm();

                    // Update appState so UsageDecision page
                    // gets the inspected qty without another fetch
                    var oAppState =
                        that.getOwnerComponent()
                            .getModel("appState");

                    if (oAppState) {
                        oAppState.setProperty(
                            "/selectedLot/inspectedQty",
                            fTotal
                        );
                        oAppState.setProperty(
                            "/selectedLot/resultRecorded",
                            true
                        );
                    }

                    // Navigate to UsageDecision after save
                    that.getOwnerComponent()
                        .getRouter()
                        .navTo("UsageDecision");
                },
                function (oError) {
                    MessageBox.error("Save Failed: " + (oError.message || "Unknown error"));
                    console.error(oError);
                }
            );
        },

        /* =========================================================== */
        /* NAVIGATION                                                   */
        /* =========================================================== */

        onNavBack: function () {
            this.getOwnerComponent()
                .getRouter()
                .navTo("ResultRecord");
        }

    });
});