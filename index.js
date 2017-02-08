'use strict';

const config = require('./config');
const bodyParser = require('body-parser');
const express = require('express');
const Wit = require('node-wit').Wit;
const FB = require('./facebook.action');
const async = require('async');

const PORT = process.env.PORT || 3000;

if (!config.FB_PAGE_ID) {
    throw new Error('missing FB_PAGE_ID');
}
if (!config.FB_PAGE_TOKEN) {
    throw new Error('missing FB_PAGE_TOKEN');
}

const getFirstMessagingEntry = (body) => {
    if (body.object == 'page' && body.entry &&
        Array.isArray(body.entry) &&
        body.entry.length > 0 &&
        body.entry[0] &&
        body.entry[0].id === config.FB_PAGE_ID &&
        body.entry[0].messaging &&
        Array.isArray(body.entry[0].messaging) &&
        body.entry[0].messaging.length > 0) {
        return body.entry[0].messaging[0];
    } 
    return null;
};

var sessions = {};
const findOrCreateSession = (fbid, cb) => {

    if (!sessions[fbid]) {
        console.log("New Session for:", fbid);
        sessions[fbid] = {context: {}};
    }

    cb(fbid);
};

const actions = require('./wit.actions');
const wit = new Wit(config.WIT_TOKEN, actions);

const app = express();
app.set('port', PORT);
app.listen(app.get('port'));
app.use(bodyParser.json());

app.get('/', (req, res) => {
    if (!config.FB_VERIFY_TOKEN) {
        throw new Error('missing FB_VERIFY_TOKEN');
    }
    if (req.query['hub.mode'] === 'subscribe' &&
        req.query['hub.verify_token'] === config.FB_VERIFY_TOKEN) {
        res.send(req.query['hub.challenge']);
    } else {
        res.sendStatus(400);
    }
});

app.post('/', (req, res) => {
    const messaging = getFirstMessagingEntry(req.body);
    
    if (messaging && messaging.recipient.id === config.FB_PAGE_ID) {
        const sender = messaging.sender.id;

        findOrCreateSession(sender, (sessionId) => {
            async.series(
                [
                    function (callback) {
                        if (messaging.postback) {
                            const postback = messaging.postback;

                            if (postback) {
                                var context = sessions[sessionId].context;
                                FB.handlePostback(sessionId, context, postback.payload, (context) => {
                                    callback(null, context);
                                });
                            }
                            } else {
                            callback(null, {});
                        }
                    },
                    function (callback) {
                        if (messaging.message) {
                            const msg = messaging.message.text;
                            const atts = messaging.message.attachments;

                            if (atts) {
                                FB.sendText(
                                    sender,
                                    'Sorry I can only process text messages for now.'
                                );
                                callback(null, {});

                            } else {

                                console.log("Run wit with context", sessions[sessionId].context);
                                wit.runActions(
                                    sessionId, // the user's current session
                                    msg, // the user's message
                                    sessions[sessionId].context, // the user's current session state
                                    (error, context) => {
                                        if (error) {
                                            console.log('Oops! Got an error from Wit:', error);
                                        } else {
                                            console.log('Waiting for futher messages.');
                                            callback(null, context);
                                        }
                                    }
                                );

                            }
                        } else {
                            callback(null, {});
                        }
                    },
                ],
                function (err, results) {
                    console.log("Session context", sessionId, sessions[sessionId].context, results);
                }
            );
            }
        );
    }
    res.sendStatus(200);
});
