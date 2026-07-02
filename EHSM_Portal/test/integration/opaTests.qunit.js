/* global QUnit */
QUnit.config.autostart = false;

sap.ui.require(["ehsmportal/test/integration/AllJourneys"
], function () {
	QUnit.start();
});
