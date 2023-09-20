// ==UserScript==
// @name         NYT/Reuters newsletter fixer
// @version      0.1
// @description  remove tracking cruft from NYT and Reuters newsletter urls
// @author       YDG
// @match        *://mail.google.com/mail/*
// ==/UserScript==

// TODO: put me on GitHub + add update URL?

const config = [{ search_href: /https:\/\/nl.nytimes.com\/f\/.*\/(.*)/i, transform_function: base64decode },
                { search_href: /https:\/\/newslink.reuters.com\/click\/.*\/(.*)\/.*(\/email)?/i, transform_function: base64decode },
                { search_href: /https:\/\/link.popsci.com\/click\/[^\/]*\/([^\/]*)/i, transform_function: base64decode },
               ];

function base64decode(matched) {
    return atob(matched[1].replaceAll('-', '+').replaceAll('_', '/').replaceAll('~', '=')).match(/https?:\/\/[^?]*/i)[0];
}

(function() {
    'use strict';

    function replace_hrefs(message) {
        var hrefs_replaced = 0;
        message.querySelectorAll('a[href]').forEach(a => {
            config.forEach(c => {
                const search_match = a.href.match(c.search_href);
                if (search_match) {
                    const new_href = c.transform_function(search_match);
                    console.debug(a.href, '=>', new_href);
                    a.href = new_href;
                    hrefs_replaced++;
                }
            });
        });
        return hrefs_replaced;
    }

    // Is this a single static Gmail message, as happens if "[Message clipped]  View entire message" in main UI is clicked
    const permmsgid_match = document.location.search.match(/[?&]permmsgid=([^&]*)/i);
    if (permmsgid_match) {
        console.debug('Gmail permmsgid=' + permmsgid_match[1]);
        const hrefs_replaced = replace_hrefs(document);
        if (hrefs_replaced) {
            console.debug('hrefs_replaced=' + hrefs_replaced);
        }
        return; // it's static, doesn't seem to ever mutate/reload, so no need to observe. We're done!
    }

    const count = { observations: 0, mutations: 0, messages_seen: 0, hrefs_replaced: 0, hot_messages: new Set() };

    // TODO: the following works for "Vertical Split". How about horizontal, or no split?
    // TODO: how about Gmail HTML-only UI?
    // TODO: limit what we're observing?
    const observer = new MutationObserver(mutations => {
        count.observations++;
        count.mutations += mutations.length;
        const message = document.querySelector('div[role=main] div[data-message-id]'); // only one message per main, but can be more total (one in each folder?)
        if (!message) { return; }
        const message_id = message.getAttribute('data-message-id');
        if (count.last_message_id != message_id) {
            count.last_message_id = message_id;
            count.messages_seen++;
        } else if (!count.hot_messages.has(message_id)) { return; }

        const hrefs_replaced = replace_hrefs(message);
        if (hrefs_replaced) {
            count.hrefs_replaced += hrefs_replaced;
            count.hot_messages.add(message_id); // re-process matching messages in case one is reloaded in-place
        }
        console.debug(count);
    });
    observer.observe(document.documentElement, { childList: true, subtree: true/*, attributeFilter: ['data-message-id']*/ });

//    GM_registerMenuCommand('Show Me!', () => console.log(count));
})();