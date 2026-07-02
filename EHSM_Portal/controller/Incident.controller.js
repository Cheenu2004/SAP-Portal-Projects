sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Sorter",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageToast"
], function (Controller, JSONModel, Sorter, Filter, FilterOperator, MessageToast) {
    "use strict";

    return Controller.extend("ehsmportal.controller.Incident", {

        _sSearch: "",
        _sCategoryFilter: "",
        _sStatusFilter: "",

        onInit: function () {

            this._oViewModel = new JSONModel({
                incidents: [],
                busy: false,
                categories: [{
                    key: "",
                    text: "All Categories"
                }],
                statuses: [{
                    key: "",
                    text: "All Status"
                }]
            });

            this.getView().setModel(this._oViewModel, "viewModel");

            var oODataModel = this.getOwnerComponent().getModel();

            oODataModel.metadataLoaded()
                .then(function () {

                    this.getOwnerComponent()
                        .getRouter()
                        .getRoute("incident")
                        .attachPatternMatched(
                            this._onRouteMatched,
                            this
                        );

                }.bind(this))
                .catch(function () {

                    MessageToast.show(
                        "OData service unavailable. Check backend."
                    );

                });

        },

        _onRouteMatched: function () {

            this._sSearch = "";
            this._sCategoryFilter = "";
            this._sStatusFilter = "";

            var oSearch = this.byId("incidentSearch");
            if (oSearch) {
                oSearch.setValue("");
            }

            var oCategory = this.byId("categoryFilter");
            if (oCategory) {
                oCategory.setSelectedKey("");
            }

            var oStatus = this.byId("statusFilter");
            if (oStatus) {
                oStatus.setSelectedKey("");
            }

            this._loadIncidentData();

        },

        _loadIncidentData: function () {

            var oODataModel = this.getView().getModel();

            this._oViewModel.setProperty("/busy", true);

            oODataModel.read("/IncidentSet", {

                success: function (oData) {

                    this._oViewModel.setProperty(
                        "/incidents",
                        oData.results
                    );

                    this._oViewModel.setProperty(
                        "/busy",
                        false
                    );

                    // CategoryDesc dropdown
                    var aCategories = oData.results
                        .map(function (r) {
                            return r.CategoryDesc;
                        })
                        .filter(function (v, i, a) {
                            return v && a.indexOf(v) === i;
                        })
                        .sort();

                    this._oViewModel.setProperty(
                        "/categories",
                        [{
                            key: "",
                            text: "All Categories"
                        }].concat(
                            aCategories.map(function (c) {
                                return {
                                    key: c,
                                    text: c
                                };
                            })
                        )
                    );

                    // StatusDesc dropdown
                    var aStatuses = oData.results
                        .map(function (r) {
                            return r.StatusDesc;
                        })
                        .filter(function (v, i, a) {
                            return v && a.indexOf(v) === i;
                        })
                        .sort();

                    this._oViewModel.setProperty(
                        "/statuses",
                        [{
                            key: "",
                            text: "All Status"
                        }].concat(
                            aStatuses.map(function (s) {
                                return {
                                    key: s,
                                    text: s
                                };
                            })
                        )
                    );

                    if (
                        !oData.results ||
                        oData.results.length === 0
                    ) {

                        MessageToast.show(
                            "No incident records found."
                        );

                    }

                }.bind(this),

                error: function (oError) {

                    this._oViewModel.setProperty(
                        "/busy",
                        false
                    );

                    var sMessage =
                        "Failed to load incident data.";

                    try {

                        var oResponse =
                            JSON.parse(
                                oError.responseText
                            );

                        sMessage =
                            oResponse.error.message.value ||
                            sMessage;

                    } catch (e) {}

                    MessageToast.show(sMessage);

                }.bind(this)

            });

        },

        _applyFilters: function () {

            var oBinding =
                this.byId("incidentTable")
                    .getBinding("items");

            var aFilters = [];

            if (this._sSearch) {

                aFilters.push(

                    new Filter({

                        filters: [

                            new Filter(
                                "Id",
                                FilterOperator.Contains,
                                this._sSearch
                            ),

                            new Filter(
                                "CategoryDesc",
                                FilterOperator.Contains,
                                this._sSearch
                            ),

                            new Filter(
                                "StatusDesc",
                                FilterOperator.Contains,
                                this._sSearch
                            ),

                            new Filter(
                                "UserIdCr",
                                FilterOperator.Contains,
                                this._sSearch
                            )

                        ],

                        and: false

                    })

                );

            }

            if (this._sCategoryFilter) {

                aFilters.push(

                    new Filter(
                        "CategoryDesc",
                        FilterOperator.EQ,
                        this._sCategoryFilter
                    )

                );

            }

            if (this._sStatusFilter) {

                aFilters.push(

                    new Filter(
                        "StatusDesc",
                        FilterOperator.EQ,
                        this._sStatusFilter
                    )

                );

            }

            if (aFilters.length > 0) {

                oBinding.filter(

                    new Filter({
                        filters: aFilters,
                        and: true
                    })

                );

            } else {

                oBinding.filter([]);

            }

        },

        onIncidentSearch: function (oEvent) {

            this._sSearch =
                oEvent.getSource()
                    .getValue()
                    .trim();

            this._applyFilters();

        },

        onCategoryFilter: function (oEvent) {

            this._sCategoryFilter =
                oEvent.getParameter(
                    "selectedItem"
                ).getKey();

            this._applyFilters();

        },

        onStatusFilter: function (oEvent) {

            this._sStatusFilter =
                oEvent.getParameter(
                    "selectedItem"
                ).getKey();

            this._applyFilters();

        },

        onNavBack: function () {

            this.getOwnerComponent()
                .getRouter()
                .navTo("dashboard");

        },

        onSortAsc: function () {

            this.byId("incidentTable")
                .getBinding("items")
                .sort(
                    new Sorter(
                        "Id",
                        false
                    )
                );

        },

        onSortDesc: function () {

            this.byId("incidentTable")
                .getBinding("items")
                .sort(
                    new Sorter(
                        "Id",
                        true
                    )
                );

        },

        formatDatetime: function (sValue) {

            if (!sValue) {
                return "";
            }

            var s =
                sValue.toString()
                    .split(".")[0];

            if (s.length >= 14) {

                return s.substr(0, 4) + "-" +
                    s.substr(4, 2) + "-" +
                    s.substr(6, 2) + " " +
                    s.substr(8, 2) + ":" +
                    s.substr(10, 2) + ":" +
                    s.substr(12, 2);

            }

            return sValue;

        }

    });

});