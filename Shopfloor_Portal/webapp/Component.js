sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/ui/Device",
    "shopfloor/portal/model/models"
], function (UIComponent, Device, models) {
    "use strict";

    return UIComponent.extend("shopfloor.portal.Component", {

        metadata: {
            manifest: "json"
        },

        init: function () {
            // call the base component's init function
            UIComponent.prototype.init.apply(this, arguments);

            // enable routing
            this.getRouter().initialize();

            // set the device model
            this.setModel(models.createDeviceModel(), "device");

            // Restore user session from localStorage if available
            var oUserModel = this.getModel("userModel");
            if (oUserModel) {
                var sUserJson = localStorage.getItem("shopfloor_user");
                if (sUserJson) {
                    try {
                        oUserModel.setData(JSON.parse(sUserJson));
                    } catch (e) {
                        console.error("Failed to restore user session:", e);
                    }
                }
            }
        },

        getContentDensityClass : function() {
            if (!this._sContentDensityClass) {
                if (!sap.ui.Device.support.touch) {
                    this._sContentDensityClass = "sapUiSizeCompact";
                } else {
                    this._sContentDensityClass = "sapUiSizeCozy";
                }
            }
            return this._sContentDensityClass;
        }
    });
});
