/**
 * Created by Mykhailo_Bohdanov on 13/07/2015.
 */
var domain = $('#domain'),
    snapshotName = $('#snapshotName'),
    shotRange = $('#shotRange'),

    cookiesDiff = $('#cookiesDiff'),
    cookiesWrapper = $('#cookiesWrapper'),

    localStorageDiff = $('#localStorageDiff'),

    BUILDED_ELEMENTS = {},

    SNAPSHOT;

function init() {
    if (SNAPSHOT.states.length > 1) {
        var length = SNAPSHOT.states.length,
            grid = [];


        forEach(SNAPSHOT.states, function (state) {
            grid.push(state.time);
        });

        shotRange.ionRangeSlider({
            type: 'double',
            min: 0,
            max: length - 1,
            from: length - 2,
            to: length - 1,
            min_interval: 1,
            drag_interval: true,
            grid: true,
            grid_num: length,
            values: grid,
            onFinish: function (data) {
                diffState(data.from, data.to);
            },
            onStart: function (data) {
                diffState(data.from, data.to);
            }
        });
    }

}

function diff(oldObj, newObj, oldHasOwn, newHasOwn) {
    if (isUndefined(oldHasOwn) && isUndefined(newHasOwn)) {
        oldHasOwn = true;
        newHasOwn = true;
    }

    var difference = {
            status: 0,
            value: {},
            type: typeof oldObj,
            newType: typeof newObj
        },
        oldType = difference.type,
        newType = difference.newType;

    switch (oldType + '-' + newType) {
        case 'object-object':
            difference.value = {};

            forEach(oldObj, function (value, key) {
                var newValue = newObj[key];

                this.value[key] = diff(value, newValue, true, key in newObj);

                if (this.value[key].status != -1) {
                    this.status = 1;
                }
            }, difference);

            forEach(newObj, function (value, key) {
                if (!oldObj[key]) {
                    this.value[key] = diff(undefined, value, false, true);
                    this.status = 1;
                }
            }, difference);

            if (difference.status == 0) {
                difference.status = -1;
            }
            break;
        case 'object-undefined':
            forEach(oldObj, function (value, key) {
                this.value[key] = diff(value, undefined, true, false);
            }, difference);

            if (newHasOwn) {
                difference.status = 1;
            } else {
                difference.status = -2;
            }
            break;
        case 'undefined-object':
            difference.newValue = {};

            forEach(newObj, function (value, key) {
                this.newValue[key] = diff(undefined, value, false, true);
            }, difference);

            if (!oldHasOwn) {
                difference.status = 2;
            } else {
                difference.status = 1;
            }
            break;
        default:
            if (oldType == 'object') {
                forEach(oldObj, function (value, key) {
                    this.value[key] = diff(value, undefined, true, false);
                }, difference);

                difference.status = 1;
            } else if (newType == 'object') {
                forEach(newObj, function (value, key) {
                    this.value[key] = diff(undefined, value, false, true);
                }, difference);

                difference.status = 1;
            } else {
                difference.value = oldObj;

                if (oldObj === newObj) {
                    difference.status = -1;
                } else if (newObj === undefined && !newHasOwn) {
                    difference.status = -2;
                } else if (oldObj === undefined && !oldHasOwn) {
                    difference.status = 2;
                    difference.newValue = newObj;
                } else {
                    difference.status = 1;
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

function diffState(indexFirst, indexLast) {
    var states = SNAPSHOT.states.slice(indexFirst, indexLast + 1),
        diffs = [],
        _diff, state1, state2;

    BUILDED_ELEMENTS    = {};

    for (var i = 1; i < states.length; i++) {
        _diff = {};

        state1 = states[i - 1];
        state2 = states[i];

        _diff.timeLeft = state1.time;
        _diff.timeRight = state2.time;

        if (SNAPSHOT.config.cookies) {
            _diff.cookies = diff(state1.cookies, state2.cookies);
        }

        diffs.push(_diff);
    }

    buildTable(diffs);
}
function buildTable(data) {
    var tableData, i, tmp;

    if (SNAPSHOT.config.cookies) {
        // Cookies

        tableData = {};

        for (i = 0; i < data.length; i++) {
            tmp = data[i].cookies.value;

            forEach(tmp, function (cookie, name) {
                if (!tableData[name]) {
                    tableData[name] = [];
                }

                tableData[name][i] = cookie;
            });
        }

        forEach(tableData, function(values) {
            values.length = data.length;
        });

        cookiesWrapper
            .empty()
            .append(createTable(tableData, 'cookies'));
    }


}

function createTable(data, way) {
    var
        table = $('<table/>');

    table.addClass('table table-bordered');

    forEach(data, function (value, key) {
        insertRow(table, key, value, way);
    });

    return table;
}
function insertRow(table, name, data, way) {
    var row = $('<tr/>');

    way = way + '-' + name;
    if (!BUILDED_ELEMENTS[way]) {
        BUILDED_ELEMENTS[way]   = [];
    }

    if (isArrayLike(data)) {
        for (var i = 0; i < data.length; i++) {
            insertCell(row, name, data[i], way);
        }
    } else {
        insertCell(row, name, data, way);
    }

    table.append(row);
}
function insertCell(row, name, data, way) {
    var cell    = $('<td/>'),
        span, valueOld, valueNew;

    if (data) {
        cell.addClass('p0');

        way = way + '-' + name;

        if (!BUILDED_ELEMENTS[way]) {
            BUILDED_ELEMENTS[way]   = [];
        }

        BUILDED_ELEMENTS[way].push(cell);

        switch (data.status) {
            case -2:
                cell.addClass('danger');
                span        = insertOld(name, data, way);
                valueOld    = insertValue(data.value, data.type, way);
                break;
            case -1:
                cell.addClass('active');
                span        = insertOld(name, data, way);
                valueOld    = insertValue(data.value, data.type, way);
                break;
            case 1:
                cell.addClass('warning');
                span        = insertChange(name, data, way);
                valueOld    = insertValue(data.value, data.type, way);
                valueNew    = insertValue(data.newValue, data.newType, way);
                break;
            case 2:
                cell.addClass('success');
                span        = insertNew(name, data, way);
                valueNew    = insertValue(data.newValue, data.newType, way);
                break;
        }

        span.on('click', function() {
            forEach(BUILDED_ELEMENTS[way], function(_cell) {
                _cell.toggleClass('actived');
            });

            row.toggleClass('actived');
        });
        cell
            .append(span);

        var div = $('<div/>');

        div
            .addClass('pl10 pr10 pb10')
            .appendTo(cell);

        if (data.status < 2) {
            div.append(valueOld);
        }

        if (data.status == 1 && (data.type != data.newType || data.type != 'object')) {
            div.append('<div>&gt;</div>');
        }

        if (data.status > 0) {
            div.append(valueNew);
        }
    } else {
        cell.addClass('active');
    }

    row.append(cell);
}

function insertOld(name, data, way) {
    var span        = $('<span/>');

    span
        .addClass('p5 key linked')
        .text(name + ': ');

    $('<small/>')
        .addClass('text-muted')
        .text('(' + data.type + ')')
        .appendTo(span);

    return span;
}
function insertChange(name, data, way) {
    var span        = $('<span/>');

    span
        .addClass('p5 key linked')
        .append(name + ': ');

    $('<small/>')
        .addClass('text-muted')
        .text('(' + data.type + ')')
        .appendTo(span);

    span.append(' > ');

    $('<small/>')
        .addClass('text-muted')
        .text('(' + data.newType + ')')
        .appendTo(span);

    return span;
}
function insertNew(name, data, way) {
    var span        = $('<span/>');

    span
        .addClass('p5 key')
        .append(name + ': ');

    $('<small/>')
        .addClass('text-muted')
        .text('(' + data.newType + ')')
        .appendTo(span);

    return span;
}
function insertValue(data, type, way) {
    if (type == 'object') {
        return createTable(data, way);
    } else if (type == 'string') {
        return '"' + data + '"';//TODO make decode some data
    } else {
        return data;
    }
}

/*

 <span class="p5 key linked">
 key:
 <small class="text-muted"><i>(object)</i></small>
 <span class="text-muted obj">{<small>...</small>}</span>
 </span>
 */


//function insertOld(cell, data, name, way) {
//    if (data.type == 'object') {
//        createTable(data.value, $(cell), way);
//    } else {
//        var p = document.createElement('p');
//        p.innerHTML = name + ': ' + data.value;
//
//        cell.appendChild(p);
//    }
//}
//function insertChange(cell, data, name, way) {
//    if (data.type == 'object') {
//
//    } else {
//
//    }
//}
//function insertNew(cell, data, name, way) {
//    if (data.type == 'object') {
//
//    } else {
//
//    }
//}
//
//function toggleData(way) {
//
//}


$(function () {
    var search = {};

    forEach(location.search.substring(1).split('&'), function (data) {
        data = data.split('=');

        search[data[0]] = data[1];
    });

    chrome.extension.sendRequest(null, {action: 'get', index: search.index}, function (snapshot) {
        if (snapshot) {
            domain.text(snapshot.domain);
            snapshotName.text(snapshot.config.name);

            SNAPSHOT = snapshot;
            init();
        }
    });

    $(document).on('click', 'p[toggler]', function () {
        var way = $(this).attr('toggler');

        $('*[way="' + way + '"]').toggleClass('hidden');
    });
});


