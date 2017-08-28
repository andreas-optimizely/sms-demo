'use strict';
require('dotenv').config();

const         express = require('express'),
                path  = require('path'),
               twilio = require('twilio'),
           bodyParser = require('body-parser'),
                 uuid = require('uuid/v4'),
           optimizely = require('optimizely-server-sdk'),
  defaultErrorHandler = require('optimizely-server-sdk/lib/plugins/error_handler'),
        defaultLogger = require('optimizely-server-sdk/lib/plugins/logger'),
              request = require('request-promise'),
              sg = require('sendgrid')(process.env.SENDGRID_API_KEY);

const app = express();
const projectId = '8410977336';
const datafileUrl = `https://cdn.optimizely.com/json/${projectId}.json`;
const views = path.join(__dirname, "views");
const build = path.join(__dirname, "build");

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
app.use(express.static('views'));
app.use(express.static('build'));

app.get('/', (req, res) => {
  let homeView = path.join(views, "form.html");
  res.sendFile(homeView);
});

app.post('/send-message', (req, res)=>{
  let email  = req.body.email,
      variation = optimizelyClient.activate('email_subject_test', email),
      helper = require('sendgrid').mail,
      from_email = new helper.Email('andreas@optimizely.com', 'Andreas'),
      to_email = new helper.Email(email),
      subject,
      content;

  console.log(email);
  console.log(encodeURIComponent(email))
  console.log(variation);

  if(variation === "default"){
    subject = 'Never Miss a Payment Again. Introducing The Capital One Unique Card!';
    content = new helper.Content("text/html", '<html><div align="center" style="max-width:580px; margin:0 auto;"><img style="width:100%; margin:0 auto;" src="https://www.capitaloneonline.co.uk/CapitalOne_Consumer/images/capitalone_banner.jpg"><p>Tired of other banks, who thrive on your late fees? Come on over to the Capital One Unique Card, where we always alert you before you miss a payment. <a href="https://www.capitalone.com/#userid=' + email + '">Apply now!</a></p></div></html>');
  } else if(variation === "variation"){
    subject = 'Your Unique Card Offer is Waiting!';
    content = new helper.Content("text/html", '<html><div align="center" style="max-width:580px; margin:0 auto;"><img style="width:100%; margin:0 auto;" src="https://www.capitaloneonline.co.uk/CapitalOne_Consumer/images/capitalone_banner.jpg"><p>Never miss a payment again, with the Capital One Unique Card’s built in payment and credit limit alerts. Your financial well being is our business. Click <a href="https://www.capitalone.com/#userid=' + email + '">here</a> to learn more about how Capital One has your back!</p></div></html>');
  }

  let mail = new helper.Mail(from_email, subject, to_email, content);

  var request = sg.emptyRequest({
    method: 'POST',
    path: '/v3/mail/send',
    body: mail.toJSON()
  });

  sg.API(request, function(error, response) {
    console.log('ERROR ', error);
    console.log('RESPONSE ', response);
    return response ? res.sendStatus(204) : res.sendStatus(500);
  });
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
  console.log('Update');
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