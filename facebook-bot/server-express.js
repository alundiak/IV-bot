// https://quantizd.com/building-facebook-messenger-bot-with-nodejs/
// https://github.com/waleedahmad/Aww-Bot
'use strict';
require('dotenv').config(); // will provide access for all files.

const express = require('express');
const bodyParser = require('body-parser');
const { handleMessage, handlePostBack } = require('./src/handlers');

const port = 8989;
const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/', (req, res) => res.send('Hello. Andrii Lundiak here, with Facebook/Messenger Chat Bot experiments!'));

// Adds support for GET requests to our webhook
// Looks like used for initial setup - to verify webhook.
app.get('/webhook', (req, res) => {

    // Your verify token. Should be a random string, but the same for all future usage.
    const VERIFY_TOKEN = '1489296110';

    // Parse the query params
    let mode = req.query['hub.mode'];
    let verifyToken = req.query['hub.verify_token'];
    let challenge = req.query['hub.challenge'];

    console.log(mode, verifyToken, challenge);

    // Checks if a token and mode is in the query string of the request
    if (mode && verifyToken) {

        // Checks the mode and token sent is correct
        if (mode === 'subscribe' && verifyToken === VERIFY_TOKEN) {

            // Responds with the challenge token from the request
            console.log('WEBHOOK_VERIFIED');
            res.status(200).send(challenge);

        } else {
            // Responds with '403 Forbidden' if verify tokens do not match
            res.sendStatus(403);
        }
    }
});

app.post('/webhook', (req, res) => {
    // console.log(res);

    let body = req.body;

    console.log(body);

    console.log(JSON.stringify(body));

    // Possible values: "user", "application", "instagram" and other from FB APP Webhook config page AFTER SUBSCRIPTION (+VERIFY)
    if (body.object === 'page') {

        body.entry.forEach(function (entry) {
            // console.log('Webhook Entry', entry);
            console.log('Webhook Entry ID', entry.id);
            console.log('Webhook Entry Messaging Array', entry.messaging);

            const { id: PAGE_ID } = entry; // "TestBot" page ID.

            // Gets the message. entry.messaging is an array, but
            // will only ever contain one message, so we get index 0
            let webhook_event = entry.messaging[0];
            // console.log('Webhook Entry webhook_event', webhook_event);
            let { id:sender_psid } = webhook_event.sender;
            // sender: { id: '15968***37708' } - TestBot FB Page ID.
            // sender: { id: '20112***59139' } - Andrii Lundiak ID
            // sender => recipient
            // recipient => sender
            // etc

            const userId = sender_psid; // Andrii Lundiak and other users/IDs (if POSTBACK)

            let { id:recipient_psid } = webhook_event.recipient;
            // const userId = recipient_psid; // TestBot page or IV-Bot app

            if (webhook_event.message) {
                // let sender_psid = webhook_event.sender.id;
                handleMessage(sender_psid, webhook_event.message, userId);
            } else if (webhook_event.postback) {
                // let sender_psid = webhook_event.recipient.id;
                // "messaging_postbacks" event must be enabled in Messenger/Webhooks

                // https://developers.facebook.com/docs/messenger-platform/reference/webhook-events/messaging_postbacks
                // webhook_event =>
                //  "sender":{
                //     "id":"<PSID>"
                //   },
                //   "recipient":{
                //     "id":"<PAGE_ID>"
                //   },
                // + postback
                // https://developers.facebook.com/docs/pages/access-tokens/psid-api/faq/
                // https://developers.facebook.com/docs/messenger-platform/identity/id-matching

                handlePostBack(sender_psid, webhook_event.postback, userId);
            }
        });

        res.status(200).send('EVENT_RECEIVED');
    } else {
        // Returns a '404 Not Found' if event is not from a page subscription
        res.sendStatus(404);
    }

});

app.get('/google', (req, res) => {
    // TODO verify token, etc.
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));