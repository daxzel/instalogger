'use strict';

angular.module('ngClipboard', [])
    .value('ZeroClipboardPath', '/static/flash/ZeroClipboard.swf')
    .factory('zeroClipboard', ['ZeroClipboardPath', function (ZeroClipboardPath) {
        ZeroClipboard.setDefaults({ moviePath: ZeroClipboardPath });
        var clip = new ZeroClipboard();

        clip.on('mousedown', function (client) {
            this.clipCopyFunction(client);
        });

        return clip;
    }])
    .directive('clipCopy', ['$window', 'zeroClipboard', function ($window, zeroClipboard) {
        return {
            scope: {
                clipCopy: '&',
                clipClick: '&'
            },
            restrict: 'A',
            link: function (scope, element, attrs) {
                zeroClipboard.glue(element);

                element[0].clipCopyFunction = function (client) {
                    client.setText(scope.$eval(scope.clipCopy));
                    if (angular.isDefined(attrs.clipClick)) {
                        scope.$apply(scope.clipClick);
                    }
                }
            }
        }
    }]);