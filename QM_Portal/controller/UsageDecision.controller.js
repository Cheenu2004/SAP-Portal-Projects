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

    return Controller.extend("qmportal1.controller.UsageDecision", {

        /* =========================================================== */
        /* LIFECYCLE                                                    */
        /* =========================================================== */

        onInit: function () {

            this._sSearchValue = "";
            this._oDecidedLots = {};

            this._oDialogModel = new JSONModel({
                InspLot        : "",
                Material       : "",
                LotQty         : 0,
                InspectedQty   : 0,
                Remarks        : "",
                qtyMatchMsg    : "",
                qtyMatchState  : "None",
                decisionEnabled: false,
                busy           : false
            });
            this.getView().setModel(this._oDialogModel, "dialogModel");

            var oEmptyFilterModel = new JSONModel({
                inspLots     : [],
                materials    : [],
                descriptions : [],
                decisionBys  : [],
                inspTypes    : [],
                statuses     : []
            });
            this.getView().setModel(oEmptyFilterModel, "udFilterModel");

            sap.ui.core.UIComponent.getRouterFor(this)
                .getRoute("UsageDecision")
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
        /* ROLE HELPERS                                                 */
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
            this._loadDecidedLots();
            this._refreshUsageModel();
        },

        /* =========================================================== */
        /* LOAD DECIDED LOTS — native oModel.read, no ODataService     */
        /* =========================================================== */

        _loadDecidedLots: function () {
            var oUsageModel = this.getOwnerComponent().getModel("usageModel");
            if (!oUsageModel) { return; }

            oUsageModel.read("/ZQM_USAGE_DEC_902065", {
                success: function (oData) {
                    this._oDecidedLots = {};
                    var aResults = (oData && oData.results) ? oData.results : [];
                    aResults.forEach(function (oRec) {
                        if (!oRec.wf_insp_lot) { return; }
                        var sStatus = (oRec.wf_status || "").toUpperCase();
                        if (sStatus !== "APPROVED" && sStatus !== "REJECTED") { return; }
                        var sKey     = String(oRec.wf_insp_lot).trim();
                        var sNumeric = String(parseInt(sKey, 10));
                        this._oDecidedLots[sKey]    = sStatus;
                        this._oDecidedLots[sNumeric] = sStatus;
                    }.bind(this));
                    var oUM = this.getOwnerComponent().getModel("usageModel");
                    if (oUM) { oUM.refresh(true); }
                }.bind(this),
                error: function () { /* keep existing map */ }.bind(this)
            });
        },

        /* =========================================================== */
        /* DATA LOAD                                                    */
        /* =========================================================== */

        _refreshUsageModel: function () {
            var oView       = this.getView();
            var oUsageModel = this.getOwnerComponent().getModel("usageModel");
            if (!oUsageModel) { return; }

            oView.setBusy(true);
            oUsageModel.read("/ZQM_USAGE_DEC_902065", {
                success: function () {
                    oView.setBusy(false);
                    oUsageModel.refresh(true);
                },
                error: function (oError) {
                    oView.setBusy(false);
                    MessageBox.error("Failed to load usage decisions.");
                    console.error(oError);
                }
            });
        },

        /* =========================================================== */
        /* FILTER VALUE LOADER                                         */
        /* =========================================================== */

        _loadFilterValues: function () {
            var oModel = this.getOwnerComponent().getModel("usageModel");
            var that   = this;
            if (!oModel) { return; }

            oModel.read("/ZQM_USAGE_DEC_902065", {
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

                    var oFilterModel = that.getView().getModel("udFilterModel");
                    oFilterModel.setData({
                        inspLots     : getUnique("wf_insp_lot"),
                        materials    : getUnique("wf_material"),
                        descriptions : getUnique("wf_material_desc"),
                        decisionBys  : getUnique("wf_decision_by"),
                        inspTypes    : getUnique("wf_insp_type"),
                        statuses     : getUnique("wf_status")
                    });
                    oFilterModel.refresh(true);
                    that._applyAllFilters();
                    MessageToast.show("Loaded " + aResults.length + " usage decision records");
                },
                error: function () {
                    MessageToast.show("Failed to load filter values");
                }
            });
        },

        /* =========================================================== */
        /* TABLE EVENTS                                                 */
        /* =========================================================== */

        onTableUpdateFinished: function (oEvent) {
            var iTotal = oEvent.getParameter("total");
            var oText  = this.byId("ud_itemCountText");
            if (oText) { oText.setText("Total: " + iTotal + " record(s)"); }
            this._applyClientStatusFilter();
        },

        onRefresh: function () {
            var oBinding = this.byId("ud_decisionTable").getBinding("items");
            if (oBinding) {
                oBinding.refresh(true);
                this._loadFilterValues();
                this._loadDecidedLots();
                MessageToast.show("Usage Decisions Refreshed");
            }
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
                        new Filter("wf_decision_by",   FilterOperator.Contains, this._sSearchValue),
                        new Filter("wf_insp_type",     FilterOperator.Contains, this._sSearchValue),
                        new Filter("wf_status",        FilterOperator.Contains, this._sSearchValue)
                    ],
                    and: false
                }));
            }

            aAllFilters = aAllFilters.concat(this._getColumnFilters());

            var oTable   = this.byId("ud_decisionTable");
            var oBinding = oTable ? oTable.getBinding("items") : null;
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
            addMultiFilter("ud_filterMaterial",   "wf_material");
            return aFilters;
        },

        _applyClientStatusFilter: function () {
            var sStatus = this.byId("ud_statusFilter").getSelectedKey();
            var oTable  = this.byId("ud_decisionTable");
            if (!oTable) { return; }
            oTable.getItems().forEach(function (oItem) {
                var oCtx = oItem.getBindingContext("usageModel");
                if (!oCtx) { return; }
                var sLot      = String(oCtx.getProperty("wf_insp_lot") || "").trim();
                var sDecision = this._oDecidedLots[sLot] || "PENDING";
                oItem.setVisible(!sStatus || sDecision === sStatus);
            }.bind(this));
        },

        onClearFilters: function () {
            this._sSearchValue = "";
            var oSF = this.byId("ud_searchField");
            if (oSF) { oSF.setValue(""); }
            this.byId("ud_statusFilter").setSelectedKey("");
            var oMaterial = this.byId("ud_filterMaterial");
            if (oMaterial) { oMaterial.removeAllSelectedItems(); }
            var oBinding = this.byId("ud_decisionTable").getBinding("items");
            if (oBinding) { oBinding.filter([]); }
            this.byId("ud_decisionTable").getItems().forEach(function (o) { o.setVisible(true); });
            MessageToast.show("Filters Cleared");
        },

        /* =========================================================== */
        /* ACTION BUTTON PRESS                                         */
        /* =========================================================== */

        onActionPress: function (oEvent) {
            var oItem    = oEvent.getSource().getParent();
            var oContext = oItem.getBindingContext("usageModel");
            if (!oContext) { return; }

            var oRowData = oContext.getObject();
            var sInspLot = String(oRowData.wf_insp_lot || "").trim();
            var fLotQty  = parseFloat(oRowData.wf_quantity) || 0;
            var that     = this;

            this.getView().setBusy(true);

            var sUIStatus = this.formatDecisionStatus(sInspLot);

            // LOCKING RULE: decided lots are always read-only for everyone
            if (sUIStatus === "Approved" || sUIStatus === "Rejected") {
                TransHelper.readByKey("UsageDecisionSet", sInspLot).then(
                    function (oUDData) {
                        that.getView().setBusy(false);
                        that._openViewDialog(sInspLot, oRowData, fLotQty, sUIStatus.toUpperCase(), oUDData.Remarks, oUDData.DecisionBy || oRowData.wf_decision_by || "System");
                    },
                    function () {
                        that.getView().setBusy(false);
                        that._openViewDialog(sInspLot, oRowData, fLotQty, sUIStatus.toUpperCase(), "", oRowData.wf_decision_by || "Unknown");
                    }
                );
                return;
            }

            // ROLE CHECK: non-managers may only view — they cannot take a decision
            if (!this._isSafetyManager()) {
                that.getView().setBusy(false);
                that._openViewDialog(sInspLot, oRowData, fLotQty, "PENDING", "", "");
                return;
            }

            // SAFETY_MANAGER: open decision dialog (fetch result record qty first)
            TransHelper.readByKey("ResultRecordSet", sInspLot).then(
                function (oRRData) {
                    that.getView().setBusy(false);
                    var fInspectedQty = parseFloat(oRRData.InspectedQty) || 0;
                    that._openDecisionDialog(oRowData, fLotQty, fInspectedQty);
                },
                function () {
                    that.getView().setBusy(false);
                    // No Result Record -> Inspected Qty = 0
                    that._openDecisionDialog(oRowData, fLotQty, 0);
                }
            );
        },

        /* =========================================================== */
        /* DECISION DIALOG                                             */
        /* =========================================================== */

        _openViewDialog: function (sInspLot, oRowData, fLotQty, sStatus, sRemarks, sDecisionBy) {
            var sDecisionText, sDecisionState;
            if (sStatus === "APPROVED")      { sDecisionText = "Approved \u2713"; sDecisionState = "Success"; }
            else if (sStatus === "REJECTED") { sDecisionText = "Rejected \u2717"; sDecisionState = "Error"; }
            else                             { sDecisionText = "No decision yet"; sDecisionState = "Warning"; }

            sRemarks = sRemarks || "";

            if (!this._oViewModel) {
                this._oViewModel = new sap.ui.model.json.JSONModel();
                this.getView().setModel(this._oViewModel, "viewModel");
            }

            this._oViewModel.setData({
                InspLot      : sInspLot,
                Material     : oRowData.wf_material || "",
                LotQty       : fLotQty > 0 ? fLotQty.toFixed(3) : "\u2014",
                DecisionText : sDecisionText,
                DecisionState: sDecisionState,
                DecisionBy   : sDecisionBy,
                Remarks      : sRemarks,
                HasRemarks   : sRemarks.trim() !== ""
            });
            this.byId("viewDecisionDialog").open();
        },

        onCloseViewDialog: function () {
            this.byId("viewDecisionDialog").close();
        },

        _openDecisionDialog: function (oRowData, fLotQty, fInspectedQty) {
            var bMatch = fInspectedQty > 0 &&
                Math.round(fLotQty * 1000) === Math.round(fInspectedQty * 1000);
            var sMsg, sState;
            if (fInspectedQty === 0) {
                sMsg   = "No result recorded for this lot. Please record quantities first.";
                sState = "Warning";
            } else if (bMatch) {
                sMsg   = "\u2713 Lot Qty (" + fLotQty.toFixed(3) + ") = Inspected Qty (" + fInspectedQty.toFixed(3) + ") \u2014 Ready for decision";
                sState = "Success";
            } else {
                sMsg   = "\u26A0 Lot Qty (" + fLotQty.toFixed(3) + ") \u2260 Inspected Qty (" + fInspectedQty.toFixed(3) + ") \u2014 Cannot decide";
                sState = "Error";
            }
            this._oDialogModel.setData({
                InspLot: String(oRowData.wf_insp_lot || "").trim(),
                Material: oRowData.wf_material || "",
                LotQty: fLotQty, InspectedQty: fInspectedQty, Remarks: "",
                qtyMatchMsg: sMsg, qtyMatchState: sState,
                decisionEnabled: bMatch, busy: false
            });
            this.byId("usageDecisionDialog").open();
        },

        /* =========================================================== */
        /* APPROVE / REJECT                                            */
        /* =========================================================== */

        onApprove: function () { this._saveDecision("APPROVED"); },
        onReject : function () { this._saveDecision("REJECTED"); },

        _saveDecision: function (sDecision) {
            // Extra guard: only SAFETY_MANAGER may take a decision
            if (!this._isSafetyManager()) {
                MessageBox.error("You do not have permission to take Usage Decisions.");
                return;
            }

            var oData    = this._oDialogModel.getData();
            var sInspLot = oData.InspLot;
            if (!sInspLot) { MessageBox.error("Inspection Lot is missing."); return; }
            if (this._oDecidedLots[sInspLot]) {
                MessageBox.error("Lot " + sInspLot + " already has a final decision.");
                this.byId("usageDecisionDialog").close();
                return;
            }

            var sRemarks = (oData.Remarks && oData.Remarks.trim() !== "")
                ? oData.Remarks.trim()
                : (sDecision === "APPROVED" ? "Accepted" : "Rejected");

            this._oDialogModel.setProperty("/busy", true);
            var that = this;

            TransHelper.create("UsageDecisionSet", {
                InspLot : sInspLot,
                Decision: sDecision,
                Remarks : sRemarks,
                UserId  : this._getLoggedInUser()   // <- required by backend
            }).then(
                function () {
                    that._oDialogModel.setProperty("/busy", false);
                    that._oDecidedLots[sInspLot] = sDecision;
                    that._oDecidedLots[String(parseInt(sInspLot, 10))] = sDecision;

                    var oAppState = that.getOwnerComponent().getModel("appState");
                    if (oAppState) {
                        oAppState.setProperty("/selectedLot/usageDecision", sDecision);
                        oAppState.setProperty("/selectedLot/usageRemarks",  sRemarks);
                    }

                    MessageToast.show(
                        "Decision saved: " +
                        (sDecision === "APPROVED" ? "Approved \u2713" : "Rejected \u2717") +
                        " for Lot " + sInspLot + ". This is permanent."
                    );
                    that.byId("usageDecisionDialog").close();
                    that._refreshUsageModel();
                },
                function (oError) {
                    that._oDialogModel.setProperty("/busy", false);
                    MessageBox.error("Failed to save usage decision: " + (oError.message || "Unknown error"));
                    console.error(oError);
                }
            );
        },

        onCancelDecision: function () { this.byId("usageDecisionDialog").close(); },

        /* =========================================================== */
        /* NAVIGATION                                                   */
        /* =========================================================== */

        onNavBack: function () {
            sap.ui.core.UIComponent.getRouterFor(this).navTo("ResultRecord");
        },

        /* =========================================================== */
        /* FORMATTERS                                                   */
        /* =========================================================== */

        formatDecisionStatus: function (sInspLot) {
            if (!sInspLot) { return "Pending"; }
            var sKey = String(sInspLot).trim();
            var s    = this._oDecidedLots[sKey] || this._oDecidedLots[String(parseInt(sKey, 10))];
            return !s ? "Pending" : s === "APPROVED" ? "Approved" : "Rejected";
        },
        formatDecisionStatusState: function (sInspLot) {
            if (!sInspLot) { return "Warning"; }
            var sKey = String(sInspLot).trim();
            var s    = this._oDecidedLots[sKey] || this._oDecidedLots[String(parseInt(sKey, 10))];
            return !s ? "Warning" : s === "APPROVED" ? "Success" : "Error";
        },
        // Returns true only for SAFETY_MANAGER — controls Approve/Reject button visibility
        formatDecisionButtonVisible: function (sRole) {
            return (sRole || "").toUpperCase() === "SAFETY_MANAGER";
        },
        formatActionButtonText: function (sInspLot) {
            // Non-managers always see "View" (read-only dialog)
            if (!this._isSafetyManager()) { return "View"; }
            if (!sInspLot) { return "Decide"; }
            var sKey = String(sInspLot).trim();
            return (this._oDecidedLots[sKey] || this._oDecidedLots[String(parseInt(sKey, 10))]) ? "View" : "Decide";
        },
        formatActionButtonIcon: function (sInspLot) {
            if (!sInspLot) { return "sap-icon://decision"; }
            var sKey = String(sInspLot).trim();
            var s    = this._oDecidedLots[sKey] || this._oDecidedLots[String(parseInt(sKey, 10))];
            if (s === "APPROVED") { return "sap-icon://accept"; }
            if (s === "REJECTED") { return "sap-icon://decline"; }
            return this._isSafetyManager() ? "sap-icon://decision" : "sap-icon://display";
        },
        formatActionButtonEnabled: function (sInspLot) {
            // Always enabled — view is available to everyone; role enforcement is in onActionPress
            return true;
        },
        // Returns true for non-managers (CONSULTANT / ENGINEER) — shows the read-only banner
        formatReadOnlyBannerVisible: function (sRole) {
            return (sRole || "").toUpperCase() !== "SAFETY_MANAGER";
        },
        formatDate: function (vDate) {
            if (!vDate) { return "\u2014"; }
            try { return (vDate instanceof Date ? vDate : new Date(vDate)).toLocaleDateString(); }
            catch (e) { return String(vDate); }
        }
    });
});