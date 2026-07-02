sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/core/routing/History",
    "sap/ui/model/Sorter"
], function (Controller, Filter, FilterOperator, History, Sorter) {
    "use strict";

    return Controller.extend("shopfloor.portal.controller.ProductionOrders", {
        onInit: function () {
            this.getOwnerComponent().getRouter().getRoute("productionOrders").attachPatternMatched(this._onRouteMatched, this);
        },

        _onRouteMatched: function () {
            var oUserModel = this.getOwnerComponent().getModel("userModel");
            var sMode = oUserModel.getProperty("/productionFilterMode");
            var sDefaultYear = oUserModel.getProperty("/productionDefaultYear") || new Date().getFullYear().toString();
            var sDefaultMonth = oUserModel.getProperty("/productionDefaultMonth") || new Date().getMonth().toString();
            
            var oView = this.getView();
            
            // Ensure BOTH month and year filters are always visible and interactive
            oView.byId("monthFilter").setVisible(true);
            oView.byId("yearFilter").setVisible(true);
            
            if (sMode === "MTD") {
                // Month wise - preselect dynamic smart year and month
                oView.byId("monthFilter").setSelectedKey(sDefaultMonth);
                oView.byId("yearFilter").setSelectedKey(sDefaultYear);
                oView.byId("productionOrdersPage").setTitle("Production Orders - Month Wise");
            } else if (sMode === "YTD") {
                // Year wise - preselect dynamic smart year, show all months
                oView.byId("monthFilter").setSelectedKey("");
                oView.byId("yearFilter").setSelectedKey(sDefaultYear);
                oView.byId("productionOrdersPage").setTitle("Production Orders - Year Wise");
            } else {
                // Default - Display all data
                oView.byId("monthFilter").setSelectedKey("");
                oView.byId("yearFilter").setSelectedKey("");
                oView.byId("productionOrdersPage").setTitle("Production Orders");
            }
            
            // Clear the filter mode so subsequent visits are neutral unless clicked from a tile
            oUserModel.setProperty("/productionFilterMode", null);

            this._applyFilters();
        },

        onSearch: function (oEvent) {
            this._applyFilters();
        },

        onFilterChange: function () {
            this._applyFilters();
        },

        _applyFilters: function () {
            var oView = this.getView();
            var sQuery = oView.byId("searchField").getValue();
            var sMonth = oView.byId("monthFilter").getSelectedKey();
            var sYear = oView.byId("yearFilter").getSelectedKey();
            var sSortBy = oView.byId("sortBy").getSelectedKey();
            var sSortOrder = oView.byId("sortOrder").getSelectedKey();
            
            var aFilters = [];

            // Search Filter - Convert to uppercase as SAP Material Numbers are usually uppercase
            if (sQuery) {
                sQuery = sQuery.toUpperCase();
                aFilters.push(new Filter({
                    filters: [
                        new Filter("Aufnr", FilterOperator.Contains, sQuery),
                        new Filter("Matnr", FilterOperator.Contains, sQuery)
                    ],
                    and: false
                }));
            }

            // Date Filters
            // Default to current year if month is selected but year is not
            if (!sYear && sMonth) {
                sYear = new Date().getFullYear().toString();
            }

            if (sYear) {
                var oStartDate, oEndDate;
                if (sMonth) {
                    oStartDate = new Date(sYear, sMonth, 1);
                    oEndDate = new Date(sYear, parseInt(sMonth) + 1, 0, 23, 59, 59);
                } else {
                    oStartDate = new Date(sYear, 0, 1);
                    oEndDate = new Date(sYear, 11, 31, 23, 59, 59);
                }
                aFilters.push(new Filter("Gstrp", FilterOperator.BT, oStartDate, oEndDate));
            }

            var oTable = oView.byId("productionOrdersTable");
            var oBinding = oTable.getBinding("items");
            
            // Apply Filters
            oBinding.filter(aFilters);

            // Apply Sorting
            if (sSortBy) {
                var bDescending = (sSortOrder === "desc");
                var oSorter = new Sorter(sSortBy, bDescending);
                oBinding.sort(oSorter);
            }
        },

        onNavBack: function () {
            var oHistory = History.getInstance();
            var sPreviousHash = oHistory.getPreviousHash();

            if (sPreviousHash !== undefined) {
                window.history.go(-1);
            } else {
                this.getOwnerComponent().getRouter().navTo("dashboard", {}, true);
            }
        },

        onNavHome: function () {
            this.getOwnerComponent().getRouter().navTo("dashboard");
        }
    });
});
