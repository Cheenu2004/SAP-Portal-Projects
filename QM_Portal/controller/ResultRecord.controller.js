sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "qmportal1/model/ODataTransactionHelper"
], function (
    Controller,
    JSONModel,
    Filter,
    FilterOperator,
    MessageToast,
    MessageBox,
    TransHelper
) {
    "use strict";

    return Controller.extend("qmportal1.controller.ResultRecord", {

        /* =========================================================== */
        /* LIFECYCLE                                                    */
        /* =========================================================== */

        onInit: function () {

            this._sSearchValue  = "";
            this._oRecordedLots = {};
            this._oDecidedLots  = {};

            this._oDialogModel = new JSONModel({
                InspLot          : "",
                Material         : "",
                LotQty           : 0,
                LotQtyDisplay    : "",
                UnrestrictedQty  : "",
                BlockedQty       : "",
                ProdQty          : "",
                validationMsg    : "",
                validationState  : "None",
                validationVisible: false,
                saveEnabled      : false,
                busy             : false
            });
            this.getView().setModel(this._oDialogModel, "dialogModel");

            this._oViewModel = new JSONModel({
                InspLot        : "",
                Material       : "",
                LotQty         : "",
                UnrestrictedQty: "",
                BlockedQty     : "",
                ProdQty        : "",
                InspectedQty   : "",
                DecisionText   : "No decision yet",
                DecisionState  : "Warning",
                Remarks        : "",
                HasRemarks     : false
            });
            this.getView().setModel(this._oViewModel, "viewModel");

            var oEmptyFilterModel = new JSONModel({
                inspLots     : [],
                materials    : [],
                descriptions : [],
                charDescs    : [],
                quantities   : []
            });
            this.getView().setModel(oEmptyFilterModel, "rrFilterModel");

            sap.ui.core.UIComponent.getRouterFor(this)
                .getRoute("ResultRecord")
                .attachPatternMatched(this._onRouteMatched, this);

            var that = this;
            this.getView().addEventDelegate({
                onAfterShow: function () {
                    setTimeout(function () {
                        that._loadFilterValues();
                    }, 500);
                }
            });
        },

        /* =========================================================== */
        /* ROLE HELPER                                                  */
        /* =========================================================== */

        _isSafetyManager: function () {
            var oAppState = this.getOwnerComponent().getModel("appState");
            if (!oAppState) { return false; }
            return (oAppState.getProperty("/role") || "").toUpperCase() === "SAFETY_MANAGER";
        },

        _getLoggedInUser: function () {
            var oAppState = this.getOwnerComponent().getModel("appState");
            return oAppState ? (oAppState.getProperty("/loggedInUser") || "") : "";
        },

        /* =========================================================== */
        /* ROUTE MATCHED                                                */
        /* =========================================================== */

        _onRouteMatched: function () {
            this._loadStatusMaps();
            this._refreshResultModel();
        },

        /* =========================================================== */
        /* STATUS MAP LOADING — native oModel.read, no ODataService    */
        /* =========================================================== */

        _loadStatusMaps: function () {

            var oTransModel = this.getOwnerComponent().getModel("transactionModel");
            var oUsageModel = this.getOwnerComponent().getModel("usageModel");

            if (oTransModel) {
                oTransModel.read("/ResultRecordSet", {
                    success: function (oData) {
                        this._oRecordedLots = {};
                        var aResults = (oData && oData.results) ? oData.results : [];
                        aResults.forEach(function (oRec) {
                            if (oRec.InspLot) {
                                var sKey = String(oRec.InspLot).trim();
                                this._oRecordedLots[sKey] = {
                                    LotQty         : oRec.LotQty,
                                    UnrestrictedQty: oRec.UnrestrictedQty,
                                    BlockedQty     : oRec.BlockedQty,
                                    ProdQty        : oRec.ProdQty,
                                    InspectedQty   : oRec.InspectedQty,
                                    Status         : oRec.Status
                                };
                            }
                        }.bind(this));
                        var oRM = this.getOwnerComponent().getModel("resultModel");
                        if (oRM) { oRM.refresh(true); }
                    }.bind(this),
                    error: function () { this._oRecordedLots = {}; }.bind(this)
                });
            }

            if (oUsageModel) {
                oUsageModel.read("/ZQM_USAGE_DEC_902065", {
                    success: function (oData) {
                        this._oDecidedLots = {};
                        var aResults = (oData && oData.results) ? oData.results : [];
                        aResults.forEach(function (oRec) {
                            if (!oRec.wf_insp_lot) { return; }
                            var sStatus = (oRec.wf_status || "").toUpperCase();
                            if (sStatus !== "APPROVED" && sStatus !== "REJECTED") { return; }
                            var sKey = String(oRec.wf_insp_lot).trim();
                            this._oDecidedLots[sKey] = {
                                Decision: sStatus,
                                Remarks : oRec.wf_usage_code || ""
                            };
                        }.bind(this));
                        var oRM = this.getOwnerComponent().getModel("resultModel");
                        if (oRM) { oRM.refresh(true); }
                    }.bind(this),
                    error: function () { this._oDecidedLots = {}; }.bind(this)
                });
            }
        },

        /* =========================================================== */
        /* DATA LOAD                                                    */
        /* =========================================================== */

        _refreshResultModel: function () {
            var oView        = this.getView();
            var oResultModel = this.getOwnerComponent().getModel("resultModel");
            if (!oResultModel) { return; }

            oView.setBusy(true);
            oResultModel.read("/ZQM_RESULT_REC_902065", {
                success: function () {
                    oView.setBusy(false);
                    oResultModel.refresh(true);
                },
                error: function (oError) {
                    oView.setBusy(false);
                    MessageBox.error("Failed to load result records.");
                    console.error(oError);
                }
            });
        },

        /* =========================================================== */
        /* FILTER VALUE LOADER                                         */
        /* =========================================================== */

        _loadFilterValues: function () {
            var oModel = this.getOwnerComponent().getModel("resultModel");
            var that   = this;
            if (!oModel) { return; }

            oModel.read("/ZQM_RESULT_REC_902065", {
                success: function (oData) {
                    var aResults = (oData && oData.results) ? oData.results
                        : (oData && oData.d && oData.d.results) ? oData.d.results : [];

                    function getUnique(sField) {
                        var oMap = {}, aValues = [];
                        aResults.forEach(function (oItem) {
                            var vVal = oItem[sField];
                            if (vVal !== null && vVal !== undefined && vVal !== "" && !oMap[vVal]) {
                                oMap[vVal] = true;
                                aValues.push({ key: String(vVal), text: String(vVal) });
                            }
                        });
                        return aValues.sort(function (a, b) { return a.text.localeCompare(b.text); });
                    }

                    var oFilterModel = that.getView().getModel("rrFilterModel");
                    oFilterModel.setData({
                        inspLots     : getUnique("wf_insp_lot"),
                        materials    : getUnique("wf_material"),
                        descriptions : getUnique("wf_material_desc"),
                        charDescs    : getUnique("wf_char_desc"),
                        quantities   : getUnique("wf_quantity")
                    });
                    oFilterModel.refresh(true);
                    that._applyAllFilters();
                    MessageToast.show("Loaded " + aResults.length + " result records");
                },
                error: function () {
                    MessageToast.show("Failed to load filter values");
                }
            });
        },

        /* =========================================================== */
        /* SEARCH & FILTERS                                            */
        /* =========================================================== */

        onSearch: function (oEvent) {
            this._sSearchValue = oEvent.getParameter("newValue") || "";
            this._applyAllFilters();
        },

        onFilterChange      : function () { this._applyAllFilters(); },
        onStatusFilterChange: function () { this._applyAllFilters(); },
        onApplyFilters      : function () { this._applyAllFilters(); MessageToast.show("Filters Applied"); },

        _applyAllFilters: function () {
            var aAllFilters = [];

            if (this._sSearchValue && this._sSearchValue.trim() !== "") {
                aAllFilters.push(new Filter({
                    filters: [
                        new Filter("wf_insp_lot",      FilterOperator.Contains, this._sSearchValue),
                        new Filter("wf_material",      FilterOperator.Contains, this._sSearchValue),
                        new Filter("wf_material_desc", FilterOperator.Contains, this._sSearchValue),
                        new Filter("wf_char_desc",     FilterOperator.Contains, this._sSearchValue)
                    ],
                    and: false
                }));
            }

            aAllFilters = aAllFilters.concat(this._getColumnFilters());

            var oBinding = this.byId("rr_resultTable").getBinding("items");
            if (oBinding) { oBinding.filter(aAllFilters); }
            this._applyClientStatusFilter();
        },

        _getColumnFilters: function () {
            var aFilters = [], that = this;
            function addMultiFilter(sId, sField) {
                var oCombo = that.byId(sId);
                if (!oCombo) { return; }
                var aKeys = oCombo.getSelectedKeys();
                if (aKeys && aKeys.length > 0) {
                    aFilters.push(new Filter({
                        filters: aKeys.map(function (k) { return new Filter(sField, FilterOperator.EQ, k); }),
                        and: false
                    }));
                }
            }
            addMultiFilter("rr_filterMaterial",  "wf_material");
            addMultiFilter("rr_filterChar",      "wf_char_desc");
            return aFilters;
        },

        _applyClientStatusFilter: function () {
            var sStatus = this.byId("rr_statusFilter").getSelectedKey();
            var oSeen = {};
            this.byId("rr_resultTable").getItems().forEach(function (oItem) {
                var oCtx = oItem.getBindingContext("resultModel");
                if (!oCtx) { return; }
                var sLot = String(oCtx.getProperty("wf_insp_lot") || "").trim();
                var sKey = sLot;
                if (oSeen[sKey]) {
                    oItem.setVisible(false);
                    return;
                }
                oSeen[sKey] = true;
                
                oItem.setVisible(!sStatus || this._getLotStatus(sLot) === sStatus);
            }.bind(this));
        },

        _getLotStatus: function (sLot) {
            if (!sLot) { return "PENDING"; }
            var sKey = String(sLot).trim();
            if (this._oDecidedLots[sKey]) { return this._oDecidedLots[sKey].Decision; }
            if (this._oRecordedLots[sKey]) { return this._oRecordedLots[sKey].Status || "RECORDED"; }
            return "PENDING";
        },

        onClearFilters: function () {
            this._sSearchValue = "";
            var oSF = this.byId("rr_searchField");
            if (oSF) { oSF.setValue(""); }
            ["rr_filterMaterial", "rr_filterChar"].forEach(function (sId) {
                var o = this.byId(sId);
                if (o) { o.removeAllSelectedItems(); }
            }, this);
            this.byId("rr_statusFilter").setSelectedKey("");
            var oBinding = this.byId("rr_resultTable").getBinding("items");
            if (oBinding) { oBinding.filter([]); }
            this.byId("rr_resultTable").getItems().forEach(function (o) { o.setVisible(true); });
            MessageToast.show("Filters Cleared");
        },

        /* =========================================================== */
        /* TABLE EVENTS                                                 */
        /* =========================================================== */

        onTableUpdateFinished: function (oEvent) {
            var iTotal = oEvent.getParameter("total");
            var oText  = this.byId("rr_itemCountText");
            if (oText) { oText.setText("Total: " + iTotal + " record(s)"); }
            this._applyClientStatusFilter();
        },

        onRefresh: function () {
            var oBinding = this.byId("rr_resultTable").getBinding("items");
            if (oBinding) {
                oBinding.refresh(true);
                this._loadFilterValues();
                this._loadStatusMaps();
                MessageToast.show("Refreshed");
            }
        },

        /* =========================================================== */
        /* DETAIL / VIEW BUTTON PRESS                                  */
        /* =========================================================== */

        onDetailPress: function (oEvent) {
            var oItem    = oEvent.getSource().getParent();
            var oContext = oItem.getBindingContext("resultModel");
            if (!oContext) { return; }
            var oRowData  = oContext.getObject();
            var sInspLot  = String(oRowData.wf_insp_lot || "").trim();
            var sMaterial = oRowData.wf_material || "";
            var fLotQty   = parseFloat(oRowData.wf_quantity) || 0;
            var that      = this;

            this.getView().setBusy(true);

            var sUIStatus = this.formatRecordStatus(sInspLot);

            // LOCKING RULE: once Approved or Rejected → always read-only for everyone
            if (sUIStatus === "Approved" || sUIStatus === "Rejected") {
                that._fetchResultRecordAndOpenView(sInspLot, oRowData, fLotQty, sUIStatus.toUpperCase(), "");
                return;
            }

            // ROLE CHECK: non-managers get read-only view even for OPEN/PENDING lots
            if (!this._isSafetyManager()) {
                TransHelper.readByKey("ResultRecordSet", sInspLot).then(
                    function (oRRData) {
                        that.getView().setBusy(false);
                        that._openViewDialog(sInspLot, oRowData, fLotQty, oRRData, "OPEN", "");
                    },
                    function () {
                        that.getView().setBusy(false);
                        that._openViewDialog(sInspLot, oRowData, fLotQty, null, "PENDING", "");
                    }
                );
                return;
            }

            // SAFETY_MANAGER: open edit dialog for PENDING / OPEN lots
            TransHelper.readByKey("ResultRecordSet", sInspLot).then(
                function (oRRData) {
                    that.getView().setBusy(false);
                    that._openEditDialog(sInspLot, sMaterial, fLotQty, oRRData);
                },
                function () {
                    that.getView().setBusy(false);
                    that._openEditDialog(sInspLot, sMaterial, fLotQty, null);
                }
            );
        },

        /* =========================================================== */
        /* VIEW DIALOG                                                  */
        /* =========================================================== */

        _fetchResultRecordAndOpenView: function (sInspLot, oRowData, fLotQty, sStatus, sRemarks) {
            var that = this;
            TransHelper.readByKey("ResultRecordSet", sInspLot).then(
                function (oRRData) {
                    that.getView().setBusy(false);
                    that._openViewDialog(sInspLot, oRowData, fLotQty, oRRData, sStatus, sRemarks);
                },
                function () {
                    that.getView().setBusy(false);
                    that._openViewDialog(sInspLot, oRowData, fLotQty, null, sStatus, sRemarks);
                }
            );
        },

        _openViewDialog: function (sInspLot, oRowData, fLotQty, oRRData, sStatus, sRemarks) {
            oRRData = oRRData || {};
            var fUnrestr   = parseFloat(oRRData.UnrestrictedQty) || 0;
            var fBlocked   = parseFloat(oRRData.BlockedQty)      || 0;
            var fProd      = parseFloat(oRRData.ProdQty)         || 0;
            var fInspected = parseFloat(oRRData.InspectedQty)    || 0;
            var sDecisionText, sDecisionState;
            if (sStatus === "APPROVED")      { sDecisionText = "Approved \u2713"; sDecisionState = "Success"; }
            else if (sStatus === "REJECTED") { sDecisionText = "Rejected \u2717"; sDecisionState = "Error"; }
            else                             { sDecisionText = "Recorded \u2014 Awaiting Usage Decision"; sDecisionState = "Information"; }
            
            sRemarks = sRemarks || "";
            this._oViewModel.setData({
                InspLot: sInspLot, Material: oRowData.wf_material || "",
                LotQty         : fLotQty    > 0 ? fLotQty.toFixed(3)    : "\u2014",
                UnrestrictedQty: fUnrestr   > 0 ? fUnrestr.toFixed(3)   : "\u2014",
                BlockedQty     : fBlocked   > 0 ? fBlocked.toFixed(3)   : "\u2014",
                ProdQty        : fProd      > 0 ? fProd.toFixed(3)      : "\u2014",
                InspectedQty   : fInspected > 0 ? fInspected.toFixed(3) : "\u2014",
                DecisionText: sDecisionText, DecisionState: sDecisionState,
                Remarks: sRemarks, HasRemarks: sRemarks.trim() !== ""
            });
            this.byId("viewDetailsDialog").open();
        },

        onCloseViewDialog: function () { this.byId("viewDetailsDialog").close(); },

        /* =========================================================== */
        /* EDIT DIALOG                                                  */
        /* =========================================================== */

        _openEditDialog: function (sInspLot, sMaterial, fLotQty, oRRData) {
            oRRData = oRRData || {};
            var fU = oRRData.UnrestrictedQty !== undefined ? parseFloat(oRRData.UnrestrictedQty) : NaN;
            var fB = oRRData.BlockedQty !== undefined ? parseFloat(oRRData.BlockedQty) : NaN;
            var fP = oRRData.ProdQty !== undefined ? parseFloat(oRRData.ProdQty) : NaN;
            this._oDialogModel.setData({
                InspLot: sInspLot, Material: sMaterial, LotQty: fLotQty,
                LotQtyDisplay: fLotQty.toFixed(3),
                UnrestrictedQty: !isNaN(fU) ? fU.toString() : "", 
                BlockedQty: !isNaN(fB) ? fB.toString() : "", 
                ProdQty: !isNaN(fP) ? fP.toString() : "",
                validationMsg: "", validationState: "None",
                validationVisible: false, saveEnabled: false, busy: false
            });
            this.onQtyLiveChange();
            this.byId("recordResultDialog").open();
        },

        /* =========================================================== */
        /* LIVE VALIDATION                                             */
        /* =========================================================== */

        onQtyLiveChange: function () {
            var oData  = this._oDialogModel.getData();
            var fU = parseFloat(oData.UnrestrictedQty), fB = parseFloat(oData.BlockedQty), fP = parseFloat(oData.ProdQty);
            var fLot = parseFloat(oData.LotQty) || 0;
            var bAllFilled = oData.UnrestrictedQty !== "" && oData.BlockedQty !== "" && oData.ProdQty !== "";
            if (!bAllFilled) {
                this._oDialogModel.setProperty("/validationVisible", false);
                this._oDialogModel.setProperty("/saveEnabled", false);
                return;
            }
            if (isNaN(fU) || isNaN(fB) || isNaN(fP)) {
                this._oDialogModel.setProperty("/validationMsg",     "Please enter valid numbers only.");
                this._oDialogModel.setProperty("/validationState",   "Error");
                this._oDialogModel.setProperty("/validationVisible", true);
                this._oDialogModel.setProperty("/saveEnabled",       false);
                return;
            }
            var fSum = fU + fB + fP;
            // Strict exact match validation
            var bValid = Math.round(fSum * 1000) === Math.round(fLot * 1000) && fU >= 0 && fB >= 0 && fP >= 0;
            this._oDialogModel.setProperty("/validationVisible", true);
            this._oDialogModel.setProperty("/saveEnabled",       bValid);
            this._oDialogModel.setProperty("/validationMsg",
                !bValid ? "Sum (" + fSum.toFixed(3) + ") must exactly match Lot Qty (" + fLot.toFixed(3) + ")"
                        : "\u2713 Sum matches Lot Qty (" + fLot.toFixed(3) + ")");
            this._oDialogModel.setProperty("/validationState", !bValid ? "Error" : "Success");
        },

        /* =========================================================== */
        /* SAVE                                                         */
        /* =========================================================== */

        onSaveResultRecord: function () {
            // Extra guard: only SAFETY_MANAGER may save
            if (!this._isSafetyManager()) {
                MessageBox.error("You do not have permission to save Result Records.");
                return;
            }

            var oData = this._oDialogModel.getData();
            var fU = parseFloat(oData.UnrestrictedQty), fB = parseFloat(oData.BlockedQty), fP = parseFloat(oData.ProdQty);
            var fLot = parseFloat(oData.LotQty) || 0, fSum = fU + fB + fP;

            if (isNaN(fU) || isNaN(fB) || isNaN(fP)) { MessageBox.warning("All three quantity fields are required."); return; }
            if (fU < 0 || fB < 0 || fP < 0)          { MessageBox.warning("Quantities cannot be negative."); return; }
            if (Math.round(fSum * 1000) !== Math.round(fLot * 1000)) {
                MessageBox.error("Sum (" + fSum.toFixed(3) + ") must equal Lot Quantity (" + fLot.toFixed(3) + ")."); return;
            }

            this._oDialogModel.setProperty("/busy", true);
            var that = this;

            var oPayload = {
                InspLot        : oData.InspLot,
                LotQty         : String(fLot.toFixed(5)),
                UnrestrictedQty: String(fU.toFixed(5)),
                BlockedQty     : String(fB.toFixed(5)),
                ProdQty        : String(fP.toFixed(5)),
                InspectedQty   : String(fSum.toFixed(5)),
                Status         : "OPEN",
                UserId         : this._getLoggedInUser()   // ← required by backend
            };

            TransHelper.create("ResultRecordSet", oPayload).then(
                function () {
                    that._oDialogModel.setProperty("/busy", false);
                    that._oRecordedLots[oData.InspLot.trim()] = {
                        LotQty: fLot, UnrestrictedQty: fU, BlockedQty: fB, ProdQty: fP, InspectedQty: fSum
                    };
                    var oAppState = that.getOwnerComponent().getModel("appState");
                    if (oAppState) {
                        oAppState.setProperty("/selectedLot", {
                            wf_insp_lot: oData.InspLot, wf_material: oData.Material,
                            wf_quantity: fLot, inspectedQty: fSum,
                            resultRecorded: true, usageDecision: "", usageRemarks: ""
                        });
                    }
                    MessageToast.show("Result recorded for Lot: " + oData.InspLot);
                    that.byId("recordResultDialog").close();
                    that._refreshResultModel();
                    sap.ui.core.UIComponent.getRouterFor(that).navTo("UsageDecision");
                },
                function (oError) {
                    that._oDialogModel.setProperty("/busy", false);
                    MessageBox.error("Failed to save result record: " + (oError.message || "Unknown error"));
                    console.error(oError);
                }
            );
        },

        onCancelResultRecord: function () { this.byId("recordResultDialog").close(); },

        /* =========================================================== */
        /* NAVIGATION                                                   */
        /* =========================================================== */

        onNavBack: function () {
            sap.ui.core.UIComponent.getRouterFor(this).navTo("InspectionLot");
        },

        /* =========================================================== */
        /* FORMATTERS                                                   */
        /* =========================================================== */

        formatRecordStatus: function (sInspLot) {
            if (!sInspLot) { return "Pending"; }
            var s = this._getLotStatus(String(sInspLot).trim());
            return ({ PENDING: "Pending", OPEN: "Open", RECORDED: "Recorded", APPROVED: "Approved", REJECTED: "Rejected" })[s] || "Pending";
        },
        formatRecordStatusState: function (sInspLot) {
            if (!sInspLot) { return "Warning"; }
            var s = this._getLotStatus(String(sInspLot).trim());
            return s === "APPROVED" ? "Success" : s === "REJECTED" ? "Error" : (s === "RECORDED" || s === "OPEN") ? "Information" : "Warning";
        },
        formatActionButtonText: function (sInspLot) {
            if (!sInspLot) { return "Details"; }
            return this._getLotStatus(String(sInspLot).trim()) === "PENDING" ? "Details" : "View";
        },
        formatActionButtonIcon: function (sInspLot) {
            if (!sInspLot) { return "sap-icon://detail-view"; }
            var s = this._getLotStatus(String(sInspLot).trim());
            return s === "APPROVED" ? "sap-icon://accept" : s === "REJECTED" ? "sap-icon://decline" : s === "RECORDED" ? "sap-icon://display" : "sap-icon://detail-view";
        },
        // Returns true for non-managers (CONSULTANT / ENGINEER) — shows the read-only banner
        formatReadOnlyBannerVisible: function (sRole) {
            return (sRole || "").toUpperCase() !== "SAFETY_MANAGER";
        }

    });
});