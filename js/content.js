/**
 * Created by Mykhailo_Bohdanov on 13/07/2015.
 */
console.log('content script here');

chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
    switch (request.action) {
        case 'getCookies':
            sendResponse(getCookies());
            break;
        case 'setCookies':

            break;
        case 'removeCookies':

            break;

        case 'clearAll':
            clearCookies();
            clearLocalStorage();
            break;

    }
});

function clearCookies() {
    var cookies = getCookies();

    forEach(cookies, function(cookie, name) {
        deleteCookie(name);
    });
}
function clearLocalStorage() {

}



(function(open) {

    XMLHttpRequest.prototype.open = function(method, url, async, user, pass) {

        this.addEventListener("readystatechange", function() {
            console.log(this.readyState);
        }, false);

        open.call(this, method, url, async, user, pass);
    };

})(XMLHttpRequest.prototype.open);