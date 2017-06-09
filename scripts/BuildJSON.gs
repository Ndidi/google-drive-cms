/** --------------------- */
/**     BUILDING JSON     */
/** --------------------- */

function extractGoogleSheet_(value, settings) {
  /**
  Fetch a different Google Sheet, which allows us to do
  nested objects. Google Drive sheets as JSON within Google Drive sheets.
  */
  // If this field is blank then return an empty array
  if (!value) return [];

  // The value might be a Google Sheet URL or just a sheet ID.
  // Normalize for these different outputs.
  var r = new RegExp("^https?://docs.google\\.com", "ig");
  var isUrl = r.test(value);
  value = isUrl ? value.split("/d/")[1].split("/")[0]: value;

  // Get the other CMS sheet to be exported as JSON
  var file = DriveApp.getFileById(value);
  var sheet = SpreadsheetApp.open(file).getSheetByName(settings.cmsSheetName);

  // Build a JSON object containing our spreadsheet
  var json = buildJSON_(sheet, settings);

  // We don't want to double stringify json, so let's parse it back
  return JSON.parse(json);
}


function extractGoogleTab_(value, settings) {

  // If this field is blank then return an empty array
  if (!value) return [];

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(value);

  // Build a JSON object containing our spreadsheet
  var json = buildJSON_(sheet, settings);

  // We don't want to double stringify json, so let's parse it back
  return JSON.parse(json);
}


function extractEval_(value) {
  return eval(value);
}

function extractList_(value, settings) {
  return value.split(settings.listDelimiter);
}

function extractRichContent_(value, fieldType) {
  /**
  Extracts rich text content from a Google Doc
  */

  /**
  Check whether the value is a Google Doc by regex testing the domain.
  Note that if your content starts with a Google Doc url and then has
  more content after (e.g. "http://....com is my google doc"), it will still match. Bug!
  */
  var r = new RegExp("^https?://docs.google\\.com", "ig");
  var shouldExtract = r.test(value) && fieldType != "Google Sheet";

  // If it is not a Google Doc URL, then exit the function
  // and just return the untouched value
  if (!shouldExtract) {
    return value;
  }

  // Else...

  // Hack to trigger a request for the Google Drive API permissions
  DriveApp.getStorageUsed();

  var docID = DocumentApp.openByUrl(value).getId(),
      downloadUrl = "https://docs.google.com/feeds/download/documents/export/Export?id="+docID+"&exportFormat=html";

  // Set an OAuth token in the authorization header
  var options = {
    method      : "get",
    headers     : { "Authorization": "Bearer " + ScriptApp.getOAuthToken() },
    muteHttpExceptions:true,
  };

  // Make an authorized GET request to the download URL for our docID
  var html = UrlFetchApp.fetch(downloadUrl, options).getContentText();

  // Use REGEX to get the contents of the <body> tag within the HTML string that has been returned
  var bodyContent = html.match(/<body[^>]*>([^<]*(?:(?!<\/?body)<[^<]*)*)<\/body\s*>/i)[1];

  //  Google docs appends a bunch of crazy classes, inline styles & IDs. Remove them with REGEX.
  bodyContent = bodyContent.replace(/(class|id|style)="([^"]*)"/ig, "");

  // There are a bunch of spans on everything. This removes <span> and </span> with REGEX.
  // WARNING! This is off piste. I'm not sure if this is a terrible idea. UPDATE: Removed

  // Replace [IMAGE: <url>] with actual image tags\[IMAGE:(.*?)\]
  bodyContent = bodyContent.replace(/\[IMAGE:(.*?)\]/ig, "<img src='$1' />");

  // Return the rich HTML
  return bodyContent;

}

function validateCell_(value, fieldType, settings) {
  /**
  Validate a supplied cell value against field types
  */
  // Is the value rich content (a Google Doc URL)? If yes, extract it.
  value = extractRichContent_(value, fieldType);

  // If fieldType is a "list", build an array
  if (!!value) {

    if (fieldType === "List") {
      value = extractList_(value, settings);
    } else if (fieldType === "Google Sheet") {
      value = extractGoogleSheet_(value, settings);
    } else if (fieldType === "Google Tab") {
      value = extractGoogleTab_(value, settings);
    } else if (fieldType === "Eval") {
      value = extractEval_(value, settings);
    } else if (fieldType === "Boolean") {
      value = checkBoolean_(value);
    }

  }

  return value;
}



function checkBoolean_(term){
  if (typeof term === "boolean") {
    return term;
  }

  if (typeof term === "number") {
    if (term) {
      return true;
    }
    return false;
  }

  if (typeof term !== "string") {
    term = term.toString();
  }

  var termToCheck = term.toLowerCase();
  return termToCheck === "y" ||
    termToCheck === "yes" ||
    termToCheck == "1" ||
    termToCheck === "true" ||
    termToCheck === "t";
}



