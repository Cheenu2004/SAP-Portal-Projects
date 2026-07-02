sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/ui/model/json/JSONModel"
], function (UIComponent, JSONModel) {
    "use strict";

    /**
     * Component.js
     *
     * All OData models are declared in manifest.json with preload:false.
     * This means they exist immediately when any controller calls
     * getOwnerComponent().getModel("resultModel") etc., but they do NOT
     * fire $metadata requests until the first read/create call.
     *
     * Only appState (pure JSON, no backend) is created here.
     */
    return UIComponent.extend("qmportal1.Component", {

        metadata: {
            manifest: "json"
        },

        init: function () {
            UIComponent.prototype.init.apply(this, arguments);

            // appState — in-memory session state, shared across all pages
            this.setModel(new JSONModel({
                selectedLot: {
                    wf_insp_lot      : "",
                    wf_material      : "",
                    wf_material_desc : "",
                    wf_plant         : "",
                    wf_batch         : "",
                    wf_quantity      : 0,
                    wf_insp_type     : "",
                    wf_ud_status     : "",
                    inspectedQty     : 0,
                    resultRecorded   : false,
                    usageDecision    : "",
                    usageRemarks     : ""
                },
                loggedInUser : "",
                role         : ""       // SAFETY_MANAGER | CONSULTANT | ENGINEER
            }), "appState");

            this.getRouter().initialize();
        }

    });
});