/** --------------------- */
/**    EXPORT TO FILE     */
/** --------------------- */

function saveFile(json, settings) {
  // In case of debug (where no JSON is passed through)
  json = json || "This is a test";

  // Work out the location of the file accessing this script (Apps Script makes this painful)
  var thisSpreadsheet = SpreadsheetApp.getActive(),
      thisSpreadSheetLocation = DriveApp.getFileById(thisSpreadsheet.getId()),
      thisFolder = thisSpreadSheetLocation.getParents().next();

  // Generated filename is <spreadsheet name> + time + date
  var d = new Date(),
      time = d.getHours().toString() + d.getMinutes().toString() + d.getSeconds().toString(),
      fname = [SLUGIFY(thisSpreadsheet.getName()), time, d.getDate(), d.getMonth() + 1, d.getFullYear()].join("_") + ".json";

  // Create an "_export" folder if it dooes not exist
  if (!thisFolder.getFoldersByName("_export").hasNext()) {
    thisFolder.createFolder("_export");
  }
  var exportsFolder = thisFolder.getFoldersByName("_export").next();

  // We need to count the number of already exported files.
  // If it is more than our maxSaveFiles (from settings), then we delete the oldest
  if (settings.maxSaveFiles) {
    var oldExports = exportsFolder.getFiles(),
        oldExportsArray = [];

    // Frustratingly you have to loop through all files to find out the length
    while (oldExports.hasNext()){
      var f = oldExports.next();
      oldExportsArray.unshift(f.getId());
    }

    if (oldExportsArray.length >= settings.maxSaveFiles) {
      DriveApp.getFileById(oldExportsArray[0]).setTrashed(true);
    }
  }
  // Now you know the current working directory, create a file in it
  var createdFile = exportsFolder.createFile(fname, json, MimeType.JSON);

  // Create a dialog box with the file's download URL for convenience
  var dlUrl = createdFile.getDownloadUrl().replace("gd=true", "");

  // Create an HTML template from export_content.html
  var htmlTemplate = HtmlService.createTemplateFromFile("export_content");

  // Feed it context variables for the dlUrl
  htmlTemplate.dlUrl = dlUrl;

  // Evaluate the template
  htmlTemplate = htmlTemplate.evaluate()
      .setSandboxMode(HtmlService.SandboxMode.IFRAME)
      .setHeight(100);

  // Show a modal with the template
  SpreadsheetApp.getUi().showModalDialog(htmlTemplate, 'Export content');

}
