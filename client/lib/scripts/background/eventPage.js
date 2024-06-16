var r = /:\/\/(.[^/]+)/;
var prevWebsite='';
var myURL = 'about:blank'; // A default url just in case below code doesn't work


var msgs='';
console.log('start');
var URL= chrome.extension.getURL('../../common/news_websites.json');
var request = new XMLHttpRequest();
request.open('GET', URL , false);  // `false` makes the request synchronous
request.send(null);

if (request.status === 200) {
  var msgs = JSON.parse(request.responseText);

}

var creds; 
var newsKeys;
chrome.storage.sync.get('diiKeys', function (result) {
  console.log('Old Keys:');
  console.log(result);
  creds = result.diiKeys;

});

chrome.storage.sync.get('newsKeys', function (result) {
  console.log('Old Keys:');
  console.log(result);
  newsKeys = result.newsKeys;

});

var websites= msgs.Website;
var domainsList= msgs.Domain;
var comments= msgs.Comments;

var newsOriginContextMenu= {
  'id': 'SsSorigin',
  'title': 'Get probable News ',
  'contexts':['selection']
};

var diiContextMenu = {
  'id': 'diiMenu',
  'title': 'Check image for disinformation',
  'contexts': ['image'],
  // onclick:dii
  // handleImageURL(info.srcUrl);
  // console.log(info.url);
  // }
};
var fnContextMenu = {
  'id': 'fnMenu',
  'title': 'Check for Fake News',
  'contexts': ['selection','link'], 
  // onclick:dii
  // handleImageURL(info.srcUrl);
  // console.log(info.url);
  // }
};

// ################################## Context Menu Options For Report#####################################


var ReportFnMenu = {
  'id': 'reportFNMenu',
  'title': 'Report For Fake News',
  'contexts': ['link', 'selection'],
};

var ReportHsMenu = {
  'id': 'reportHSMenu',
  'title': 'Report For Hate Speech',
  'contexts': ['link', 'selection'],
};


chrome.contextMenus.create(ReportFnMenu);
chrome.contextMenus.create(ReportHsMenu);

// ########### Context Menu Options For SSL & Security Header Checker############
var CheckShcMenu = {
  'id': 'CheckShcMenu',
  'title': 'Check Url Safety',
  'contexts': ['link', 'selection'],
};

var CheckSslMenu = {
  'id': 'CheckSslMenu',
  'title': 'Check SSL Validity',
  'contexts': ['link', 'selection'],
};

chrome.contextMenus.create(CheckShcMenu);
chrome.contextMenus.create(CheckSslMenu);

// ############################################################################



// fact checker context menu
var factCheckerContextMenu = {
  'id': 'fcMenu',
  'title': 'Check for Fact Checker',
  'contexts': ['link', 'selection'],
};

function dii(info){
  console.log(info.srcURL);
}

chrome.contextMenus.create(newsOriginContextMenu);
chrome.contextMenus.create(diiContextMenu);
chrome.contextMenus.create(fnContextMenu);

// add fact Checker Context menu
chrome.contextMenus.create(factCheckerContextMenu);


