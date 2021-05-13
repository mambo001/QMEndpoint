/* Route
 * All Request with Method GET will be process here
 */
var email = Session.getActiveUser().getEmail();
var ldap = email.split("@")[0];
//var ldap = "ldapTest",
//    email = "emailTest";


// const TEMP_DUMP = SpreadsheetApp.openById("1jE6-gdexoC3NWp4-fRmcPlePFvfy5uF8rw_vIVf6j4w");
// const AR_TEMP_TAB = TEMP_DUMP.getSheetByName("AR_TEMP");



const MAIN_DUMP = SpreadsheetApp.openById("12OdxpPwNiu_XJOSuRqk_QJpYFOgEfN9EEuxYPfQWDmI");
const SID_AR_TAB = MAIN_DUMP.getSheetByName("SID-AR-tab");
const QM_Prio_TAB = MAIN_DUMP.getSheetByName("QM - Prio");
const SPR_AR_TAB = MAIN_DUMP.getSheetByName("SPR-AR");
// SpreadsheetApp.openById("1jE6-gdexoC3NWp4-fRmcPlePFvfy5uF8rw_vIVf6j4w")

// SPR Dump v1
// Testing
// const SPR_DUMP = SpreadsheetApp.openById("1zkW4cvxVHJxAlQRSM-1hWhzksfJuOoy2nK03TZlhluY");
// [TEST]SPR
// const SPR_DUMP = SpreadsheetApp.openById("1D0sp2Ay6fBqqGu5HTwRmhAVtJJy7dUQ0nUrYxIZDcXU");
// Prod
const SPR_DUMP = SpreadsheetApp.openById("1k2jLrOAeCG3vvCxX1xm205fztiXoAEuFuqPDGJk3Ln4");

// SPR Dump v2
// Testing
// const SPR_DUMP = SpreadsheetApp.openById("1zkW4cvxVHJxAlQRSM-1hWhzksfJuOoy2nK03TZlhluY");
// Prod
// const SPR_DUMP = SpreadsheetApp.openById("17gZg4NvVTcpQTHf1GcC5CoGsVYzzge5Bldk89V7Gxsc");



const MONITOR_LOGS_TAB = SPR_DUMP.getSheetByName("Monitor Logs");


function getEmail (){
  return Session.getActiveUser().getEmail();
}

function generateGUID() {
    function s4() {
      return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
    }
    return 'case' + '-' + s4() + '-' + s4();
}

function yyyymm() {
  var now = new Date();
  var y = now.getFullYear();
  var m = now.getMonth() + 1;
  return '' + y + "-" + (m < 10 ? '0' : '') + m ;
}

function yyyymmdd(date) {
  var now = date == null || date == "" ? new Date() : date;
  var y = now.getFullYear();
  var m = now.getMonth() + 1;
  var d = now.getDate();
  return '' + y + "-" + (m < 10 ? '0' : '') + m + "-" + (d < 10 ? '0' : '') + d;
}

function doIdentifyDate(stringToDate){
  let strArray = stringToDate.split(" ");
  if (isNaN(strArray[0])){
    let currentYear = new Date().getFullYear();
    let yearString = new Date(`${stringToDate} ${currentYear}`);
    console.log(stringToDate)
    return yyyymmdd(yearString);
  } else {
    console.log(new Date(stringToDate))
    return strToDate(strArray);
  }
}

function strToDate(strArray){
  // check if minutes, days or hours
  if (strArray[1].includes('day')){
    let hours = strArray[0] * 24,
        minutes = hours * 60,
        seconds = minutes * 60,
        ms = seconds * 1000;
    return getDateDifference(ms);
  } else if(strArray[1].includes('hour')){
    let minutes = strArray[0] * 60,
        seconds = minutes * 60,
        ms = seconds * 1000;
    return getDateDifference(ms);
  } else if(strArray[1].includes('minute')){
    let seconds = strArray[0] * 60,
        ms = seconds * 1000;
    return getDateDifference(ms);
  }

  // return ms is msDifference to subtract from currentDate
}

function getDateDifference(ms){
  // date now - relative dates -> convert to MS
  // ms - currentDate
  // convert MS to Date Object
  // format Date Object to yyyymmdd 
  let currentDate = new Date();
  let differenceMS = currentDate.valueOf() - ms;
  let finalDate = new Date(differenceMS);
  console.log("msRaw: " + ms);
  console.log("differenceMS: " +differenceMS)
  console.log("datifiedMSDiff: " + finalDate)
  // return (yyyymmdd(finalDate))
  return finalDate
}

