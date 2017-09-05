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
  setTimeout(function(){
    let elements = document.querySelectorAll(selector);
    for(var i = 0; i<elements.length; i++){
      elements[i].addEventListener('click', function(e){
        e.preventDefault();
        optimizelyClient.track(event, userId);
        setTimeout(function(){
          return window.location = e.target.href;
        }, 500);
      });
    }
  }, 2000);
}

trackEvent('.c1-button', 'website_action', getHashValue('userid'));