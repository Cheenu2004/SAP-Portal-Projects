sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], function (Controller, JSONModel, MessageToast, MessageBox) {
    "use strict";

    return Controller.extend("shopfloor.portal.controller.Dashboard", {
        onInit: function () {
            var oDashboardModel = new JSONModel({
                PlannedOrdersMTD: 0,
                PlannedOrdersYTD: 0,
                ProductionOrdersMTD: 0,
                ProductionOrdersYTD: 0
            });
            this.getView().setModel(oDashboardModel, "dashboardModel");

            this.getOwnerComponent().getRouter().getRoute("dashboard").attachPatternMatched(this._onRouteMatched, this);
        },

        _onRouteMatched: function () {
            this._fetchDashboardData();
            // MessageToast.show("Welcome back!"); // Optional
        },

        _parseDate: function (vDate) {
            if (!vDate) return null;
            if (vDate instanceof Date) return vDate;
            if (typeof vDate === "string") {
                var match = /\/Date\((\d+)\)\//.exec(vDate);
                if (match) {
                    return new Date(parseInt(match[1], 10));
                }
                var oDate = new Date(vDate);
                if (!isNaN(oDate.getTime())) {
                    return oDate;
                }
            }
            if (typeof vDate === "number") {
                return new Date(vDate);
            }
            return null;
        },

        _getLatestYearAndMonth: function (aItems, sDateProp) {
            var iLatestYear = -1;
            var iLatestMonth = -1;
            
            aItems.forEach(function (item) {
                var oDate = this._parseDate(item[sDateProp]);
                if (oDate) {
                    var iYear = oDate.getFullYear();
                    var iMonth = oDate.getMonth();
                    if (iYear > iLatestYear) {
                        iLatestYear = iYear;
                        iLatestMonth = iMonth;
                    } else if (iYear === iLatestYear) {
                        if (iMonth > iLatestMonth) {
                            iLatestMonth = iMonth;
                        }
                    }
                }
            }.bind(this));
            
            return {
                year: iLatestYear !== -1 ? iLatestYear : new Date().getFullYear(),
                month: iLatestMonth !== -1 ? iLatestMonth : new Date().getMonth()
            };
        },

        _fetchDashboardData: function () {
            var oModel = this.getOwnerComponent().getModel();
            var oDashboardModel = this.getView().getModel("dashboardModel");
            var oUserModel = this.getOwnerComponent().getModel("userModel");

            sap.ui.core.BusyIndicator.show(0);

            console.log("Fetching Planned Orders...");
            oModel.read("/PlannedOrderSet", {
                success: function (oData) {
                    console.log("Planned Orders Received:", oData.results.length);
                    var aPlannedOrders = oData.results;
                    
                    // Determine smart year/month from dynamic data (defaults to April 2026 if present)
                    var oLatest = this._getLatestYearAndMonth(aPlannedOrders, "Psttr");
                    var iCurrentYear = oLatest.year;
                    var iCurrentMonth = oLatest.month;

                    // Save defaults in userModel for table pre-selection
                    oUserModel.setProperty("/plannedDefaultYear", iCurrentYear.toString());
                    oUserModel.setProperty("/plannedDefaultMonth", iCurrentMonth.toString());

                    var iMTD = 0, iYTD = 0;
                    aPlannedOrders.forEach(function (order) {
                        var oDate = this._parseDate(order.Psttr);
                        if (oDate) {
                            if (oDate.getFullYear() === iCurrentYear) {
                                iYTD++;
                                if (oDate.getMonth() === iCurrentMonth) {
                                    iMTD++;
                                }
                            }
                        }
                    }.bind(this));

                    console.log("Planned Counts - MTD:", iMTD, "YTD:", iYTD);
                    oDashboardModel.setProperty("/PlannedOrdersMTD", iMTD);
                    oDashboardModel.setProperty("/PlannedOrdersYTD", iYTD); 
                    this._checkLoadingFinished();
                }.bind(this),
                error: function (oError) {
                    console.error("Error fetching Planned Orders:", oError);
                    this._checkLoadingFinished();
                }.bind(this)
            });

            console.log("Fetching Production Orders...");
            oModel.read("/ProductionOrderSet", {
                success: function (oData) {
                    console.log("Production Orders Received:", oData.results.length);
                    var aProdOrders = oData.results;
                    
                    // Determine smart year/month from dynamic data (defaults to Sept 2025 if present)
                    var oLatest = this._getLatestYearAndMonth(aProdOrders, "Gstrp");
                    var iCurrentYear = oLatest.year;
                    var iCurrentMonth = oLatest.month;

                    // Save defaults in userModel for table pre-selection
                    oUserModel.setProperty("/productionDefaultYear", iCurrentYear.toString());
                    oUserModel.setProperty("/productionDefaultMonth", iCurrentMonth.toString());

                    var iMTD = 0, iYTD = 0;
                    aProdOrders.forEach(function (order) {
                        var oDate = this._parseDate(order.Gstrp);
                        if (oDate) {
                            if (oDate.getFullYear() === iCurrentYear) {
                                iYTD++;
                                if (oDate.getMonth() === iCurrentMonth) {
                                    iMTD++;
                                }
                            }
                        }
                    }.bind(this));

                    console.log("Production Counts - MTD:", iMTD, "YTD:", iYTD);
                    oDashboardModel.setProperty("/ProductionOrdersMTD", iMTD);
                    oDashboardModel.setProperty("/ProductionOrdersYTD", iYTD);
                    this._checkLoadingFinished();
                }.bind(this),
                error: function (oError) {
                    console.error("Error fetching Production Orders:", oError);
                    this._checkLoadingFinished();
                }.bind(this)
            });
        },

        _pendingRequests: 2,
        _checkLoadingFinished: function () {
            this._pendingRequests--;
            if (this._pendingRequests <= 0) {
                sap.ui.core.BusyIndicator.hide();
                this._pendingRequests = 2;
            }
        },

        onPlannedOrdersMTDPress: function () {
            var oUserModel = this.getOwnerComponent().getModel("userModel");
            oUserModel.setProperty("/plannedFilterMode", "MTD");
            oUserModel.setProperty("/productionFilterMode", "");
            this.getOwnerComponent().getRouter().navTo("plannedOrders");
        },

        onPlannedOrdersYTDPress: function () {
            var oUserModel = this.getOwnerComponent().getModel("userModel");
            oUserModel.setProperty("/plannedFilterMode", "YTD");
            oUserModel.setProperty("/productionFilterMode", "");
            this.getOwnerComponent().getRouter().navTo("plannedOrders");
        },

        onProductionOrdersMTDPress: function () {
            var oUserModel = this.getOwnerComponent().getModel("userModel");
            oUserModel.setProperty("/productionFilterMode", "MTD");
            oUserModel.setProperty("/plannedFilterMode", "");
            this.getOwnerComponent().getRouter().navTo("productionOrders");
        },

        onProductionOrdersYTDPress: function () {
            var oUserModel = this.getOwnerComponent().getModel("userModel");
            oUserModel.setProperty("/productionFilterMode", "YTD");
            oUserModel.setProperty("/plannedFilterMode", "");
            this.getOwnerComponent().getRouter().navTo("productionOrders");
        },

        onLogout: function () {
            MessageBox.confirm("Are you sure you want to logout?", {
                title: "Confirm Logout",
                onClose: function (sAction) {
                    if (sAction === MessageBox.Action.OK) {
                        localStorage.removeItem("shopfloor_user");
                        var oUserModel = this.getOwnerComponent().getModel("userModel");
                        oUserModel.setData({});
                        this.getOwnerComponent().getRouter().navTo("login");
                    }
                }.bind(this)
            });
        }
    });
});