chrome.contextMenus.onClicked.addListener(function(clickData){
  if(clickData.menuItemId==='SsSorigin' && clickData.selectionText){
    // console.log(clickData.selectionText);
    var xhttp = new XMLHttpRequest();

    xhttp.onreadystatechange = function() {
      if (this.readyState === 4 && this.status === 200) {
      //console.log("received" + clickData.selectionText);
        var data = JSON.parse(xhttp.responseText);
        var info_high = data['HIGH'];
        var info_some = data['SOME'];
        var info_minimal = data['MINIMAL'];

        var notific = {
          type: 'basic',
          title: 'Origin probabilities: ',
          message: 'High:' + info_high + ', SOME: '+ info_some,
          expandedMessage: 'High' + info_minimal,
          iconUrl: '../../assets/icon/72.png'
        };

        console.log(info_high);
        chrome.notifications.create(notific); 
      }
    };

        
    chrome.storage.sync.get('newsKeys', function (result) {
      console.log('Old Keys:');
      console.log(result);
      newsKeys = result.newsKeys;

    });
    xhttp.open('GET', 'https://phcg4hgf84.execute-api.us-east-1.amazonaws.com/dev/pred?text=' + clickData.selectionText + '&key=' + newsKeys, true);
    // xhttp.open('GET', 'http://127.0.0.1:5000/pred?text=' + clickData.selectionText + "&key=" + newsKeys, true);
    xhttp.send();
  }
  
  if(clickData.menuItemId === 'diiMenu'){
    // alert(123)

    var imgSrc = clickData.srcUrl;
    console.log(clickData.srcUrl);

    var urlencoded = new URLSearchParams();

    var requestOptions = {
      method: 'GET',
      redirect: 'follow'
    };

    console.log(creds);

    chrome.storage.sync.get('diiKeys', function (result) {
      console.log('Old Keys:');
      console.log(result);
      creds = result.diiKeys;
    
    });

    fetch('https://j9sgfnzwo8.execute-api.us-east-1.amazonaws.com/dev/lookup/?creds=' + creds + '&link=' + imgSrc, requestOptions)
      .then(response => response.text())
      .then(result = (result) => {
        console.log('result' + result); 
        chrome.windows.create({
          url : 'scripts/content/dii/diiResult.html?api=dii&imgsrc=' + btoa(imgSrc) + '&result=' + btoa(result),
          focused : true,
          type : 'popup'});
      })
      .catch(error = (error)=> {
        console.log('error', error);
      });
  }
  //######################## SHC and SSL Checker Api ######################

  if(clickData.menuItemId === 'CheckShcMenu'){
    // alert(123)
    console.log(clickData);
    let targetUrl = clickData.linkUrl;

    // targetUrl = decodeURIComponent(targetUrl);

    // targetUrl = targetUrl.slice(
    //   targetUrl.indexOf('=') + 1,
    //     targetUrl.lastIndexOf('?'),)

    console.log(typeof(targetUrl));
    var requestOptions = {
      method: 'GET',
    };

    fetch('http://127.0.0.1:5000/shc?url=' + targetUrl,  requestOptions)
      .then(response => response.json())
      .then(result = (result) => {
        console.log(result);
        chrome.windows.create({
          url : 'scripts/content/shc/shcResult.html?api=shc&score=' + btoa(result[Object.keys(result)[0]]) + '&valid=' + btoa(result[Object.keys(result)[1]]) + '&target=' + btoa(result[Object.keys(result)[2]]),
          focused : true,
          type : 'popup'});
      })
      .catch(error = (error)=> {
        console.log('error', error);
      });
  
  }

  if(clickData.menuItemId === 'CheckSslMenu'){
    // alert(123)
    console.log(clickData);
    let targetUrl = clickData.linkUrl;

    console.log(targetUrl);
    var requestOptions = {
      method: 'GET',
    };

    fetch('http://127.0.0.1:5000/ssl?url=' + targetUrl,  requestOptions)
      .then(response => response.json())
      .then(result = (result) => {
        console.log(result);
        // console.log('1');
        chrome.windows.create({
          url : 'scripts/content/shc/shcResult.html?api=ssl&safe=' + btoa(result[Object.keys(result)[0]]) + '&valid=' + btoa(result[Object.keys(result)[1]]) + '&target=' + btoa(result[Object.keys(result)[2]]),
          focused : true,
          type : 'popup'});
      })
      .catch(error = (error)=> {
        console.log('error', error);
      });
  
  }
  // ######################### Fake News New API ##################################

  if(clickData.menuItemId === 'fnMenu'){
    
    let text = '';

    if(clickData.selectionText){
      text = clickData.selectionText;
      checkFakeNews(text);
    }
    else{

      let data = JSON.stringify({'link': clickData.linkUrl});

      let getText = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: data
      };

      fetch('https://se7c1fy10c.execute-api.us-east-2.amazonaws.com/dev/getText',getText)
        .then(response => response.json())
        .then(result =>{
          text = result['searchText'];
          checkFakeNews(text);
        });
    }

  }

  // ###############################################################################

  // report a post
  if (clickData.menuItemId === 'reportFNMenu' || clickData.menuItemId === 'reportHSMenu'){
    saveToLocalAndDB(clickData.menuItemId , clickData);
  }

  // fact checker
  if(clickData.menuItemId === 'fcMenu'){
    
    let text = '';

    if(clickData.selectionText){
      text = clickData.selectionText;
      getFactCheck(text);
    }
    else{

      let data = JSON.stringify({'link': clickData.linkUrl});

      let getText = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: data
      };

      fetch('https://se7c1fy10c.execute-api.us-east-2.amazonaws.com/dev/getText',getText)
        .then(response => response.json())
        .then(result =>{
          text = result['searchText'];
          getFactCheck(text);
        });
    }  
  }
});   

