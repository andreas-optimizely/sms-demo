'use strict';
const         express = require('express'),
               twilio = require('twilio'),
           bodyParser = require('body-parser'),
                 uuid = require('uuid/v4'),
           optimizely = require('optimizely-server-sdk'),
  defaultErrorHandler = require('optimizely-server-sdk/lib/plugins/error_handler'),
        defaultLogger = require('optimizely-server-sdk/lib/plugins/logger'),
              request = require('request-promise');

const app = express();
const projectId = '8430132013';
const datafileUrl = `https://cdn.optimizely.com/json/${projectId}.json`;

let optimizelyClient;

// Initialize Optimizely client on server start
request({uri: datafileUrl, json: true}).then((datafile) => { 
  console.log('Initializing Optimizely Client with Datafile: ', datafile);
  optimizelyClient = optimizely.createInstance({
    datafile: datafile,
    errorHandler: defaultErrorHandler,
    logger: defaultLogger.createLogger()
  });
});

app.use(bodyParser.urlencoded({ extended: false }));

app.get('/', (req, res) => {
  res.send('SMS Full Stack Bot');
});

// Webhook URL for SMS
app.post('/sms-webhook', (req,res)=>{
  let msg = req.body.Body.toLowerCase();
  let twiml = new twilio.twiml.MessagingResponse();

  // Generate random user id to simulate random bucketing
  let userId = uuid();
  let fromNumber = req.body.From;
  let variation;
  console.log(req.body);
  
  console.log(fromNumber);

  if(msg === "hello" || msg ==='hi' || msg ==='hey'){
    
    let response = 'Hey I know this is our first time, my job is to make your life easier, how can I help you?';
    variation = optimizelyClient.activate('introduction_experiment', userId);
    
    console.log(variation);

    variation === "video_demo" ? response += ' Here\'s a quick video to show you what I can do https://youtu.be/jvyHcjZoGJk' : null;
    twiml.message(response);

  } else if (msg.includes('mail') || msg.includes('send') && msg.includes('payment')) {
    let response = "Since you're in, " + req.body.ToCity + " here's the closest place to mail your payment, 123 Main St, San Francisco, CA 94105";
    variation = optimizelyClient.activate('mail_experiment', userId);
    console.log(variation);
    
    if (variation === "app"){
      response = 'Instead of mailing your payment, you can go paperless and save the postage by paying via our app. http://apple.co/1HQ8ikO';
    }

    else if(variation === "eno"){
      response = 'Did you know I can also make payments for you? Just tell me which card and how much';
    }

    twiml.message(response);
  } else if (msg == '\U0001F44D'){
    twiml.message('\U0001F44D');

  } else {
    twiml.message('Sorry I didn\'t get that. Try asking something like, "Mail my payement"');
  }

  optimizelyClient.track("sent_msg", userId);

  res.writeHead(200, {'Content-Type': 'text/xml'});
  res.end(twiml.toString());
});

app.listen(process.env.PORT || 3000, function(){
  console.log("Up and running - check localhost:3000 for local dev");
});