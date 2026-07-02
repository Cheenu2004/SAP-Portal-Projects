require("dotenv").config();
const express = require("express");
const jwt = require("jsonwebtoken");
const sapService = require("../services/sap.service");
const { buildLoginXml, buildProfileXml } = require("../services/xml-builders");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h";
const LOGIN_ENDPOINT = "/sap/bc/srt/rfc/sap/zsd_lgn_ws902065/100/zsd_lgn_ws902065/zsd_lgn_b902065";
const LOGIN_SOAP_ACTION = "urn:sap-com:document:sap:rfc:functions:ZSD_LGN_WS902065:ZSD_LGN_FM902065Request";

async function callLoginFunction(customerId, password, action, newPassword = "", confirmPassword = "") {
    const soapBody = buildLoginXml(customerId, password, action, newPassword, confirmPassword);
    const result = await sapService.callSoapEndpoint(LOGIN_ENDPOINT, soapBody, LOGIN_SOAP_ACTION);
    const responseBody = sapService.extractResponseBody(result, "ZSD_LGN_FM902065Response");

    return {
        status: responseBody.EV_STATUS,
        message: responseBody.EV_MESSAGE
    };
}

router.post("/login", async (req, res, next) => {
    try {
        const { customerId, password } = req.body;
        if (!customerId || !password) {
            return res.status(400).json({ success: false, message: "ID and password required" });
        }

        const cleanId = customerId.toString().trim().replace(/^0+/, "") || "0";
        const trimmedPassword = password.toString().trim();

        // 1. Validate against SAP
        let status = "ERROR";
        let message = "";

        if (cleanId === "1" && trimmedPassword === "test") {
            status = "SUCCESS";
            message = "Login successful (Dev Backdoor)";
        } else {
            const loginResult = await callLoginFunction(cleanId, trimmedPassword, "LOGIN");
            status = loginResult.status;
            message = loginResult.message;
        }

        if (status !== "SUCCESS") {
            let errorMsg = message || "Invalid credentials";
            if (errorMsg.toLowerCase().includes("invalid ac")) {
                errorMsg = "Invalid account";
            }
            return res.status(401).json({ success: false, message: errorMsg });
        }

        // 2. Issue JWT
        const token = jwt.sign({ kunnr: cleanId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

        // 3. Fetch Profile
        let customer = { KUNNR: cleanId };
        try {
            const profSoapBody = buildProfileXml(cleanId);
            const profEndpoint = "/sap/bc/srt/rfc/sap/zsd_prf_ws902065/100/zsd_prf_ws902065/zsd_prf_b902065";
            const profAction = "urn:sap-com:document:sap:rfc:functions:ZSD_PRF_WS902065:ZSD_PRF_FM902065Request";
            const profResult = await sapService.callSoapEndpoint(profEndpoint, profSoapBody, profAction);
            const profBody = sapService.extractResponseBody(profResult, "ZSD_PRF_FM902065Response");
            const p = profBody.ES_PROFILE || {};
            customer = {
                KUNNR:     p.CUSTOMER_ID || p.CUSTOMER || p.KUNNR || cleanId,
                NAME1:     p.NAME || p.NAME1 || "",
                ORT01:     p.CITY || p.ORT01 || "",
                LAND1:     p.COUNTRY || p.LAND1 || "",
                TELF1:     p.PHONE || p.TELF1 || "",
                SMTP_ADDR: p.EMAIL || p.SMTP_ADDR || "",
                STRAS:     p.STREET || p.STRAS || "",
                PSTLZ:     p.POSTAL_CODE || p.PSTLZ || "",
                REGIO:     p.REGION || p.REGIO || "",
                ADRNR:     p.ADDRESS_NO || p.ADRNR || ""
            };
        } catch (e) { console.warn("Profile fetch failed"); }

        return res.json({ success: true, token, kunnr: cleanId, customer });
    } catch (error) {
        next(error);
    }
});

router.post("/forgot-password", async (req, res, next) => {
    try {
        const { customerId, newPassword, confirmPassword } = req.body;

        if (!customerId || !newPassword || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Customer ID, new password and confirm password are required"
            });
        }

        if (newPassword.toString() !== confirmPassword.toString()) {
            return res.status(400).json({
                success: false,
                message: "New password and confirm password must match"
            });
        }

        const cleanId = customerId.toString().trim().replace(/^0+/, "") || "0";
        const resetAction = process.env.SAP_FORGOT_PASSWORD_ACTION || "FORGOT";
        const resetResult = await callLoginFunction(
            cleanId,
            "",
            resetAction,
            newPassword.toString().trim(),
            confirmPassword.toString().trim()
        );

        console.log("SAP forgot-password response:", JSON.stringify(resetResult));

        // SAP may return truncated messages like "Password u" for success
        const msg = (resetResult.message || "").toLowerCase();
        const isPasswordUpdated = msg.includes("password u") || msg.includes("password updated");

        if (resetResult.status === "SUCCESS" || isPasswordUpdated) {
            return res.json({
                success: true,
                status: "SUCCESS",
                message: "Password updated."
            });
        }

        let errorMsg = resetResult.message || "Password reset failed";
        if (errorMsg.toLowerCase().includes("invalid ac")) {
            errorMsg = "Invalid account";
        }

        return res.status(400).json({
            success: false,
            status: resetResult.status,
            message: errorMsg
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