// report posts helper function
function saveToLocalAndDB(menuItemId,clickData){
  if( menuItemId === 'reportFNMenu'){
    //do FN stuffs

    var xhttp = new XMLHttpRequest();

    xhttp.onreadystatechange = function() {
      if (this.readyState === 4 && this.status === 200) {
    
        var data = JSON.parse(xhttp.responseText);
    
        chrome.storage.sync.get('reported_contents', function (result) {
    
          if( Object.keys(result).length === 0 ){
            result = {
              'reported_contents': {
                'reported_fake_news' : {}, // local storage only stores arrays or dict
                'reported_hate_speech' : {}
              },
            }; 
          }
    
          result['reported_contents']['reported_fake_news'][data['text']] = null ;
    
          chrome.storage.sync.set(result, function() {
            console.log(result);
          });
    
        });
        

        var notific = {
          type: 'basic',
          title: 'Reported Successfully ',
          message: 'Thanks for your feedback!! ',
          // expandedMessage: 'High' + info_minimal,
          iconUrl: '../../assets/icon/72.png'
        };
        chrome.notifications.create(notific); 
      }
    };

    if (clickData.selectionText){

      chrome.storage.sync.get('reported_contents', function (result) {

        // request only if not reported earlier
        if(result.reported_contents.reported_fake_news[clickData.selectionText] === undefined){
          xhttp.open('GET', 'https://se7c1fy10c.execute-api.us-east-2.amazonaws.com/dev/reportfake?text=' + clickData.selectionText, true);
          xhttp.send();
        }

      });

    }
    else{
      var raw = JSON.stringify({'link':clickData.linkUrl});

      xhttp.open('POST', 'https://se7c1fy10c.execute-api.us-east-2.amazonaws.com/dev/reportfake', true);
      xhttp.setRequestHeader('Content-type', 'application/json');
      xhttp.send(raw);
    }

  }

  else if ( menuItemId === 'reportHSMenu' ){
    //do HS stuffs

    var xhttp = new XMLHttpRequest();

    xhttp.onreadystatechange = function() {
      if (this.readyState === 4 && this.status === 200) {

        var data = JSON.parse(xhttp.responseText);

        chrome.storage.sync.get('reported_contents', function (result) {
    
          if( Object.keys(result).length === 0 ){
            result = {
              'reported_contents': {
                'reported_fake_news' : {}, // local storage only stores arrays or dict
                'reported_hate_speech' : {}
              },
            }; 
          }
    
          result['reported_contents']['reported_hate_speech'][data['text']] = null ;
    
          chrome.storage.sync.set(result, function() {
            console.log(result);
          });
    
        });
        

        var notific = {
          type: 'basic',
          title: 'Reported Successfully ',
          message: 'Thanks for your feedback!! ',
          // expandedMessage: 'High' + info_minimal,
          iconUrl: '../../assets/icon/72.png'
        };
        chrome.notifications.create(notific); 
      }
    };

    if (clickData.selectionText){

      chrome.storage.sync.get('reported_contents', function (result) {

        // request only if not reported earlier
        if(result['reported_contents']['reported_hate_speech'][clickData.selectionText] === undefined){
          xhttp.open('GET', 'https://se7c1fy10c.execute-api.us-east-2.amazonaws.com/dev/reporthate?text=' + clickData.selectionText, true);
          xhttp.send();
        }

      });

    }
    else{

      var raw = JSON.stringify({'link':clickData.linkUrl});

      xhttp.open('POST', 'https://se7c1fy10c.execute-api.us-east-2.amazonaws.com/dev/reporthate', true);
      xhttp.setRequestHeader('Content-type', 'application/json');
      xhttp.send(raw);
    }

  }
}

// generate keywords
function getSearchKeywords(query){

  const results = new Set();

  results.add(query); // search for the whole text

  let docx = nlp(query);
  let sentences = docx.sentences().data();


  for(let i = 0;i< sentences.length;i++){
    let sent = sentences[i].text;
    results.add(sent);

    let tempDocx = nlp(sent);

    let nounsCombined = tempDocx.nouns().text();
    let adjectivesCombined = tempDocx.adjectives().text();
    let verbsCombined = tempDocx.verbs().text() ;

    let newQuery = nounsCombined;
    if (adjectivesCombined){
      newQuery += (' OR ' +  nounsCombined + ' '  + adjectivesCombined);
    }
    if (verbsCombined){
      newQuery += (' OR ' +  nounsCombined + ' '  + verbsCombined);
    }
  
    results.add(newQuery);
  }

  return results;
};

