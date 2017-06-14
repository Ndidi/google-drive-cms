# DriveCMS Extensions
#### Extending DriveCMS Google Sheet functionality
#### By David Quisenberry and Benjamin T. Seaver

### See https://www.drivecms.xyz/ by Max Berry for original work and documentation

### How to use these extensions?
1. First follow the instructions on https://www.drivecms.xyz/ to get up and running with the existing functionality.
 * Read through the docs
 * Try entering a few rows in the CMS tab
 * Select the menu option "Google Drive CMS" / "Publish"
 * Copy the resultant JSON to a pretty printer such as http://jsonprettyprint.com/
 * Make sure you are able to get JSON output that makes sense


2. Make a copy of the Google Drive CMS spreadsheet then modify it in the following ways:

  * Select the menu option "Tools" / "Script editor..." then replace the scripts with those in the script folder of this repository.  

    * Note that these extended scripts are based upon versions from Google Drive CMS as of June 2017.  At this point we updated the BuildJSON.gs, Auto.gs scripts and added the Verify.gs script.

  * On the SETTINGS tab at the bottom of the list (probaby line 18) add the following:
    * Column A: `trueList`
    * Column B: `For use with the Boolean column type; the comma deliminted list of string values that should return true.  Case is not significant.  For example both YES and yes will return TRUE.  Default list is: y,yes,t,true`

  * In the `_internals` tab add the following values in their own rows under `Google Sheet` in column A:
    * `Google Tab`
    * `Boolean`
    * `Key Column`
    * `Variable Type Column`
    * `Value Column`

  * Note that:
    * The `Google Tab` option complements the previous `Google Sheet` option.  With this, you can have additional tabs of data instead of or as well as linking other spreadsheets.
    * The `Boolean` data option translates a word like "Yes" or "No" to TRUE or FALSE. See the new `trueList` SETTING to control what words are translated to TRUE.  All other words receive the value of FALSE.
    * The new `Key Column`, `Variable Type Column` and `Value Column` types when used, must be the only three column types used at the top of the sheet tab and must be used one each. Directly underneath the `Variable Type Column` on the data rows are the other types such as `Simple`, `list`, `Google Sheet` and `Google Tab`.  This enables one to build a rich JSON object with keys and a variety of value types.

### Additional Features:

1. Create a `Boolean` data type where `trueList` in the SETTINGS tab controls what words are receive a TRUE value and all others receive FALSE. Non-zero numbers also return TRUE.

2. Enable pulling tabular data from Sheet Tabs on the top level sheet, thus eliminating the need to put each table in its own sheet.  Under `Google Tab`, put the name of the tab.

3. Complement the previously existing tabular data with “Key”, “Type” and “Value” rows.  This adds tremendous convenience for a downstream system to access a variety of tables, elements and documents from the top level Google Sheet.

4. Enable nesting of tabular data.  For example in Project Tracking, let subtasks be indicated with dashes.

5. Provide a mechanism to verify that essential data elements are included in the JSON output.

### Example for Key, Type Value sheets

|    |  A                 |  B                           | C                     | D |
|----|--------------------|------------------------------|-----------------------|   |
| 1  | **Key**            | **Type**                     | **Value**             |   |
| 2  | Key Column &#8711; | Variable Type Column &#8711; | Value Column &#8711;  |   |
| 3  | site_name          | Simple &#8711;               | Specialty Brewery     |   |
| 4  | logo               | Simple &#8711;               | https://image/url     |   |
| 5  | about              | Simple &#8711;               | https://google/doc/url|   |
| 6  | staff              | Google Tab &#8711;           | (Tab Name for Staff)  |   |
| 7  | down_for_maint     | Boolean                      | No                    |   |
        
#### Copyright 2017: David Quisenberry and Benjamin T. Seaver
#### License: MIT
#### Support: None
