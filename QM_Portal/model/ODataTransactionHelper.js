sap.ui.define([], function () {
    "use strict";

    /**
     * ODataTransactionHelper
     *
     * Direct jQuery.ajax wrapper for the ZQM_TRANS_902065_SRV service.
     *
     * WHY: The SEGW service metadata has sap:creatable="false" and
     *      sap:addressable="false" on both EntitySets. UI5 ODataModel v2
     *      honours these annotations and silently blocks create() and
     *      single-entity read() calls.  The ABAP DPC_EXT class DOES
     *      implement the methods, so we bypass the UI5 model and call
     *      the service directly via jQuery.ajax.
     *
     * CSRF handling: We fetch the token via a GET with X-CSRF-Token:Fetch,
     *      cache it, and auto-retry on 403 (expired token).
     */

    var BASE = "/sap/opu/odata/sap/ZQM_TRANS_902065_SRV";
    var _sCsrfToken = null;

    /* ─── private: fetch CSRF token ─── */
    function _fetchToken() {
        return new Promise(function (resolve) {
            if (_sCsrfToken) {
                resolve(_sCsrfToken);
                return;
            }
            jQuery.ajax({
                url    : BASE + "/",
                method : "GET",
                headers: {
                    "X-CSRF-Token": "Fetch",
                    "Accept"      : "application/json"
                },
                success: function (_data, _status, jqXHR) {
                    _sCsrfToken = jqXHR.getResponseHeader("X-CSRF-Token") || "";
                    console.log("[TransHelper] CSRF token obtained: " + (_sCsrfToken ? "yes" : "no"));
                    resolve(_sCsrfToken);
                },
                error: function (jqXHR) {
                    console.warn("[TransHelper] CSRF fetch failed:", jqXHR.status, jqXHR.statusText);
                    resolve("");
                }
            });
        });
    }

    /* ─── private: invalidate cached token ─── */
    function _clearToken() {
        _sCsrfToken = null;
    }

    /* ─── private: POST with auto-retry on 403 (token expired) ─── */
    function _doPost(sEntitySet, oPayload, bRetried) {
        return _fetchToken().then(function (sToken) {
            return new Promise(function (resolve, reject) {
                console.log("[TransHelper] POST /" + sEntitySet, JSON.stringify(oPayload));
                jQuery.ajax({
                    url        : BASE + "/" + sEntitySet,
                    method     : "POST",
                    contentType: "application/json",
                    data       : JSON.stringify(oPayload),
                    headers    : {
                        "X-CSRF-Token": sToken,
                        "Accept"      : "application/json"
                    },
                    success: function (oData, _textStatus, jqXHR) {
                        console.log("[TransHelper] POST success:", jqXHR.status);
                        resolve(oData && oData.d ? oData.d : oData);
                    },
                    error: function (jqXHR) {
                        console.error("[TransHelper] POST error:", jqXHR.status, jqXHR.responseText);
                        // If 403 and we haven't retried, token may have expired
                        if (jqXHR.status === 403 && !bRetried) {
                            console.log("[TransHelper] 403 — retrying with fresh token");
                            _clearToken();
                            _doPost(sEntitySet, oPayload, true)
                                .then(resolve, reject);
                            return;
                        }
                        var sMsg = "";
                        try {
                            var oErr = JSON.parse(jqXHR.responseText);
                            sMsg = oErr.error.message.value;
                        } catch (e) {
                            sMsg = jqXHR.responseText
                                ? jqXHR.responseText.substring(0, 200)
                                : (jqXHR.statusText || "HTTP " + jqXHR.status);
                        }
                        reject({
                            statusCode: jqXHR.status,
                            message   : sMsg,
                            raw       : jqXHR
                        });
                    }
                });
            });
        });
    }

    return {

        /* ─── CREATE (POST) ─── */
        create: function (sEntitySet, oPayload) {
            return _doPost(sEntitySet, oPayload, false);
        },

        /* ─── READ by Key (GET) ─── */
        readByKey: function (sEntitySet, sKey) {
            return new Promise(function (resolve, reject) {
                jQuery.ajax({
                    url    : BASE + "/" + sEntitySet + "('" + encodeURIComponent(sKey) + "')",
                    method : "GET",
                    headers: { "Accept": "application/json" },
                    success: function (oData) {
                        resolve(oData && oData.d ? oData.d : oData);
                    },
                    error: function (jqXHR) {
                        reject({
                            statusCode: jqXHR.status,
                            message   : jqXHR.statusText,
                            raw       : jqXHR
                        });
                    }
                });
            });
        },

        /* ─── READ collection with optional $filter (GET) ─── */
        readSet: function (sEntitySet, sFilter) {
            var sUrl = BASE + "/" + sEntitySet;
            if (sFilter) {
                sUrl += "?$filter=" + encodeURIComponent(sFilter);
            }
            return new Promise(function (resolve, reject) {
                jQuery.ajax({
                    url    : sUrl,
                    method : "GET",
                    headers: { "Accept": "application/json" },
                    success: function (oData) {
                        var aResults = (oData && oData.d && oData.d.results)
                            ? oData.d.results : [];
                        resolve(aResults);
                    },
                    error: function (jqXHR) {
                        reject({
                            statusCode: jqXHR.status,
                            message   : jqXHR.statusText,
                            raw       : jqXHR
                        });
                    }
                });
            });
        },

        /* ─── Force clear the cached CSRF token ─── */
        clearToken: _clearToken
    };
});