// search for news using keywords
function getQueryResults(keywords){

  let parser = new DOMParser();
  let unfinishedPromises = [];

  keywords.forEach((query)=>{
    unfinishedPromises.push(
      fetch('https://news.google.com/rss/search?q=' + query + '&hl=en-IN&gl=IN&ceid=IN:en')
        .then(response => response.text())
        .then(xmlString => parser.parseFromString(xmlString, 'text/xml'))
        .then(data => {
          let allTitles = data.querySelectorAll('title');
          let results = [];
          for(let k = 1; k < allTitles.length ; k++){
            results.push(allTitles[k].textContent);
          }
          return results;
        })
    );
  });

  return Promise.all(unfinishedPromises).then((values)=>{
    let relatedArticles = [];
    for(let p = 0; p < values.length;p++){
      relatedArticles = relatedArticles.concat(values[p]);
    }
    return new Set(relatedArticles);
  });  
}

// fact check helper function
function getFactCheck(query){

  var requestOptions = {
    method: 'GET',
    redirect: 'follow'
  };

  // requires user's API key
  chrome.storage.sync.get('newsKeys', function (result) {
    creds = result.newsKeys;

    // fetch when keys are found
    fetch('https://factchecktools.googleapis.com/v1alpha1/claims:search?query=' + query +'&key=' + creds, requestOptions)
      .then(response => response.text())
      .then(result = (result) => {

        let json_result = JSON.parse(result); // save results only when claims are found
        if(json_result['claims']){

          //store to the results to the database
          let saveResultOptions = {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: result
          };

          fetch('https://se7c1fy10c.execute-api.us-east-2.amazonaws.com/dev/savefc',saveResultOptions)
            .then((response) => {
              console.log('Saved Successfully');
            })
            .catch(error = (error)=> {
              console.log('error', error);
            });
        }
        
        chrome.windows.create({
          url : 'scripts/content/dii/fcResult.html?api=fc&src=' + btoa(unescape(encodeURIComponent(result))) + '&searchText=' + btoa(unescape(encodeURIComponent(query))),
          focused : true,
          type : 'popup'});
      })
      .catch(error = (error)=> {
        console.log('error', error);
      });

  });
}

// fake news helper function
function checkFakeNews(query){
  let searchKeyWords = getSearchKeywords(query); // returns a set object
  let relatedArticles = getQueryResults(searchKeyWords); // a promise

  relatedArticles.then((data)=>{ 
    // now send request to server for prediction
    // data returned is of type {set}
    var myHeaders = new Headers();
    myHeaders.append('Content-Type', 'application/json');
    var raw = JSON.stringify({'query':query,'relatedArticles': Array.from(data)}); //cant send set object

    var requestOptions = {
      method: 'POST',
      headers: myHeaders,
      body: raw,
      redirect: 'follow'
    };

    fetch('https://e9jbajkrq6.execute-api.us-east-2.amazonaws.com/dev/predict', requestOptions)
      .then(response => response.text())
      .then(result  = (result) => {
        console.log('result' + result); 
        chrome.windows.create({
          url : 'scripts/content/dii/fnResult.html?api=fn&src=' + btoa(unescape(encodeURIComponent(query))) + '&result=' + btoa(unescape(encodeURIComponent(result))),
          focused : true,
          type : 'popup'});
      })
      .catch(error => alert('error', error));
  });
}


function checkWebsite(myWebsite){

  if (prevWebsite!==myWebsite){
    console.log('visiting: ' + myWebsite);
    // console.log(domainsList.length);

    for(var i = 0, len = 1964; i < len; i++) {
      if ( (myWebsite===domainsList[i]) || (myWebsite.includes(domainsList[i])) || (domainsList[i].includes(myWebsite)) ) { //compares if website is in the list
        var opt = {
          type: 'basic',
          title: 'Webite Info: ' + websites[i],
          message: 'Comments: ' + comments[i],
          iconUrl: '../../assets/icon/72.png'
        };

        chrome.notifications.create(opt);
        break;
      }
    }
  }
  prevWebsite=myWebsite;
}





chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) { // onUpdated should fire when the selected tab is changed or a link is clicked 
  chrome.tabs.getSelected(null, function(tab) {
    myURL = tab.url;
    k=myURL;
    k=myURL.match(r)[1]; 
    myWebsite=k.replace(/^(https?:\/\/)?(www\.)?/,'');  //strips www and https if present
    //console.log(k);
    checkWebsite(myWebsite);

    chrome.storage.sync.set({'website': myWebsite});
  });
});
 