function dateAdd(date, interval, units) {
  var ret = new Date(date); //don't change original date
  var checkRollover = function() { if(ret.getDate() != date.getDate()) ret.setDate(0);};
  switch(interval.toLowerCase()) {
    case 'year'   :  ret.setFullYear(ret.getFullYear() + units); checkRollover();  break;
    case 'quarter':  ret.setMonth(ret.getMonth() + 3*units); checkRollover();  break;
    case 'month'  :  ret.setMonth(ret.getMonth() + units); checkRollover();  break;
    case 'week'   :  ret.setDate(ret.getDate() + 7*units);  break;
    case 'day'    :  ret.setDate(ret.getDate() + units);  break;
    case 'hour'   :  ret.setTime(ret.getTime() + units*3600000);  break;
    case 'minute' :  ret.setTime(ret.getTime() + units*60000);  break;
    case 'second' :  ret.setTime(ret.getTime() + units*1000);  break;
    default       :  ret = undefined;  break;
  }
  return ret;
}

function doPost(e){
//  myLockFunction(e)
 
  const body = e.postData.contents;
  const bodyJSON = JSON.parse(body);
  let jsonResponse = {};
  let ldapToggle = e.parameter.ldap == "me" ? ldap : e.parameter.ldap;
  let flag = e.parameter.flag || 0;
  let SPRCaseData;

  if (flag == 1){
    console.log({flag});

    console.log(bodyJSON);
    SPRCaseData = bodyJSON;

    // Insert to SPR selected columns
    doInsertToSPR(SPRCaseData);

    // Insert to QM - Prio
    doUpdateQMTally(SPRCaseData)

  } else {
    bodyJSON.forEach((c) => {
      let formattedDate = doIdentifyDate(c.lastModifiedDate);
      AR_TEMP_TAB.appendRow([
        formattedDate,
        c.studyID,
        c.caseID,
        c.caseRemarks,
        c.caseStatus,
        c.caseAssignee
      ]);
    });
  }

  const response  = [{status: 200, message: "OK", responseData: SPRCaseData}];

  return sendJSON_(response);
}

