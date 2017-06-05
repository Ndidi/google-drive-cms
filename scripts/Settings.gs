function initSettings_() {
  /**
  Build the settings object from the "SETTINGS" sheet
  */
  // Create an empty settings object
  var s = new Object();

  // Get the SETTINGS sheet
  var settingsSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("SETTINGS");

  // A nasty hard coded value for where to look for custom settings
  var settingsA1Notation = "A5:C";

  // Get the values of the range of cells containing settings
  var settingsValues = settingsSheet.getRange(settingsA1Notation).getValues();

  for (var i = 0; i < settingsValues.length; i++) {
    // For each row in the settings, create a key in our settings object (s) using
    // the first value in the row (e.g. endpoint) with a value of the third in the row (e.g. "http://myendpoint.com")
    var sv = settingsValues[i];
    // If there is a key name in the settings row...
    if (!!sv[0]) {
      // Custom header settings need to be handled slightly different
      if (sv[0] === "headers" && !!sv[2]) {
        sv[2] = JSON.parse(sv[2]);
      }
      // ... create a key with that value in the settings object
      s[sv[0]] = sv[2];
    }
  }

  /**
  If there is no endpoint provided, then just flip to debug
  mode and show a dialog with the JSON
  */
  if (!s.endpoint) { s.debug = true }

  return s;

}
