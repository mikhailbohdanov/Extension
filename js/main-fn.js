/**
 * Created by Mykhailo_Bohdanov on 13/07/2015.
 */

//- - - Main functions - - -
var
    class2type = {},
    array = [],

    toString = class2type.toString,
    hasOwnProperty = class2type.hasOwnProperty,

    slice = array.slice,
    concat = array.concat,
    push = array.push,
    indexOf = array.indexOf;

function isUndefined(object) {
    return typeof object === 'undefined';
}

function isDefined(object) {
    return typeof object !== 'undefined';
}

function isObject(object) {
    return typeof object === 'object';
}

function isPlainObject(object) {
    if (type(object) !== 'object' || object.nodeType || isWindow(object)) {
        return false;
    }

    if (object.constructor && !hasOwnProperty.call(object.constructor.prototype, 'isPrototypeOf')) {
        return false;
    }

    return true;
}

function isFunction(object) {
    return typeof object === 'function';
}

function isArray(object) {
    return typeof object === 'array';
}

function isArrayLike(object) {
    if (object == null || isWindow(object)) {
        return false;
    }

    var length = object.length;

    if (object.nodeType === 1 && length) {
        return true;
    }

    return isString(object) || isArray(object) || length === 0 || typeof length === 'number' && length > 0 && (length - 1) in object;
}

function isString(object) {
    return typeof object === 'string';
}

function isNumber(object) {
    return typeof object === 'number';
}

function isBoolean(object) {
    return typeof object === 'boolean';
}

function isRegExp(object) {
    return toString.call(object) === '[object RegExp]';
}

function isDate(object) {
    return type(object) == 'date';
}

function isElement(object) {
    return !!(object && (object.nodeName || (object.prop && object.attr && object.find)));
}

function isWindow(object) {
    return object && object.document && object.location && object.alert && object.setInterval;
}

function type(object) {
    if (object == null) {
        return object + '';
    }

    return typeof object === 'object' || typeof object === 'function' ? class2type[toString.call(object)] || 'object' : typeof object;
}

function extend() {
    var options, name, src, copy, copyIsArray, clone,
        target = arguments[0] || {},
        key = 1,
        length = arguments.length,
        deep = false;

    if (typeof target === 'boolean') {
        deep = target;
        target = arguments[key] || {};
        key++;
    }

    if (typeof target !== 'object' && typeof target !== 'function') {
        target = {};
    }

    if (key === length) {
        target = this;
        key--;
    }

    for (; key < length; key++) {
        if ((options = arguments[key]) != null) {
            for (name in options) {
                src = target[name];
                copy = options[name];

                if (target === copy) {
                    continue;
                }

                if (deep && copy && (isPlainObject(copy) || (copyIsArray = isArray(copy)))) {
                    if (copyIsArray) {
                        copyIsArray = false;
                        clone = src && isArray(src) ? src : [];
                    } else {
                        clone = src && isPlainObject(src) ? src : {};
                    }

                    target[name] = extend(deep, clone, copy);
                } else if (copy !== undefined) {
                    target[name] = copy;
                }
            }
        }
    }

    return target;
}

function forEach(object, iterator, context) {
    var key;

    if (object) {
        if (isFunction(object)) {
            for (key in object) {
                if (key != 'prototype' && key != 'length' && key != 'name' && (!object.hasOwnProperty || object.hasOwnProperty(key))) {
                    iterator.call(context, object[key], key);
                }
            }
        } else if (isArray(object) || isArrayLike(object)) {
            for (key = 0; key < object.length; key++) {
                iterator.call(context, object[key], key);
            }
        } else if (object.forEach && object.forEach !== forEach) {
            object.forEach(iterator, context);
        } else {
            for (key in object) {
                if (object.hasOwnProperty(key)) {
                    iterator.call(context, object[key], key);
                }
            }
        }
    }

    return object;
}

function size(object, ownPropsOnly) {
    var count = 0,
        key;

    if (isArray(object) || isString(object)) {
        return object.length;
    } else if (isObject(object)) {
        for (key in object) {
            if (!ownPropsOnly || object.hasOwnProperty(key)) {
                count++;
            }
        }
    }

    return count;
}

var equals = function (object1, object2) {
    if (object1 === object2) {
        return true;
    }

    if (object1 === null || object2 === null) {
        return false;
    }

    if (object1 !== object1 && object2 !== object2) {
        return true;
    }

    var type1 = typeof object1,
        type2 = typeof object2,
        length, key, keySet;

    if (type1 == type2) {
        if (type1 == 'object') {
            if (isArray(object1)) {
                if (!isArray(object2)) {
                    return false;
                }

                if ((length = object1.length) == object2.length) {
                    for (key = 0; key < length; key++) {
                        if (!equals(object1[key], object2[key])) {
                            return false;
                        }
                    }

                    return true;
                }
            } else if (isDate(object1)) {
                return isDate(object2) && object1.getTime() == object2.getTime();
            } else if (isRegExp(object1) && isRegExp(object2)) {
                return object1.toString() == object2.toString();
            } else {
                if (isWindow(object1) || isWindow(object2) || isArray(object2)) {
                    return false;
                }

                keySet = {};

                for (key in object2) {
                    if (!equals(object1[key], object2[key])) {
                        return false;
                    }

                    keySet[key] = true;
                }

                for (key in object2) {
                    if (!keySet.hasOwnProperty(key) && object2 !== undefined && !isFunction(object2[key])) {
                        return false;
                    }
                }

                return true;
            }
        }
    }

    return false;
}

