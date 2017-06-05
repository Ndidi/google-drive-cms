/** --------------------- */
/**    MAIN FUNCTIONS     */
/** --------------------- */
function sendToEndpoint_(json, settings) {
  /**
  Send the JSON payload to our site's endpoint
  */
  var endpoint = settings.endpoint;

  // Params for the request
  var options = {
    "headers": {},
    "method": settings.requestMethod.toLowerCase() || "post",
    "payload": json,
    "contentType": "application/json"
  };

  // Grab custom headers from the settings file
  if (settings.headers) {
    options.headers = settings.headers;
  }
  // Add the authorization setting
  if (settings.authorization) {
    options.headers.Authorization = settings.authorization;
  }

  // Send request
  UrlFetchApp.fetch(endpoint, options);

}

function publish() {
  /**
  Convert a spreadsheet to JSON and then POST to a URL endpoint
  */

  // Fetch the basic required variables
  var init = init_(),
      settings = init.settings,
      sheet = init.sheet,
      json = init.json;

  if (settings.options) {
    json = JSON.stringify({ "data": JSON.parse(json), "options": JSON.parse(settings.options) });
  }

  if (settings.debug && !settings.saveFile) {
    // If we are in debug mode, just show an alert with the JSON
    SpreadsheetApp.getUi().alert(json);
  } else {
    // If we are in live mode, send JSON to the URL endpoint in the settings
    sendToEndpoint_(json, settings);
  }

  // If the settings have requested a file will be saved to the users Google Drive
  if (settings.saveFile) {
    saveFile(json, settings);
  }

}

function export() {
  /**
  Convert spreadsheet to a JSON file and provide a download URL
  */
  // Fetch the basic required variables
  var init = init_(),
      settings = init.settings,
      sheet = init.sheet,
      json = init.json;

  saveFile(json, settings);

}

/** --------------------- */
/**   UTILITY FUNCTIONS   */
/** --------------------- */
function init_() {
  /**
  Basic functionality required for both endpoint publish
  and file exports
  */

  // Init the CMS settings options
  var settings = initSettings_();

  // Get the CMS sheet to be exported as JSON
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(settings.cmsSheetName);

  // Build a JSON object containing our spreadsheet
  var json = buildJSON_(sheet, settings);

  return {
    sheet: sheet,
    json: json,
    settings: settings
  }
}
