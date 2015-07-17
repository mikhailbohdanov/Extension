/**
 * Created by Mykhailo_Bohdanov on 13/07/2015.
 */
var domain          = $('#domain'),
    snapshotName    = $('#snapshotName'),
    shotRange       = $('#shotRange'),

    cookiesDiff     = $('#cookiesDiff'),
    cookiesWrapper  = $('#cookiesWrapper'),

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
        _diff, state1, state2;

    for (var i = 1; i < states.length; i++) {
        _diff   = {};

        state1  = states[i - 1];
        state2  = states[i];

        _diff.timeLeft  = state1.time;
        _diff.timeRight = state2.time;

        if (SNAPSHOT.config.cookies) {
            _diff.cookies   = diff(state1.cookies, state2.cookies);
        }

        diffs.push(_diff);
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

                this.value[key] = diff(value, newValue, true, key in newObj);

                if (this.value[key].status != -1) {
                    this.status = 1;
                }
            }, difference);

            forEach(newObj, function(value, key) {
                if (!oldObj[key]) {
                    this.value[key] = diff(undefined, value, false, true);
                    this.status = 1;
                }
            }, difference);

            if (difference.status == 0) {
                difference.status   = -1;
            }
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
            difference.newValue = {};

            forEach(newObj, function(value, key) {
                this.newValue[key]  = diff(undefined, value, false, true);
            }, difference);

            if (!oldHasOwn) {
                difference.status   = 2;
            } else {
                difference.status   = 1;
            }
            break;
        default:
            if (oldType == 'object') {
                forEach(oldObj, function(value, key) {
                    this.value[key] = diff(value, undefined, true, false);
                }, difference);

                difference.status   = 1;
            } else if (newType == 'object') {
                forEach(newObj, function(value, key) {
                    this.value[key] = diff(undefined, value, false, true);
                }, difference);

                difference.status   = 1;
            } else {
                difference.value    = oldObj;

                if (oldObj === newObj) {
                    difference.status   = -1;
                } else if (newObj === undefined && !newHasOwn) {
                    difference.status   = -2;
                } else if (oldObj === undefined && !oldHasOwn) {
                    difference.status   = 2;
                    difference.newValue = newObj;
                } else {
                    difference.status   = 1;
                    difference.newValue = newObj;
                }
            }
            break;
    }

    switch (difference.status) {
        case -2:
        case -1:
            delete difference.newValue;
            delete difference.newType;
            break;
        case 2:
            delete difference.value;
            delete difference.type;
    }

    return difference;
}

function buildTable(data) {
    var tableData, i, tmp, table, row, cell, header, p, strong;

    if (SNAPSHOT.config.cookies) {
        // Cookies

        tableData   = {};

        for (i = 0; i < data.length; i++) {
            tmp = data[i].cookies.value;

            forEach(tmp, function(cookie, name) {
                if (!tableData[name]) {
                    tableData[name] = [];
                }

                tableData[name][i]  = cookie;
            });
        }

        createTable(tableData, cookiesWrapper);
    }



}
function createTable(tableData, insertTo) {
    var i, table, row;

    table   = document.createElement('table');
    table.className = 'table table-bordered';

    forEach(tableData, function(data , name) {
        row = table.insertRow(-1);

        for (i = 0; i < data.length; i++ ) {
            insertValue(row, name, data[i]);
        }
    });

    insertTo
        .empty()
        .append(table);
}
function insertValue(row, name, data) {
    var cell    = row.insertCell(-1),
        p, type;

    if (data) {
        switch (data.status) {
            case -2:
                cell.className  = 'danger';
                break;
            case 1:
                cell.className  = 'warning';
                break;
            case 2:
                cell.className  = 'success';
                break
        }

        p   = document.createElement('p');
        p.innerHTML = '<strong>Name:</strong> ' + name;
        cell.appendChild(p);

        forEach(data.value || data.newValue, function(value, _name) {
            p   = document.createElement('p');

            p.innerHTML = '<strong>' + _name + ': </strong>';
            switch (value.status) {
                case -2:
                case -1:
                    p.innerHTML += value.value;
                    break;
                case 1:
                    p.innerHTML += value.value + ' => ' + value.newValue;
                    break;
                case 2:
                    p.innerHTML += value.newValue;
                    break;
            }

            cell.appendChild(p);
        });
    }
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