function jsonEncode(data, encode) {
    if (encode) data = htmlEncode(data);

    return JSON.stringify(data);
}

function jsonDecode(string, decode) {
    if (string == '') return {};

    if (decode) string = htmlDecode(string);

    return JSON.parse(string);
}

function htmlEncode(string, qStyle, charset, dEncode) {
    var optTemp = 0,
        i = 0,
        noQuotes = false;

    if (typeof qStyle === 'undefined' || qStyle === null) qStyle = 2;

    string = string.toString();

    if (dEncode !== false) string = string.replace(/&/g, '&amp;');

    string = string.replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    var OPTS = {
        'ENT_NOQUOTES': 0,
        'ENT_HTML_QUOTE_SINGLE': 1,
        'ENT_HTML_QUOTE_DOUBLE': 2,
        'ENT_COMPAT': 2,
        'ENT_QUOTES': 3,
        'ENT_IGNORE': 4
    };

    if (qStyle === 0) noQuotes = true;

    if (typeof qStyle !== 'number') {
        qStyle = [].concat(qStyle);

        for (i = 0; i < qStyle.length; i++)
            if (OPTS[qStyle[i]] === 0) noQuotes = true;
            else if (OPTS[qStyle[i]]) optTemp = optTemp | OPTS[qStyle[i]];
        qStyle = optTemp;
    }

    if (qStyle & OPTS.ENT_HTML_QUOTE_SINGLE) string = string.replace(/'/g, '&#039;');

    if (!noQuotes) string = string.replace(/"/g, '&quot;');

    return string;
}

function htmlDecode(string, quote_style) {
    var optTemp = 0,
        i = 0,
        noQuotes = false;

    if (typeof quote_style === 'undefined') quote_style = 2;

    string = string.toString()
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>');

    var OPTS = {
        'ENT_NOQUOTES': 0,
        'ENT_HTML_QUOTE_SINGLE': 1,
        'ENT_HTML_QUOTE_DOUBLE': 2,
        'ENT_COMPAT': 2,
        'ENT_QUOTES': 3,
        'ENT_IGNORE': 4
    };

    if (quote_style === 0) noQuotes = true;

    if (typeof quote_style !== 'number') {
        quote_style = [].concat(quote_style);

        for (i = 0; i < quote_style.length; i++)
            if (OPTS[quote_style[i]] === 0) noQuotes = true;
            else if (OPTS[quote_style[i]]) optTemp = optTemp | OPTS[quote_style[i]];

        quote_style = optTemp;
    }

    if (quote_style & OPTS.ENT_HTML_QUOTE_SINGLE) string = string.replace(/&#0*39;/g, "'");

    if (!noQuotes) string = string.replace(/&quot;/g, '"');

    string = string.replace(/&amp;/g, '&');

    return string;
}

forEach('Boolean Number String Function Array Date RegExp Object Error'.split(' '), function (name, i) {
    class2type['[object ' + name + ']'] = name.toLowerCase();
});
//- - - /Main functions - - -


//- - - Cookies - - -
function getCookies(context) {
    if (!context) {
        context = document;
    }

    if (!context.cookie || context.cookie.length < 2) {
        return {};
    }

    var res = {}, coo,
        cArr = context.cookie.split(/;\s?/);
    for (var i = 0; i < cArr.length; i++) {
        coo = cArr [i].split('=');
        res[coo[0]] = decodeURIComponent(coo[1]);
    }

    return res;
}
function getCookie(name, context) {
    if (!context) {
        context = document;
    }

    var matches = context.cookie.match(new RegExp(
        "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
    ));
    return matches ? decodeURIComponent(matches[1]) : undefined;
}
function setCookie(name, value, options, context) {
    if (!context) {
        context = document;
    }

    options = options || {};

    var expires = options.expires;

    if (typeof expires == "number" && expires) {
        var d = new Date();
        d.setTime(d.getTime() + expires * 1000);
        expires = options.expires = d;
    }
    if (expires && expires.toUTCString) {
        options.expires = expires.toUTCString();
    }

    value = encodeURIComponent(value);

    var updatedCookie = name + "=" + value;

    for (var propName in options) {
        updatedCookie += "; " + propName;
        var propValue = options[propName];
        if (propValue !== true) {
            updatedCookie += "=" + propValue;
        }
    }

    context.cookie = updatedCookie;
}
function deleteCookie(name, context) {
    if (!context) {
        context = document;
    }

    setCookie(name, "", {
        expires: -1
    }, context);
}
//- - - /Cookies - - -
