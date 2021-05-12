// const SPR_DUMP = SpreadsheetApp.openById("1k2jLrOAeCG3vvCxX1xm205fztiXoAEuFuqPDGJk3Ln4");
// const MONITOR_LOGS_TAB = SPR_DUMP.getSheetByName("Monitor Logs");

function getMonitoringLogsData() {
  let data = MONITOR_LOGS_TAB.getDataRange().getValues();


  console.log(data.length);
}


function fetchTest(){
  const URL = "https://script.google.com/a/macros/google.com/s/AKfycbwey7b36eX2Er8jnJXi04UhW01-U2LONfM_YoOz6LSI/dev?action=read";
  const URL2 = "https://script.google.com/a/macros/google.com/s/AKfycbwey7b36eX2Er8jnJXi04UhW01-U2LONfM_YoOz6LSI/dev";
  const options = {
    method: 'POST',
    followRedirects: true,
    cache: 'no-cache'
  };

  // var response = UrlFetchApp.fetch(URL, options);
  var response = UrlFetchApp.fetch(URL2, {method: 'GET', followRedirects: true})
  Logger.log(response);
}

function testGetRow(){
  let sampleRow = 10321;
  let rid = MONITOR_LOGS_TAB.getRange(sampleRow, 8).getValue();

  console.log({rid})

}
