sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/Sorter",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/Dialog",
    "sap/m/Button",
    "sap/m/Label",
    "sap/m/Text",
    "sap/m/ObjectStatus",
    "sap/ui/layout/form/SimpleForm"
], function (
    Controller,
    Filter,
    FilterOperator,
    Sorter,
    JSONModel,
    MessageToast,
    Dialog,
    Button,
    Label,
    Text,
    ObjectStatus,
    SimpleForm
) {
    "use strict";

    return Controller.extend("qmportal1.controller.InspectionLot", {

        /* =========================================================== */
        /* LIFECYCLE                                                    */
        /* =========================================================== */

        onInit: function () {

            this._oDetailDialog = null;
            this._sSearchValue  = "";
            this._bSortDesc     = false;

            // Pre-initialise filterModel with empty arrays so MultiComboBox
            // bindings are ready BEFORE data loads (avoids binding errors)
            var oEmptyFilterModel = new JSONModel({
                inspLots     : [],
                materials    : [],
                descriptions : [],
                plants       : [],
                inspTypes    : [],
                batches      : [],
                quantities   : [],
                statuses     : []
            });
            this.getView().setModel(oEmptyFilterModel, "filterModel");

            // Load filter dropdown values after the view is shown
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
        /* FILTER VALUE LOADER                                         */
        /* Reads YOUR backend (inspectionModel / ZQM_INSPECTION_CDS_902065)
           and builds the MultiComboBox dropdown lists dynamically.    */
        /* =========================================================== */

        _loadFilterValues: function () {

            // YOUR model and entity set — unchanged
            var oModel = this.getOwnerComponent().getModel("inspectionModel");
            var that   = this;

            if (!oModel) {
                MessageToast.show("inspectionModel not available");
                return;
            }

            oModel.read("/ZQM_INSPECTION_CDS_902065", {

                success: function (oData) {

                    var aResults =
                        (oData && oData.results)
                            ? oData.results
                            : (oData && oData.d && oData.d.results)
                                ? oData.d.results
                                : [];

                    // Build unique sorted value lists for each filter column
                    // Uses YOUR wf_ field names throughout
                    function getUnique(sField) {
                        var oMap    = {};
                        var aValues = [];
                        aResults.forEach(function (oItem) {
                            var vVal = oItem[sField];
                            if (
                                vVal !== null &&
                                vVal !== undefined &&
                                vVal !== "" &&
                                !oMap[vVal]
                            ) {
                                oMap[vVal] = true;
                                aValues.push({
                                    key : String(vVal),
                                    text: String(vVal)
                                });
                            }
                        });
                        return aValues.sort(function (a, b) {
                            return a.text.localeCompare(b.text);
                        });
                    }

                    var oFilterData = {
                        inspLots     : getUnique("wf_insp_lot"),
                        materials    : getUnique("wf_material"),
                        descriptions : getUnique("wf_material_desc"),
                        plants       : getUnique("wf_plant"),
                        inspTypes    : getUnique("wf_insp_type"),
                        batches      : getUnique("wf_batch"),
                        quantities   : getUnique("wf_quantity"),
                        statuses     : getUnique("wf_ud_status")
                    };

                    // Update existing filterModel (keeps bindings alive)
                    var oFilterModel = that.getView().getModel("filterModel");
                    oFilterModel.setData(oFilterData);
                    oFilterModel.refresh(true);

                    // Apply any already-selected filters
                    that._applyAllFilters();

                    MessageToast.show(
                        "Loaded " + aResults.length + " inspection lots"
                    );
                },

                error: function () {
                    MessageToast.show("Failed to load filter values");
                }
            });
        },

        /* =========================================================== */
        /* ROW PRESS — stores full lot object in appState              */
        /* =========================================================== */

        onLotPress: function (oEvent) {

            var oCtx = oEvent.getSource()
                .getBindingContext("inspectionModel");

            if (!oCtx) { return; }

            var oLotData = oCtx.getObject();

            var oAppState = this.getOwnerComponent().getModel("appState");

            if (!oAppState) {
                oAppState = new JSONModel({
                    selectedLot  : {},
                    loggedInUser : ""
                });
                this.getOwnerComponent().setModel(oAppState, "appState");
            }

            // Store the FULL lot object so ResultRecord can read all wf_ fields
            oAppState.setProperty("/selectedLot", {
                wf_insp_lot      : oLotData.wf_insp_lot      || "",
                wf_material      : oLotData.wf_material      || "",
                wf_material_desc : oLotData.wf_material_desc || "",
                wf_plant         : oLotData.wf_plant         || "",
                wf_batch         : oLotData.wf_batch         || "",
                wf_quantity      : oLotData.wf_quantity      || 0,
                wf_insp_type     : oLotData.wf_insp_type     || "",
                wf_ud_status     : oLotData.wf_ud_status     || "",
                // Reset downstream flags every time a new lot is selected
                resultRecorded   : false,
                usageDecision    : "",
                usageRemarks     : ""
            });

            this.getOwnerComponent()
                .getRouter()
                .navTo("ResultRecord");
        },

        /* =========================================================== */
        /* SEARCH & FILTERS                                            */
        /* =========================================================== */

        onSearch: function (oEvent) {
            this._sSearchValue = oEvent.getParameter("newValue") || "";
            this._applyAllFilters();
        },

        onFilterChange: function () {
            this._applyAllFilters();
        },

        onApplyFilters: function () {
            this._applyAllFilters();
            MessageToast.show("Filters Applied");
        },

        onClearFilters: function () {

            this._sSearchValue = "";

            var oSearchField = this.byId("il_searchField");
            if (oSearchField) { oSearchField.setValue(""); }

            // Clear all MultiComboBox selections
            var aComboIds = [
                "il_filterInspLot",
                "il_filterMaterial",
                "il_filterMaterialDesc",
                "il_filterPlant",
                "il_filterInspType",
                "il_filterBatch",
                "il_filterQuantity",
                "il_filterStatus"
            ];

            aComboIds.forEach(function (sId) {
                var oCombo = this.byId(sId);
                if (oCombo) { oCombo.removeAllSelectedItems(); }
            }, this);

            this._applyAllFilters();
            MessageToast.show("Filters Cleared");
        },

        _applyAllFilters: function () {

            var aAllFilters = [];

            // --- Search filter (OR across all text columns) ---
            if (this._sSearchValue && this._sSearchValue.trim() !== "") {
                aAllFilters.push(
                    new Filter({
                        filters: [
                            new Filter("wf_insp_lot",      FilterOperator.Contains, this._sSearchValue),
                            new Filter("wf_material",      FilterOperator.Contains, this._sSearchValue),
                            new Filter("wf_material_desc", FilterOperator.Contains, this._sSearchValue),
                            new Filter("wf_plant",         FilterOperator.Contains, this._sSearchValue),
                            new Filter("wf_insp_type",     FilterOperator.Contains, this._sSearchValue),
                            new Filter("wf_batch",         FilterOperator.Contains, this._sSearchValue),
                            new Filter("wf_ud_status",     FilterOperator.Contains, this._sSearchValue)
                        ],
                        and: false
                    })
                );
            }

            // --- Column MultiComboBox filters (AND between columns, OR within) ---
            var aColumnFilters = this._getColumnFilters();
            aAllFilters = aAllFilters.concat(aColumnFilters);

            var oBinding = this.byId("il_inspectionTable").getBinding("items");
            if (oBinding) {
                oBinding.filter(aAllFilters);
            }
        },

        _getColumnFilters: function () {

            var aFilters = [];
            var that     = this;

            function addMultiFilter(sComboId, sField) {
                var oCombo = that.byId(sComboId);
                if (!oCombo) { return; }
                var aKeys = oCombo.getSelectedKeys();
                if (aKeys && aKeys.length > 0) {
                    var aFieldFilters = aKeys.map(function (sKey) {
                        return new Filter(sField, FilterOperator.EQ, sKey);
                    });
                    aFilters.push(new Filter({ filters: aFieldFilters, and: false }));
                }
            }

            addMultiFilter("il_filterInspLot",      "wf_insp_lot");
            addMultiFilter("il_filterMaterial",      "wf_material");
            addMultiFilter("il_filterMaterialDesc",  "wf_material_desc");
            addMultiFilter("il_filterPlant",         "wf_plant");
            addMultiFilter("il_filterInspType",      "wf_insp_type");
            addMultiFilter("il_filterBatch",         "wf_batch");
            addMultiFilter("il_filterQuantity",      "wf_quantity");
            addMultiFilter("il_filterStatus",        "wf_ud_status");

            return aFilters;
        },

        /* =========================================================== */
        /* SORT & REFRESH                                              */
        /* =========================================================== */

        onSort: function () {
            var oTable   = this.byId("il_inspectionTable");
            var oBinding = oTable.getBinding("items");
            if (oBinding) {
                this._bSortDesc = !this._bSortDesc;
                oBinding.sort(new Sorter("wf_insp_lot", this._bSortDesc));
                var sDir = this._bSortDesc ? "Descending" : "Ascending";
                MessageToast.show("Sorted by Inspection Lot (" + sDir + ")");
            }
        },

        onRefresh: function () {
            var oTable   = this.byId("il_inspectionTable");
            var oBinding = oTable.getBinding("items");
            if (oBinding) {
                oBinding.refresh(true);
                this._loadFilterValues();
                MessageToast.show("Data Refreshed");
            }
        },

        /* =========================================================== */
        /* TABLE COUNT                                                 */
        /* =========================================================== */

        onTableUpdateFinished: function (oEvent) {
            var iTotal = oEvent.getParameter("total");
            this.byId("il_itemCountText").setText(
                iTotal + (iTotal === 1 ? " item" : " items")
            );
        },

        /* =========================================================== */
        /* DETAIL DIALOG                                               */
        /* =========================================================== */

        onDetailPress: function (oEvent) {
            var oCtx = oEvent.getSource()
                .getParent()
                .getBindingContext("inspectionModel");
            if (!oCtx) { return; }
            this._openDetailDialog(oCtx.getObject());
        },

        _openDetailDialog: function (oData) {
            if (!this._oDetailModel) {
                this._oDetailModel = new sap.ui.model.json.JSONModel();
                this.getView().setModel(this._oDetailModel, "detailModel");
            }
            this._oDetailModel.setData({
                InspLot: oData.wf_insp_lot,
                Material: oData.wf_material,
                MaterialDesc: oData.wf_material_desc,
                Plant: oData.wf_plant,
                Quantity: oData.wf_quantity,
                InspType: oData.wf_insp_type,
                Batch: oData.wf_batch,
                UDStatus: oData.wf_ud_status
            });
            this.byId("detailsDialog").open();
        },

        onCloseDetailDialog: function () {
            this.byId("detailsDialog").close();
        },

        /* =========================================================== */
        /* NAVIGATION                                                  */
        /* =========================================================== */

        onNavBack: function () {
            this.getOwnerComponent()
                .getRouter()
                .navTo("Dashboard");
        },

        /* =========================================================== */
        /* FORMATTER                                                   */
        /* =========================================================== */

        formatStatus: function (sStatus) {
            switch ((sStatus || "").toUpperCase()) {
                case "APPROVED": return "Success";
                case "REJECTED": return "Error";
                case "PENDING":  return "Warning";
                default:         return "None";
            }
        }

    });

});