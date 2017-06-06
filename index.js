'use strict';
const express = require('express'),
        ngrok = require('ngrok'),
       twilio = require('twilio'),
   bodyParser = require('body-parser'),
         uuid = require('uuid');

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));

app.get('/', (req, res) => {
  res.send('SMS Full Stack Bot');
});

app.post('/sms-webhook', (req,res)=>{
  let msg = req.body.Body.toLowerCase();
  var twiml = new twilio.twiml.MessagingResponse();

  if(msg === "hello"){
    twiml.message("Hey there!");
  } else if (msg.includes('mail') && msg.includes('payment')) {
    twiml.message("Looking to mail your credit card payment?");
  }

  res.writeHead(200, {'Content-Type': 'text/xml'});
  res.end(twiml.toString());
});

app.listen(process.env.PORT || 3000, function(){
  console.log("Up and running - check localhost:3000 for local dev");
});