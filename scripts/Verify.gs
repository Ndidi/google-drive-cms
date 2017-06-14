function verifyJSON() {
  // Assumes
  // There is Sheet Tab named "Publish-Test"
  // First row is column headings
  // Columns:
  //   A: pass_fail - this function sets the contents of the column to "Pass" or "Fail"
  //   B: test_description - user notes about what is being tested in this row
  //   C: property_path - the path in the JSON result to find the element to test. Example site_info.address or [0].name
  //   D: function - "equals", "exists", or "count"
  //   E: expected_result a value like: 42, "Bunk Sandwiches" or TRUE
  //   F: actual_result

  var init = init_(),
      settings = init.settings,
      sheet = init.sheet,
      json = JSON.parse(init.json);

  // Find sheet or give an error
  var testTab = 'Publish-Test';
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(testTab);
  if (!sheet) {
    throw new Error('Cannot find test Sheet Tab: "' + value + '"');
  }

  //  Get the scale of the sheet
  var lastColumn = sheet.getLastColumn(),
      lastRow = sheet.getLastRow();

  //  Assume 1 header row, sheet tab is at top left of sheet
  var headerColumn = 1,
      headerRow = 1,
      firstColumn = 1,
      firstContentRow = headerRow + 1,
      numberOfHeaders = sheet.getLastColumn();

  /**
  Find headers which will become keys in our JSON
  1, 1, 1, getLastColumn refers to getting the range starting at
  row 1, column 1, and going 1 row deep, up to the last column
  */
  var headerRange = sheet.getRange(headerRow, headerColumn, 1, numberOfHeaders),
      headerValues = headerRange.getValues()[0];

  // Enable mapping between column name and number
  var columnHeaders = [], headerColumns = [];
  function columnNumber(columnName) {
    var result = columnHeaders.indexOf(columnName);
    if (result >= 0) {
      return headerColumns[result];
    }
    throw new Error('Invalid column name: ' + columnname);
  }

  /**
  Validate Headers:
  */
  var requiredHeaders = ['pass_fail', 'property_path', 'function', 'expected_result', 'actual_result'];

  // What columns do we have
  for (var i = 0; i < headerValues.length; i++) {
    if (requiredHeaders.indexOf(headerValues[i]) !== -1) {
      if (columnHeaders.indexOf(headerValues[i]) === -1) {
        columnHeaders.push(headerValues[i]);
        headerColumns.push(i + firstColumn);
      }
    }
  }

  // Which columns are missing (better be none!)
  var missingHeaders = '';
  for (var i = 0; i < requiredHeaders.length; i++) {
    if (columnHeaders.indexOf(requiredHeaders[i]) === -1) {
      missingHeaders += (missingHeaders?', ':'') + '"' + requiredHeaders[i] + '"';
    }
  }
  if (missingHeaders) {
    throw new Error('Test Sheet Tab "' + testTab + '" is missing required header column(s): ' + missingHeaders);
  }

  // Clear out pass_fail and actual_result columns
  SpreadsheetApp.flush();
  var numberOfRowsToClear = sheet.getLastRow() - headerRow;
  sheet.getRange(firstContentRow, columnNumber('pass_fail'), numberOfRowsToClear, 1).clear();
  sheet.getRange(firstContentRow, columnNumber('actual_result'), numberOfRowsToClear, 1).clear();
  SpreadsheetApp.flush();

  // Iterate through all rows
  var lastRow = sheet.getLastRow();
  for (row = firstContentRow; row <= lastRow; row++) {
    var property_path   = sheet.getRange(row, columnNumber('property_path'),   1, 1).getValue();
    var test_function   = sheet.getRange(row, columnNumber('function'),        1, 1).getValue();
    var expected_result = sheet.getRange(row, columnNumber('expected_result'), 1, 1).getValue();
    var expected_blank  = sheet.getRange(row, columnNumber('expected_result'), 1, 1).getCell(1, 1).isBlank();

    if (property_path && ['equals', 'exists', 'count'].indexOf(test_function) > -1) {
      var property = jsonProperty_(json, property_path);

      var actual_result = "";
      if (test_function === 'equals') {
        actual_result = property;
      }

      if (test_function === 'exists') {
        actual_result = !!(property);
      }

      if (test_function === 'count') {
        if (itIsAnArray_(property)) {
          actual_result = property.length;
        } else {
          actual_result = undefined;
        }
      }
      sheet.getRange(row, columnNumber('actual_result'), 1, 1).setValue(actual_result);

      if (!expected_blank) {
        var pass_fail = 'Fail';
        var bkgd_color = '#cd1e20';
        if (actual_result === expected_result) {
          pass_fail = 'Pass';
          bkgd_color = '#39ff14';
        }
        sheet.getRange(row, columnNumber('pass_fail'), 1, 1).setBackground(bkgd_color);
        sheet.getRange(row, columnNumber('pass_fail'), 1, 1).setValue(pass_fail);
      }
    }
  }
}


function itIsAnArray_(arg) {
  return Object.prototype.toString.call(arg) === '[object Array]';
}

function jsonProperty_(json, property_path) {
  // Parameters:
  //   json is a JSON object.
  //   property_path is a string like "site_info.logo" or "site_info.staff" or "site_info.staff[1].preferred_phone"
  // Returns the property in the "json" parameter whose path is described by "property_path"
  // If the element exists but is equal to undefined, return null
  // If the element does not exist, return undefined
  //
  // Test bed: https://jsbin.com/zicuwow/edit?js,console

  var props = property_path.split('.');
  var res = [];

  // For all dot separated properties
  for (var i = 0; i < props.length; i++) {
    // No array_index to start
    var array_index = -1;

    var prop = props[i].trim();

    // Is there array notation
    var array_parts = prop.split('[');
    if (array_parts.length > 1) {
      prop = array_parts[0].trim();
      array_index = parseInt(array_parts[1].split(']')[0]);
    }

    // Handle property
    if (prop) {
      if (!json || !json.hasOwnProperty(prop)) {
        return undefined;
      } else {
        json = json[prop];
      }
    }

    // Handle array index
    if (array_index > -1) {
      if (itIsAnArray_(json) && array_index < json.length) {
        json = json[array_index];
      } else {
        return undefined;
      }
    }
  }

  // Distinguish between property is present, but undefined and missing entirely
  if (json === undefined) {
    return null;
  }

  return json;
}
