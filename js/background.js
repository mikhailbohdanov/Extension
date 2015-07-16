/**
 * Created by Mykhailo_Bohdanov on 10/07/2015.
 */
var _SNAPSHOTS  = [],
    _METHODS    = {
        get             : function(options, callBack) {
            callBack(_SNAPSHOTS[options.index]);
        },
        getForDomain    : function(options, callBack) {
            var response    = {};

            forEach(_SNAPSHOTS, function(snapshot, index) {
                if (snapshot.domain === options.domain) {
                    response[index] = snapshot;
                }
            });

            callBack(response);
        },

        set             : function(options, callBack) {
            var snapshot    = {
                domain  : options.domain,
                config  : options.config,
                states  : []
            };

            callBack({index: _SNAPSHOTS.push(snapshot) - 1});
        },
        putState        : function(options, callBack) {
            this.get(options, function(response) {
                response.states.push(options.state);

                callBack();
            });
        },

        countStates     : function(options, callBack) {
            var stateCount  = 0;

            forEach(_SNAPSHOTS, function(snapshot) {
                if (snapshot.domain === options.domain) {
                    if (snapshot.states) {
                        stateCount += snapshot.states.length;
                    }
                }
            });

            callBack({
                statesCount : stateCount
            });
        },
        countAll        : function(options, callBack) {
            var stateCount  = 0;

            forEach(_SNAPSHOTS, function(snapshot) {
                if (snapshot.states) {
                    stateCount += snapshot.states.length;
                }
            });

            callBack({
                statesCount : stateCount
            });
        },

        removeForDomain : function(options, callBack) {
            var indexs  = [];
            forEach(_SNAPSHOTS, function (snapshot, index) {
                if (snapshot.domain === options.domain) {
                    indexs.push(index);
                }
            });

            forEach(indexs.reverse(), function (index) {
                _SNAPSHOTS.splice(index, 1);
            });

            callBack();
        },
        removeAll       : function(options, callBack) {
            _SNAPSHOTS  = [];

            callBack();
        }
    };

chrome.extension.onRequest.addListener(function (request, sender, sendResponse) {
    _METHODS[request.action].call(_METHODS, request, sendResponse);
});