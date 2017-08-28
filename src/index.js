'use strict'

const optimizely = require('optimizely-client-sdk');

let projectID = '8410977336';

let dataFileUrl = `https://cdn.optimizely.com/json/${projectID}.json`;
let dataFile = $.ajax({type: "GET", url: dataFileUrl, async: false}).responseText;

let optimizelyClient = optimizely.createInstance({ datafile: JSON.parse(dataFile) });

function getHashValue(key) {
  var matches = location.hash.match(new RegExp(key+'=([^&]*)'));
  return matches ? matches[1] : null;
}

function trackEvent(selector, event, userId){
  console.log('tracking event init ', selector);
  setTimeout(function(){
    let element = document.querySelector(selector);
    element.addEventListener('click', function(e){
      e.preventDefault();
      console.log('clicked! ', userId);
      optimizelyClient.track(event, userId);
      // return window.location = element.href;
    });
  }, 3000)
}

trackEvent('#bannerBtn', 'website_action', getHashValue('userid'));