function sendJSON_(jsonResponse){
  return ContentService
    .createTextOutput(JSON.stringify(jsonResponse))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(req) {
   let action = req.parameter.action;
   let tab = "Monitor Logs";
   if (req.parameter.tab) {
     tab = req.parameter.tab;
   }

   tab = SPR_DUMP.getSheetByName(tab);


  // GET QM Prio
  if (req.parameter.tab == "QM - Prio"){
    tab = QM_Prio_TAB;
  } else if (req.parameter.tab == "SPR-AR"){
    tab = SPR_AR_TAB;
  }

   console.log(tab);  
   
   switch(action) {
       case "read":
           return doRead(req, tab);
           break;
       case "insert":
           return doInsert(req, tab);
           break;
       case "update":
           return doUpdate(req, tab);
           break;
       case "delete":
           return doDelete(req, tab);
           break;
       case "updateCaseStatus":
           return doUpdateCaseState(req);
           break;
       default:
           return response().json({
              status: false,
              message: 'silent!'
           });
   }
}

/* Read
 * request for all Data
 *
 * @request-parameter | action<string>
 * @example-request | ?action=read
 */
function doRead(request, sheetObject) {
   var data = {};
   
   data.records = _readData(sheetObject);

   return response().json(data);

}

/* Insert
 *
 */
function doInsert(req, sheet) {
//  parse stuff
  // console.log(typeof req.parameter.data, req.parameter.data);
  let data = req.parameter.data;
  console.log(typeof data)

  let result = "";
  
//  send stuff
//   var flag = 1;
//  
//   if (flag == 1) {
//      var timestamp = Date.now();
//      var currentTime = new Date().toLocaleString(); // Full Datetime
//      var rowData = sheet.appendRow([
//        c.lastModifiedDate,
//        ldap,
//        c.studyID,
//        c.caseID,
//        "",
//        c.caseRemarks
//      ]);
//      var result = "Insertion successful";
//   }
  let casesArray = [];
  // req.parameter.data.forEach((case) => {

  // });
  
  // {
  //   lastModifiedDate: '9 minutes ago',
  //   studyID: '148479047',
  //   caseID: '0-9781000031007',
  //   caseRemarks: 'swiss',
  //   caseStatus: 'New',
  //   caseAssignee: 'New' 
  // }
  
  // TODO: Re-shape RB array to finalized array
  // var rowData = sheet.appendRow([
//        c.lastModifiedDate,
//        ldap,
//        c.studyID,
//        c.caseID,
//        "",
//        c.caseRemarks
//      ]);

  // doInsertToSPR(cases)



   return response().json({
      result: result
   });
}

function doProcessData(data) {
  if (!Array.isArray(data)) return

  let finalData
  data.shift()
  finalData = data.filter(p => p[0] != '')
  return finalData
}

function doUpdateColumn(){
  const DUMP_ID = "12OdxpPwNiu_XJOSuRqk_QJpYFOgEfN9EEuxYPfQWDmI";
  const TAB_NAME = "QM - Prio";
  const QM_Main_DUMP = SpreadsheetApp.openById(DUMP_ID);
  const QM_PRIO_TAB = QM_Main_DUMP.getSheetByName(TAB_NAME);

  let toEditList = [
    {ldap: 'reubenmark', count: 2},
    {ldap: 'beapatriz', count: 3},
    {ldap: 'krisnelyn', count: 4},
    {ldap: 'justingerik', count: 5},
    {ldap: 'bual', count: 6}
  ];

  const getRowNumber = (ldap) => {
    const prioColumnsData = QM_PRIO_TAB.getRange("A:D").getValues();
    const filteredData = doProcessData(prioColumnsData);
    const LDAPList = filteredData.map(r => r[0].toString().toLowerCase());
    const QMMTDList = filteredData.map(r => r[3]);
    const positionIndex = LDAPList.indexOf(ldap);
    const rowNumber = positionIndex === -1 ? 0 : positionIndex + 2;
    return rowNumber
  }

  let reubenRowNumber = getRowNumber('reubenmark')
  console.log(reubenRowNumber);

}

function doUpdateQMTally(caseData){
  // Testing
  // const DUMP_ID = "1zkW4cvxVHJxAlQRSM-1hWhzksfJuOoy2nK03TZlhluY"
  // Prod
  const DUMP_ID = "12OdxpPwNiu_XJOSuRqk_QJpYFOgEfN9EEuxYPfQWDmI";
  const TAB_NAME = "QM - Prio";
  const QM_Main_DUMP = SpreadsheetApp.openById(DUMP_ID);
  const QM_PRIO_TAB = QM_Main_DUMP.getSheetByName(TAB_NAME);

  let toEditList = [
    {ldap: 'bual', count: 2},
    {ldap: 'beapatriz', count: 3},
    {ldap: 'krisnelyn', count: 4},
    {ldap: 'justingerik', count: 5},
    {ldap: 'reubenmark', count: 6}
  ];
  // caseData = toEditList
  const prioColumns = QM_PRIO_TAB;
  const data = {};
  let ldap = [];
  let tally;
  let final
  let toEditData

  data.prio = _readData(prioColumns);

  const getRowNumber = (ldap) => {
    const prioColumnsData = QM_PRIO_TAB.getRange("A:D").getValues();
    const filteredData = doProcessData(prioColumnsData);
    const LDAPList = filteredData.map(r => r[0].toString().toLowerCase());
    const QMMTDList = filteredData.map(r => r[3]);
    const positionIndex = LDAPList.indexOf(ldap);
    const rowNumber = positionIndex === -1 ? 0 : positionIndex + 2;
    return rowNumber
  }

  const getTally = (data) => {
    let ldap = data.map(e => e.assignedToLDAP);
    let tally = ldap.reduce((map, val) => {
        map[val] = (map[val] || 0)+1; return map
      }, {} 
    );
    let final = Object.entries(tally).map(t => {
      return {
        ldap: t[0],
        count: t[1]
      }
    });
    return final
  }

  // Edit this shit to
  // to reflect data passed
  // from QM POST submit
  toEditData = getTally(caseData) /* EDIT BEFORE DEPLOYMENT!*/
  // let wtf = getTally(caseData)
  console.log('toEditData',toEditData)
  // toEditData = toEditList

  toEditData.forEach(prioInstance => {
    let { ldap, count } = prioInstance;
    let rowNumber = getRowNumber(ldap);
    let LDAPInfo = QM_PRIO_TAB.getRange(rowNumber, 1, 1, 4)
      .getValues()
      .flat();
    let [ sheetLDAP, currentMTD, QMMTD, MTD ] = LDAPInfo;
    let finalCount = (QMMTD + count);
    
    QM_PRIO_TAB.getRange(rowNumber, 3, 1, 1).setValues([[finalCount]])
  });

}

function _getLastRowSpecial(range) {
  let rowNum = 0;
  let blank = false;
  for(row = 0; row < range.length; row++){

    if(range[row][0] === "" && !blank){
      rowNum = row;
      blank = true;
    }else if(range[row][0] !== ""){
      blank = false;
    };
  };
  return rowNum;
}

function checkShit() {
  const columnToCheck = MONITOR_LOGS_TAB.getRange("AC:AC").getValues();
  // const columnToCheck = MONITOR_LOGS_TAB.getRange("AC:AC");
  const lastRow = _getLastRowSpecial(columnToCheck);

  console.log(lastRow,columnToCheck)
}

// Generate uniqueID using studyID,hyphen,caseID
function doGenerateUniqueID(studyID, caseID) {
  let newCID = caseID.includes('-') ? caseID.replace('-','') : caseID;
  return `${studyID}-${newCID}`
}

function getRecentSubmittedSID(){
  const scrapedStudyIDColumn = 30;
  const lastNumberValue = 30;
  const columnNumber = 2;
  let data = {}

  const rangeValues = MONITOR_LOGS_TAB.getRange('AD:AE').getValues();
  const lastRowNumber = _getLastRowSpecial(rangeValues);
  const lastRowMinusThirty = lastRowNumber != 0 ? (lastRowNumber-lastNumberValue) : 0;
  const lastThirtyValues = rangeValues.slice(lastRowMinusThirty, lastRowNumber);
  const uniqueIDArray = lastThirtyValues.map(([studyID, caseID]) => doGenerateUniqueID(studyID, caseID));

  // console.log(lastThirtyValues.length, {lastThirtyValues})
  // console.log(uniqueIDArray.length, {uniqueIDArray})

  return uniqueIDArray.length ? data = {
    recentCasesUID: uniqueIDArray,
    lastRowNumber
  } : [];
}



function doInsertToSPR(caseData) {
  // SPR v1
  // Testing
  // const DUMP_ID = "1zkW4cvxVHJxAlQRSM-1hWhzksfJuOoy2nK03TZlhluY"
  // Prod
  // const DUMP_ID = "1k2jLrOAeCG3vvCxX1xm205fztiXoAEuFuqPDGJk3Ln4";

  // SPR v2
  // Prod
  // const DUMP_ID = "17gZg4NvVTcpQTHf1GcC5CoGsVYzzge5Bldk89V7Gxsc";
  
  // const TAB_NAME = "Monitor Logs";
  // const SPR_DUMP = SpreadsheetApp.openById(DUMP_ID);
  // const MONITOR_LOGS_TAB = SPR_DUMP.getSheetByName(TAB_NAME);

  // const columnToCheck = MONITOR_LOGS_TAB.getRange("AC:AC").getValues();
  // const lastRow = _getLastRowSpecial(columnToCheck);
  let data = {};
  const { lastRowNumber, 'recentCasesUID':recentCasesUIDArray } = getRecentSubmittedSID();
  console.log(lastRowNumber)
 

  const submittedCasesUIDArray = caseData.map(e => {
    return {
      id: doGenerateUniqueID(e.studyID,e.caseID),
      caseData: [
        doIdentifyDate(e.lastModifiedDate),
        e.studyID,
        e.caseID,
        e.caseRemarks,
        e.assignedToLDAP,
        e.ARAssignTime
      ]
    }
  });

  const finalData = submittedCasesUIDArray.filter(({ id }) => {
    if (recentCasesUIDArray == undefined) return id
    return recentCasesUIDArray ? !recentCasesUIDArray.includes(id) : id
  })
  // { finalData: [ { id: '3057770-45312000031246', caseData: [Object] } ] }
  const finalCaseData = finalData.map(({caseData}) => {
    let [ 
      lastModifiedDate,
      studyID,
      caseID,
      caseRemarks,
      assignedToLDAP,
      ARAssignTime
    ] = caseData;

    return [
      lastModifiedDate,
      studyID,
      caseID,
      caseRemarks
    ]
  });

  const finalPrioData = finalData.map(({caseData}) => {
    let [ 
      lastModifiedDate,
      studyID,
      caseID,
      caseRemarks,
      assignedToLDAP,
      ARAssignTime
    ] = caseData;

    return [
      assignedToLDAP,
      caseID,
      ARAssignTime
    ]
  });

  console.log({recentCasesUIDArray}, {submittedCasesUIDArray}, {finalData}, {finalCaseData}, {finalPrioData})

  if (finalCaseData.length && finalPrioData.length) {
    console.log(finalCaseData.length, finalPrioData.length)

    // Add Cases from RB
    MONITOR_LOGS_TAB.getRange(lastRowNumber + 1, 29, finalCaseData.length, 4).setValues(finalCaseData);

    // Add assigned LDAPs
    MONITOR_LOGS_TAB.getRange(lastRowNumber + 1, 5, finalPrioData.length, finalPrioData[0].length).setValues(finalPrioData);
    
    return true
  } else return false
}



/* Update
 * request for Update
 *
 * @request-parameter | id<string>, data<JSON>, action<string>
 * @example-request | ?id=1&action=update&data={"email":"test@gmail.com", "username":"testid"}
 */
function doUpdate(req, sheet) 
{
   var id = req.parameter.id;
   var updates = JSON.parse(req.parameter.data);
  
   var lr = sheet.getLastRow();

   var headers = _getHeaderRow(sheet);
   var updatesHeader = Object.keys(updates);
   
   // Looping for row
   for (var row = 1; row <= lr; row++) {
      // Looping for available header / column
      for (var i = 0; i <= (headers.length - 1); i++) {
         var header = headers[i];
         // Looping for column need to updated
         for (var update in updatesHeader) {
            if (updatesHeader[update] == header) {
               // Get ID for every row
               var rid = sheet.getRange(row, 1).getValue();

               if (rid == id) {
                  // Lets Update
                  sheet.getRange(row, i + 1).setValue(updates[updatesHeader[update]]);
               }
            }
         }
      }
   }

   
   // Output
   return response().json({
      status: true,
      message: "Update successfully"
   });
}

// Modified doUpdate for Case State
// Updates specific column for speed purposes
function _doFindCaseIDPosition(caseID){
  let searchKeyword = caseID;
  let caseIDArray = MONITOR_LOGS_TAB
      .getRange(2, 6, MONITOR_LOGS_TAB.getLastRow()-1, 1)
      .getValues()
      .map(r => r[0].toString().toLowerCase());
  let posIndex = caseIDArray.indexOf(searchKeyword.toString().toLowerCase());
  let rowNumber = posIndex === -1 ? 0 : posIndex + 2;

  return rowNumber;
}

function doUpdateCaseState(req){
  let result;
  let {caseID, caseStatus} = req.parameter;
  let rowNumber = _doFindCaseIDPosition(caseID);
  let newCaseStatus = [[caseStatus]];
  
  console.log(rowNumber, caseID, caseStatus);
  
  MONITOR_LOGS_TAB.getRange(rowNumber, 8, 1, 1).setValues(newCaseStatus);
  result = "Updated successfully";

  // Test
  let updatedStatus = MONITOR_LOGS_TAB.getRange(rowNumber, 8, 1, 1).getValues();
  console.log(updatedStatus);

  return response().json({
    status: true,
    message: result
  });
}


/* Delete
 *
 */
function doDelete(req, sheet) {
   var id = req.parameter.id;
   var flag = 0;

   var Row = sheet.getLastRow();
   for (var i = 1; i <= Row; i++) {
      var idTemp = sheet.getRange(i, 3).getValue();
      if (idTemp == id) {
         sheet.deleteRow(i);
         
         var result = "deleted successfully";
         flag = 1;
      }

   }

   if (flag == 0) {
      return response().json({
         status: false,
         message: "ID not found"
      });
   }

   return response().json({
      status: true,
      message: result
   });
}


/* Service
 */
function _readData(sheetObject, properties) {

   if (typeof properties == "undefined") {
      properties = _getHeaderRow(sheetObject);
      properties = properties.map(function (p) {
//         return p.replace(/\s+/g, '_');
        return p;
      });
   }

   var rows = _getDataRows(sheetObject),
      data = [];

   for (var r = 0, l = rows.length; r < l; r++) {
      var row = rows[r],
          record = {};

      for (var p in properties) {
         record[properties[p]] = row[p];
      }

      data.push(record);
   }
   
   return data;
}
function _getDataRows(sheetObject) {
   var sh = sheetObject;

   return sh.getRange(2, 1, sh.getLastRow() - 1, sh.getLastColumn()).getValues();
}
function _getHeaderRow(sheetObject) {
   var sh = sheetObject;

   return sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
}
function response() {
   return {
      json: function(data) {
         return ContentService
            .createTextOutput(JSON.stringify(data))
            .setMimeType(ContentService.MimeType.JSON);
      }
   }
}