/**
 * Created by Mykhailo_Bohdanov on 08/07/2015.
 */

//- - - Main - - -
var BUTTONS = {},
    CONTAINERS = {},
    CURRENT_FORM,
    SNAPSHOT,
    _currentTab,
    _url;

function focusOrCreateTab(url) {
    chrome.windows.getAll({"populate": true}, function (windows) {
        var existing_tab = null;
        for (var i in windows) {
            var tabs = windows[i].tabs;
            for (var j in tabs) {
                var tab = tabs[j];
                if (tab.url == url) {
                    existing_tab = tab;
                    break;
                }
            }
        }
        if (existing_tab) {
            chrome.tabs.update(existing_tab.id, {"selected": true});
        } else {
            chrome.tabs.create({"url": url, "selected": true});
        }
    });
}


function showContainer(name) {
    forEach(CONTAINERS, hide);
    show(CONTAINERS[name || 'containerMenu']);
}

function show(element) {
    element.classList.remove('hidden');
}
function hide(element) {
    element.classList.add('hidden');
}

function getById(idName) {
    return document.getElementById(idName);
}
function getByClass(className) {
    return document.querySelectorAll('.' + className);
}

function getFormElements(dom) {
    var returned = {},
        elements = dom.querySelectorAll('input,select,textarea');

    forEach(elements, function (element) {
        returned[element.name] = element;
    });

    return returned;
}
function getDataFormElements(elements) {
    var returned = {};

    forEach(elements, function (element, id) {
        top:
            switch (element.tagName.toLowerCase()) {
                case 'input':
                    switch (element.type) {
                        case 'checkbox':
                            returned[id] = element.checked;
                            break top;
                    }
                case 'select':
                case 'textarea':
                    returned[id] = element.value;
                    break;
            }
    });

    return returned;
}
function clearFormElements(elements) {
    forEach(elements, function (element, id) {
        top:
            switch (element.tagName.toLowerCase()) {
                case 'input':
                    switch (element.type) {
                        case 'checkbox':
                            element.checked = false;
                            break top;
                    }
                case 'select':
                case 'textarea':
                    element.value = null;
                    break;
            }
    });

}

function disableElement(element) {
    element.setAttribute('disabled', true);
}
function enableElement(element) {
    element.removeAttribute('disabled');
}

function initCollect(index) {
    chrome.extension.sendRequest(null, {action: 'get', index: index}, function (snapshot) {
        collectData(snapshot, function (state) {
            chrome.extension.sendRequest(null, {
                action: 'putState',
                index: index,
                state: state
            }, function () {
                window.location.reload();
            });
        });
    });
}
function collectData(snapshot, callBack) {
    var done    = {},
        _callBack = function () {
            var _done = true;

            forEach(done, function (v) {
                if (!v) {
                    _done = false;
                }
            });

            if (_done) {
                callBack(state);
            }
        },
        state   = {},
        d       = new Date();

    state.date  = d.getDate() + '/' + d.getMonth() + '/' + d.getFullYear();
    state.time  = d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds();

    if (snapshot.config.cookies) {
        done.cookies = false;

        chrome.cookies.getAll({url: _url.origin}, function (cookies) {
            state.cookies = {};

            forEach(cookies, function(cookie) {
                state.cookies[cookie.name]  = {
                    domain      : cookie.domain,
                    expiration  : cookie.expirationDate,
                    path        : cookie.path,
                    value       : cookie.value
                };
            });

            done.cookies = true;
            _callBack();
        });
    }

    if (snapshot.config.localStorage) {
        done.localStorage = false;

        chrome.tabs.sendRequest(_currentTab.id, function(response) {
            state.localStorage = response;

            console.log(response);

            done.localStorage = true;
            _callBack();
        });
    }
}

