/**
 * Created by Mykhailo_Bohdanov on 13/07/2015.
 */
var domain          = $('#domain'),
    snapshotName    = $('#snapshotName'),
    shotRange       = $('#shotRange'),

    cookiesDiff     = $('#cookiesDiff'),
    localStorageDiff= $('#localStorageDiff'),

    SNAPSHOT;

function init() {
    if (SNAPSHOT.states.length > 1) {
        var length  = SNAPSHOT.states.length,
            grid    = [];


        forEach(SNAPSHOT.states, function(state) {
            grid.push(state.time);
        });

        shotRange.ionRangeSlider({
            type            : 'double',
            min             : 0,
            max             : length - 1,
            from            : length - 2,
            to              : length - 1,
            min_interval    : 1,
            drag_interval   : true,
            grid            : true,
            grid_num        : length,
            values          : grid,
            onFinish        : function(data) {
                diffState(data.from, data.to);
            },
            onStart        : function(data) {
                diffState(data.from, data.to);
            }
        });
    }

}

function diffState(indexFirst, indexLast) {
    var states  = SNAPSHOT.states.slice(indexFirst, indexLast + 1),
        diffs   = [],
        diff, state1, state2;

    for (var i = 1; i < states.length; i++) {
        diff    = {};

        state1  = states[i - 1];
        state2  = states[i];

        diff.timeLeft   = state1.time;
        diff.timeRight  = state2.time;

        if (SNAPSHOT.config.cookies) {
            //TODO diff cookie elements

            //diff.cookies    = diffCookies(makeCookie(state1.cookies), makeCookie(state2.cookies));
        }



        diffs.push(diff);
    }

    buildTable(diffs);
}
function diff(oldObj, newObj, oldHasOwn, newHasOwn) {
    if (isUndefined(oldHasOwn) && isUndefined(newHasOwn)) {
        oldHasOwn   = true;
        newHasOwn   = true;
    }

    var difference  = {
            status  : 0,
            value   : {},
            type    : typeof oldObj,
            newType : typeof newObj
        },
        oldType = difference.type,
        newType = difference.newType;

    switch (oldType + '-' + newType) {
        case 'object-object':
            difference.value    = {};

            forEach(oldObj, function(value, key) {
                var newValue    = newObj[key];

                this.value[key] = diff(value, newValue, key in oldObj, key in newObj);

                if (this.value[key].status != -1) {
                    this.status = 1;
                }
            }, difference);

            forEach(newObj, function(value, key) {
                if (!oldObj[key]) {
                    this.value[key] = diff(oldObj, value, false, true);
                    this.status = 1;
                }
            }, difference);
            break;
        case 'object-undefined':
            forEach(oldObj, function(value, key) {
                this.value[key] = diff(value, undefined, true, false);
            }, difference);

            if (newHasOwn) {
                difference.status   = 1;
            } else {
                difference.status   = -2;
            }
            break;
        case 'undefined-object':
            forEach(newObj, function(value, key) {
                this.value[key] = diff(undefined, value, false, true);
            }, difference);

            if (oldHasOwn) {
                difference.status   = 1;
            } else {
                difference.status   = -2;
            }
            break;
        default:
            difference.value    = oldObj;

            if (oldObj === newObj) {
                difference.status   = -1;
            } else if (newObj === undefined && !newHasOwn) {
                difference.status   = -2;
            } else {
                difference.status   = 1;
                difference.newValue = newObj;
            }
            break;
    }

    return difference;
}

function diffChanges(oldObj, newObj, hasOwnOld, hasOwnNew) {
    var difference  = {
        type    : typeof oldObj,
        status  : 0,
        value   : undefined
    };

    switch (difference.type) {
        case 'object':
            difference.value = {};

            if (typeof newObj === 'undefined') {
                forEach(oldObj, function(value, key) {
                    this.value[key] = diffChanges(value, undefined, key in oldObj, false);

                    if (!hasOwnNew) {
                        this.status     = -2;
                    } else {
                        this.status     = 1;
                        this.newValue   = newObj;
                    }
                }, difference);

                break;
            }

            forEach(oldObj, function(value, key) {
                var newValue    = newObj[key];

                this.value[key] = diffChanges(value, newValue, key in oldObj, key in newObj);

                if (this.value[key].status != -1) {
                    this.status   = 1;
                }
            }, difference);

            forEach(newObj, function(value, key) {
                if (!oldObj[key]) {
                    var _oldObj;
                    switch (typeof value) {
                        case 'object':
                            _oldObj = {};
                            break;
                        default:
                            _oldObj = undefined;
                            break;
                    }

                    this.value[key] = diffChanges(_oldObj, value, false, true);
                    this.value[key].status  = 2;
                }
            }, difference);
            break;
        case 'undefined':
            if (!hasOwnOld) {
                difference.status   = 2;
                difference.newValue = newObj;
                break;
            }
        default:
            difference.value    = oldObj;

            if (oldObj === newObj) {
                difference.status   = -1;
            } else if (newObj === undefined && !hasOwnNew) {
                difference.status   = -2;
            } else {
                difference.status   = 1;
                difference.newValue = newObj;
            }
            break;
    }

    return difference;
}


function buildTable(data) {
    var table   = document.createElement('table');


    console.log(data);

}


document.addEventListener('DOMContentLoaded', function() {
    var search = {};

    forEach(location.search.substring(1).split('&'), function(data) {
        data = data.split('=');

        search[data[0]] = data[1];
    });

    chrome.extension.sendRequest(null, {action: 'get', index: search.index}, function(snapshot) {
        if (snapshot) {
            domain.text(snapshot.domain);
            snapshotName.text(snapshot.config.name);

            SNAPSHOT    = snapshot;
            init();
        }
    });
});

