'use strict';

angular.module('ngClipboard', [])
    .value('ZeroClipboardPath', '/static/flash/ZeroClipboard.swf')
    .factory('zeroClipboard', ['ZeroClipboardPath', '$rootScope', function (ZeroClipboardPath, $rootScope) {
        ZeroClipboard.setDefaults({ moviePath: ZeroClipboardPath });
        var clip = new ZeroClipboard();

        clip.on('mousedown', function (client) {
            $rootScope.$broadcast('clipMouseDown', client, this)
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
                scope.$on('clipMouseDown', function (event, client, mouseDownElement) {
                    if (element[0] == mouseDownElement) {
                        client.setText(scope.$eval(scope.clipCopy));
                        if (angular.isDefined(attrs.clipClick)) {
                            scope.$apply(scope.clipClick);
                        }
                    }
                })
            }
        }
    }]);