var commonFN = {
    showFormSnapshot: function () {
        showContainer('containerSnapshotCreate');

        CURRENT_FORM = getFormElements(CONTAINERS['containerSnapshotCreate']);
        clearFormElements(CURRENT_FORM);
    },
    createSnapshot: function () {
        var data = getDataFormElements(CURRENT_FORM);

        var options = {
            domain: _url.host,
            config: data,
            action: 'set'
        };

        chrome.extension.sendRequest(null, options, function (newSnapshot) {
            initCollect(newSnapshot.index);
        });
    },
    next: function () {
        chrome.extension.sendRequest(null, {action: 'getForDomain', domain: _url.host}, function (response) {
            var wrapper = getById('snapshotList');

            wrapper.innerHTML = '';

            forEach(response, function (snapshot, index) {
                var element = document.createElement('button');

                element.className = 'btn btn-block btn-default btn-sm mt5';
                element.innerText = snapshot.config.name + ' (' + snapshot.states.length + ')';
                element.setAttribute('snapshot', index);

                element.addEventListener('click', function () {
                    commonFN.nextDo.call(element);
                });

                wrapper.appendChild(element);
            });

            showContainer('containerSnapshotList');
        });
    },
    nextDo: function () {
        var index = parseInt(this.getAttribute('snapshot'));

        initCollect(index);
    },

    diff: function () {
        chrome.extension.sendRequest(null, {action: 'getForDomain', domain: _url.host}, function (response) {
            var wrapper = getById('snapshotList');

            wrapper.innerHTML = '';

            forEach(response, function (snapshot, index) {
                var element = document.createElement('button');

                element.className = 'btn btn-block btn-default btn-sm mt5';
                element.innerText = snapshot.config.name + ' (' + snapshot.states.length + ')';
                element.setAttribute('snapshot', index);

                element.addEventListener('click', function () {
                    commonFN.diffDo.call(element);
                });

                wrapper.appendChild(element);
            });

            showContainer('containerSnapshotList');
        });
    },
    diffDo: function () {
        var index   = parseInt(this.getAttribute('snapshot'));

        var manager_url = chrome.extension.getURL("diff.html?index=" + index);
        focusOrCreateTab(manager_url);
    },

    removeSnapshotsCurrent: function () {
        chrome.extension.sendRequest(null, {action: 'removeForDomain', domain: _url.host}, function () {
            window.location.reload();
        });
    },
    removeSnapshotsAll: function () {
        chrome.extension.sendRequest(null, {action: 'removeAll'}, function () {
            window.location.reload();
        });
    },

    clearData: function () {
        chrome.cookies.getAll({url: _url.origin}, function (cookies) {
            forEach(cookies, function(cookie) {
                chrome.cookies.remove({url : _url.origin, name: cookie.name});
            });
        });
    },

    cancel: function () {
        showContainer('containerMenu');
    }
};
//- - - /Main - - -
document.addEventListener('DOMContentLoaded', function () {
    chrome.tabs.query({active: true}, function (tab) {
        _currentTab = tab[0];
        _url = new URL(_currentTab.url);

        chrome.extension.sendRequest(
            null,
            {
                action: 'countStates',
                domain: _url.host
            },
            function (response) {
                if (response.statesCount) {
                    forEach(getByClass('snapshotExistsCurrent'), enableElement);
                } else {
                    forEach(getByClass('snapshotExistsCurrent'), disableElement);
                }
            }
        );
    });

    chrome.extension.sendRequest(null, {action: 'countAll'}, function (response) {
        if (response.statesCount) {
            forEach(getByClass('snapshotExistsAll'), enableElement);
        } else {
            forEach(getByClass('snapshotExistsAll'), disableElement);
        }
    });

    var containers = document.querySelectorAll('.container'),
        buttons = document.querySelectorAll('button.action');

    forEach(containers, function (element) {
        CONTAINERS[element.id] = element;
    });

    forEach(buttons, function (button) {
        BUTTONS[button.id] = button;
        button.addEventListener('click', commonFN[button.getAttribute('action')]);
    });
});

/*

 http://stackoverflow.com/questions/629671/how-can-i-intercept-xmlhttprequests-from-a-greasemonkey-script
 https://ajax.googleapis.com/ajax/services/search/images?v=1.0&q=test


 */










