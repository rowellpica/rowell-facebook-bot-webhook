'use strict';

const async   = require('async');
const FB      = require("./facebook.action");
const request = require("request");
const _       = require("underscore");

module.exports = {
    say(recipientId, context, message, cb) {
        if (recipientId) {
            FB.sendText(recipientId, message, (err, data) => {
                if (err) {
                    console.error('Oops! An error occurred while forwarding the response to', recipientId, ':', err);
                }
                cb();
            });
        } else {
            console.log('Oops! Couldn\'t find user for session:', sessionId);
            cb();
        }
    },
    merge(recipientId, context, entities, message, cb) {
        console.log("merge:", context, entities);
        async.forEachOf(entities, (entity, key, cb) => {
            const value = firstEntityValue(entity);
            if (value != null && (context[key] == null || context[key] != value)) {
                context[key] = value;
                switch (key) {
                    default:
                        cb();
                }
            } else {
                cb();
            }
        }, (error) => {
            if (error) { console.error(error); }
            console.log("Context after merge:\n", context);
            cb(context);
        });
    },
    error(recipientId, context, error) {
        console.log(error.message);
    },
    /**** Add your own functions HERE ******/
    doWelcome(recipientId, context, cb) {
        var message = "Hi! Konichiwa!";
        FB.sendText(recipientId, message, (err, data) => {
            if (err) { console.error('Oops! An error occurred while forwarding the response to', recipientId, ':', err); }
            cb();
        });
    },
    askWhatTodo(recipientId, context, cb) {
        var message = "What can I do for you today?",
            replies = [
                { "content_type":"text","title":"Search for a product.","payload":"PAYLOAD_FOR_SEARCH" },
                { "content_type":"text","title":"Send me today's deal.","payload":"PAYLOAD_FOR_DEALS" }
            ];
        FB.sendTextWithReplies(recipientId, message, replies, (err, data) => {
            if (err) { console.error('Oops! An error occurred while forwarding the response to', recipientId, ':', err); }
            cb();
        });
    },
    askWhatProductToSearch(recipientId, context, cb) {
        var message = "So you want to search a product. What product are you searching?",
            replies = [
                { "content_type":"text","title":"Nike Shoes","payload":"PAYLOAD_FOR_SEARCH_NIKE_SHOES" },
                { "content_type":"text","title":"Bags","payload":"PAYLOAD_FOR_SEARCH_BAGS" },
                { "content_type":"text","title":"White Dress","payload":"PAYLOAD_FOR_SEARCH_WHITE_DRESS" }
            ];
        FB.sendTextWithReplies(recipientId, message, replies, (err, data) => {
            if (err) { console.error('Oops! An error occurred while forwarding the response to', recipientId, ':', err); }
            cb();
        });
    },
    searchOffer(recipientId, context, cb) {
        var query = encodeURIComponent(context.search_query);
        console.log("searchOffer: search for offers with", query);
        var apiRequest = "http://partner.become.co.jp/json?partner=become&filter=All&image_size=200&num=5&start=1&q="+query
        request.get(apiRequest, (err, resp, body) => {
            if (err || resp.statusCode != 200) { console.error('Oops! An error occurred while using become partner api', query); }
            var respBody = body.substr(10),
                respBody = respBody.substr(0, respBody.length - 1),
                apiResponse = JSON.parse(respBody),
                results = apiResponse.service_response.service_response.results.result;
            if (results.length > 0) {
                var offers = []
                _.each(results, function(r) {
                    var offer = {
                      "title": r.title,
                      "subtitle": "¥"+r.max_price,
                      "image_url": r.image_url,
                      "buttons": [
                        {"type": 'web_url', "title": 'View Offer', "url": r.merchant.url},
                        {"type": 'web_url', "title": 'Search More', "url": "www.become.co.jp/"+context.search_query+".html"}
                      ]
                    };
                    offers.push(offer);
                });
                FB.sendStructuredMessage(recipientId, offers, (err, data) => {
                if (err) { console.error('Oops! An error occurred while forwarding the response to', recipientId, ':', err); }
                    cb();
                });
            } else {
                var message = "Sorry but I can't find any offer for " + context.search_query;
                FB.sendText(recipientId, message, (err, data) => {
                if (err) { console.error('Oops! An error occurred while forwarding the response to', recipientId, ':', err); }
                    cb();
                });
            }
        });
    },
    getDeals(recipientId, context, cb) {
        console.log("getDeals", recipientId, context);
        cb();
    }
};

// Helper function to get the first message
const firstEntityValue = (entity) => {
    const val = entity && Array.isArray(entity) &&
            entity.length > 0 &&
            entity[0].value
        ;
    if (!val) {
        return null;
    }
    return typeof val === 'object' ? val.value : val;
};