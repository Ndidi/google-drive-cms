/** --------------------- */
/** AUTO FIRING FUNCTIONS */
/** --------------------- */

function onOpen() {
  /**
  Establish the UI on document open
  */

  // Instantiate the UI object
  var ui = SpreadsheetApp.getUi();

  // Create the menu
  ui.createMenu("Google Drive CMS")
  .addItem("Publish", "publish")
  .addItem("Export content", "export")
  .addItem("Verify JSON Contents", "verifyJSON")
  .addToUi();
}
