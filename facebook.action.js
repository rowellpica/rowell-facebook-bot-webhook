'use strict';

const config = require('./config');
const request = require('request');

const FBRequest = request.defaults({
    uri: 'https://graph.facebook.com/me/messages',
    method: 'POST',
    json: true,
    qs: {access_token: config.FB_PAGE_TOKEN},
    headers: {'Content-Type': 'application/json'},
});

const TEMPLATE_GENERIC = "generic";
const TED_GET_STARTED_PAYLOAD = "TED_GET_STARTED_PAYLOAD";

module.exports = {

    handlePostback(recipientId, context, payload, cb) {
        console.log("Received payload for", recipientId, payload, context);

        switch (payload) {
            case TED_GET_STARTED_PAYLOAD:
                // this.sendText(recipientId, "Hi there! My name is Ted and right now, I'm still just a simple robot.", () => {
                //     this.sendText(recipientId, "I will try to send you motivational messages as often as I can.", () => {
                //         cb(context);
                //     });
                // });
                break;
        }
    },

    sendText(recipientId, msg, cb){

        if (msg.length > 320) msg = msg.substr(0, 320);

        const opts = {
            form: {
                recipient: {
                    id: recipientId,
                },
                message: {
                    text: msg,
                },
            },
        };

        FBRequest(opts, (err, resp, data) => {
            if (cb) {
                cb(err || data.error && data.error.message, data);
            }
        });
    },

    sendTextWithReplies(recipientId, msg, replies, cb){

        if (msg.length > 320) msg = msg.substr(0, 320);

        const opts = {
            form: {
                recipient: {
                    id: recipientId,
                },
                message: {
                    text: msg,
                    quick_replies: replies
                },
            },
        };

        FBRequest(opts, (err, resp, data) => {
            if (cb) {
                cb(err || data.error && data.error.message, data);
            }
        });
    },


    sendStructuredMessage(recipientId, elements, cb) {

        if (!Array.isArray(elements)) elements = [elements];
        if (elements.length > 10) throw new Error("sendStructuredMessage: FB does not allow more then 10 payload elements");

        const payload = {
            "template_type": TEMPLATE_GENERIC,
            "elements": elements,
        };
        this._sendFBRequest(recipientId, payload, cb);
    },

    _sendFBRequest(recipientId, payload, cb) {

        const opts = {
            form: {
                recipient: {
                    id: recipientId,
                },
                message: {
                    attachment: {
                        type: "template",
                        payload: payload,
                    }
                }
            },
        };

        FBRequest(opts, (err, resp, data) => {
            if (cb) {
                cb(err || data.error && data.error.message, data);
            }
        });
    },

    generatePayloadElement(title, click_url, image_url, sub_title, buttons) {

        if (!Array.isArray(buttons)) buttons = [buttons];

        return {
            title: title,
            subtitle: sub_title,
            item_url: click_url,
            image_url: image_url,
            buttons: buttons,
        };
    },

    generateWebLinkButton(title, url) {
        return {
            type: "web_url",
            url: url,
            title: title,
        }
    },

    generateActionButton(title, payload) {
        return {
            "type": "postback",
            "title": title,
            "payload": payload,
        };
    },
};