function handleChildRows(dataObj, data, firstHeader) {
  // Child level is based upon prepended dashes on first field
  var firstField = dataObj[firstHeader];

  // When child level is 0, just push data object on to data
  // Otherwise try to add data object to children array
  var parent = null, childLevel = 0;

  // Can determine child level if both
  // first field is a string of dashes and there are parents
  if (typeof firstField === 'string' && data.length) {
    // Get the first word and check if it is all dashes
    var firstWord = firstField.trim().split(' ', 1)[0];
    var dashes = firstWord.split('');
    if (!dashes.some(function(x) {return x !== '-';})) {
      // Child level is the number of dashes
      childLevel = dashes.length;
    }
  }

  // If there is a child level,
  // then make sure there already is a parent for that child
  if (childLevel) {
    var parent = data[data.length - 1];
    for (var parentLevel = 1; parentLevel < dashes.length; parentLevel++) {
      if ('children' in parent) {
        parent = parent['children'][parent['children'].length - 1];
      } else {
        parent = null;
        break;
      }
    }
  }

  // Add child row to parent
  if (parent) {
    if (!('children' in parent)){
      parent['children'] = [];
    }
    parent['children'].push(dataObj);
  }

  // If no parent child relationship (or not valid), then push row directly to data
  if (!parent) {
    data.push(dataObj);
  }
}




function buildJSON_(sheet, settings) {
  /**
  Manipulate the Google sheet in to a JSON object
  */
  //  Get the scale of the sheet
  var lastColumn = sheet.getLastColumn(),
      lastRow = sheet.getLastRow();

  //  Set parameters for where the headers and rows are within the sheet
  var firstHeaderColumn = settings.firstHeaderColumn, // Column number of first header
      firstHeaderRow = settings.firstHeaderRow,
      firstFieldTypeRow = firstHeaderRow + 1,
      firstContentRow = firstHeaderRow + 2,
      numberOfHeaders = sheet.getLastColumn();

  /**
  Find headers which will become keys in our JSON
  1, 1, 1, getLastColum refers to getting the range starting at
  row 1, column 1, and going 1 row deep, up to the last column
  */
  var headerRange = sheet.getRange(firstHeaderRow, firstHeaderColumn, 1, numberOfHeaders),
      headerValues = headerRange.getValues()[0],
      fieldTypeRange = sheet.getRange(firstFieldTypeRow, firstHeaderColumn, 1, numberOfHeaders),
      fieldTypeValues = fieldTypeRange.getValues()[0];
  var firstHeader = headerValues[0];

  /**
  Validate Field Types:
  Either have one each of: Key Column, Variable Type Column, Value Column or
  have none of the above.
  */
  var columnFieldTypes = [];
  for (var i = 0; i < fieldTypeValues.length; i++) {
    if (['Key Column', 'Variable Type Column', 'Value Column'].indexOf(fieldTypeValues[i]) !== -1) {
      if (columnFieldTypes.indexOf(fieldTypeValues[i]) === -1) {
        columnFieldTypes.push(fieldTypeValues[i]);
      }
    }
  }
  if ([0, 3].indexOf(columnFieldTypes.length) === -1) {
    throw new Error('Must either use no column field types or all three.');
  }

  if (columnFieldTypes.length === 3) {
    var data = {};
  } else {
    var initialData = [];
    var data = [];
  }

  // Starting at the row after the headers
  for (var row = firstContentRow; row <= lastRow; row++) {
    // Get the values of the row at position "row" from the first header, and going 1 row deep until the last column
    var rowRange = sheet.getRange(row, firstHeaderColumn, 1, lastColumn),
        rowValues = rowRange.getValues()[0];

    if (columnFieldTypes.length === 3) {
      /** Get Row by Row Field Type and Validate **/
      var i = fieldTypeValues.indexOf('Variable Type Column');
      var ft = rowValues[i];
      if (['Key Column', 'Variable Type Column', 'Value Column'].indexOf(ft) !== -1) {
        throw new Error("Cannot use column field types on individual row " + row + ".");
      }

      /* Get Key name for this column */
      i = fieldTypeValues.indexOf('Key Column');
      var hd = rowValues[i];
      if (! hd) {
        throw new Error("Key Column must be filled in on row " + row + ".");
      }

      /* Get Value from Value column */
      i = fieldTypeValues.indexOf('Value Column');
      var rv = rowValues[i];

      data[hd] = validateCell_(rv, ft, settings);

    } else {
      // Create an empty object
      var dataObj = new Object();

      // For each value in the row, add a key (header) to our object with that value
      for (var i = 0; i < rowValues.length; i++) {
        var ft = fieldTypeValues[i] || "Simple",
            hd = headerValues[i],
            rv = rowValues[i] || "";
        dataObj[hd] = validateCell_(rv, ft, settings);
      }

      // Push that object to an array containing all objects
      initialData.push(dataObj);
    }
  }

  if (columnFieldTypes.length === 0) {
    // For each row in initial data,
    // Add to data or if a child row, add to children of last entry
    for (var row = 0; row < initialData.length; row++) {
      var dataObj = initialData[row];
      handleChildRows(dataObj, data, firstHeader);
    }
  }

  // If there is a key provided in the settings, store data behind that key
  if (settings.key) {
    var tmp = {};
    tmp[settings.key] = data;
    data = tmp;
  }

  return JSON.stringify(data);
}
