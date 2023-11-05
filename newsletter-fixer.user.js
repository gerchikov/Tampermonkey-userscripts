// ==UserScript==
// @name         newsletter fixer
// @version      0.3.0
// @description  remove tracking cruft from NYT et al newsletter urls in Gmail
// @author       YDG
// @namespace    https://github.com/gerchikov
// @match        *://mail.google.com/mail/*
// @grant        none
// @updateURL    https://github.com/gerchikov/Tampermonkey-userscripts/raw/main/newsletter-fixer.user.js
// @downloadURL  https://github.com/gerchikov/Tampermonkey-userscripts/raw/main/newsletter-fixer.user.js
// @supportURL   https://github.com/gerchikov/Tampermonkey-userscripts/issues
// ==/UserScript==

const config = [{ search_href: /https:\/\/nl\.nytimes\.com\/f\/.*\/(.*)/i, transform_function: base64_url_extract },
                { search_href: /https:\/\/newslink\.reuters\.com\/click\/.*\/(.*)\/.*(\/email)?/i, transform_function: base64_url_extract },
                { search_href: /https:\/\/link\.popsci\.com\/click\/[^\/]*\/([^\/]*)/i, transform_function: base64_url_extract },
                { search_href: /e\.email\.forbes\.com\/c2\/.*jwtP=([^&]*)/, transform_function: jwt_url_extract },
               ];

function base64decode(a) { return atob(a.replaceAll('-', '+').replaceAll('_', '/').replaceAll('~', '=')); }
function url_extract(b) { return b.match(/https?:\/\/[^?]*/i)[0]; }

function base64_url_extract(matched) { return url_extract(base64decode(matched[1])); }
function jwt_url_extract(matched) { return url_extract(JSON.parse(base64decode(matched[1])).linkUrl);
}

(() => {
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
