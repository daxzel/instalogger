var instaloggerApp = angular.module('instaloggerApp', ['ngAnimate', 'ngSanitize', 'ngResource', 'ui.bootstrap',
    'ngClipboard'])

if (typeof String.prototype.startsWith != 'function') {
    String.prototype.startsWith = function (str) {
        return this.indexOf(str) == 0;
    };
}

if (typeof String.prototype.contains != 'function') {
    String.prototype.contains = function (str) {
        return this.indexOf(str) != -1;
    };
}

function isError(message) {
    return (message.log_level == 40000)
}

instaloggerApp.factory('socket', function ($rootScope) {
    var sock = new SockJS("/eventbus");
    sock.onopen = function () {
        $rootScope.$apply(function () {
            $rootScope.$broadcast('socketOnOpen')
        });
    };

    sock.onmessage = function (data) {
        $rootScope.$apply(function () {
            $rootScope.$broadcast('socketOnMessage', data)
        });
    }
    sock.onclose = function () {
        $rootScope.$apply(function () {
            $rootScope.$apply(function () {
                $rootScope.$broadcast('socketOnClose', data)
            });
        });
    }

    return {
        send: function (data) {
            sock.send(data);
        }
    };
});

instaloggerApp.factory('serverEvents', ['$rootScope', function ($rootScope) {

    $rootScope.$on('socketOnMessage', function (event, response) {
        var data = jQuery.parseJSON(response.data);
        switch (data.command) {
            case 'sendMessage':
                $rootScope.$broadcast("sendMessage", data)
                $rootScope.$broadcast("serverPing", data.value.server_id)
                break;
            case 'refresh':
                $rootScope.$broadcast("refresh", data)
                break;
            case 'lazyMessagesDownload':
                $rootScope.$broadcast("lazyMessagesDownload", data)
                break;
            case 'addRepeatedMessage':
                $rootScope.$broadcast("addRepeatedMessage", data)
                break;
            case 'serverPing':
                $rootScope.$broadcast("serverPing", data.serverId)
                break;
            case 'refreshRepeatedMessage':
                $rootScope.$broadcast("refreshRepeatedMessage", data)
                break;

        }
    });
    return { };

}]);


instaloggerApp.factory('unreadErrorMessages', ['$rootScope', 'socket', 'serverEvents', function ($rootScope, socket, serverEvents) {

    var unreadErrorMessages = {
        messages: {},
        length: 0,
        readAll: function () {
            this.messages = {}
            this.length = 0
        },
        read: function (message) {
            delete this.messages[message.id];
            this.length -= 1
        },
        add: function (message) {
            this.messages[message.id] = {};
            this.length += 1
        }
    }

    $rootScope.$on("sendMessage",function (event, data) {
        var message = data.value;
        if (isError(message)) {
            unreadErrorMessages.add(message);
        }
    })

    return unreadErrorMessages;
}]);


instaloggerApp.factory('repeatedMessages', ['socket', 'serverEvents', '$rootScope',
    function (socket, serverEvents, $rootScope) {

    var repeatedMessages = {
        values: {},
        add: function(message, name) {
            var info = {};
            info.messageId = message.id;
            info.name = name;
            info.command = 'addRepeatedMessage';
            socket.send(JSON.stringify(info));
        },
        remove: function(repeatedMessage) {
            var info = {};
            info.repeatedMessageId = repeatedMessage.id;
            info.command = 'removeRepeatedMessage';
            socket.send(JSON.stringify(info));
            delete this.values[repeatedMessage.id]
        }
    }

    $rootScope.$on('socketOnOpen', function () {
        var info = {};
        info.command = 'refreshRepeatedMessage';
        socket.send(JSON.stringify(info));

    });


    $rootScope.$on("refreshRepeatedMessage", function (event, data) {
        angular.forEach(data.value, function(item) {
            repeatedMessages.values[item.id] = item;
        });
    })

    $rootScope.$on("addRepeatedMessage", function (event, data) {
        var repeatedMessage = data.value;
        if (repeatedMessages.values[repeatedMessage.id] != undefined) {
            repeatedMessages.values[repeatedMessage.id].count = repeatedMessage.count
        } else {
            repeatedMessages.values[repeatedMessage.id] = repeatedMessage
        }
    })

    return repeatedMessages;
}]);



instaloggerApp.factory('messageServers', ['$rootScope', 'socket', '$http', 'unreadErrorMessages', 'serverEvents',
    function ($rootScope, socket, $http, unreadErrorMessages, serverEvents) {

        getServer = function ($http, servers, message) {
            if (servers.values[message.server_id] == undefined) {
                servers.values[message.server_id] = {}
                var server = servers.values[message.server_id]
                server.messages = []
                server.id = message.server_id;
                server.refresh = false;
                server.down = false;
                $http({
                    method: 'GET',
                    url: '/server',
                    params: {id: server.id}
                }).success(function (result) {
                        server.name = result.name
                    });
                return server;
            } else {
                return servers.values[message.server_id];
            }
        }

        var servers = {}
        servers.values = {}

        servers.clear = function () {
            for (var id in servers.values) {
                servers.values[id].messages = []
            }
        }

        servers.removeMessage = function (message) {
            var server = getServer($http, servers, message)
            var index;
            for(var i=0; i<server.messages.length; i++) {
                if (server.messages[i].id == message.id) {
                    index = i;
                    break;
                }
            }
            if (index != undefined) {
                server.messages.splice(index, 1);
            }
        }

        servers.refreshClear = function () {
            for (var id in servers.values) {
                var server = servers.values[id];
                servers.values[id].messages = [];
                server.refresh = true
            }
        }

        $rootScope.$on("sendMessage", function (event, data) {
            var message = data.value;
            var server = getServer($http, servers, message)
            if (!server.refresh) {
                server.messages.unshift(message);
                if (server.messages.length > 100) {
                    server.messages.pop();
                }
            }
        })

        $rootScope.$on("Refresh", function (event, data) {
            var value = data.value;
            var server = servers.values[value.serverId]
            server.messages = value.messages
            server.refresh = false
            server.down = value.messages.length < 100
        })

        $rootScope.$on("lazyMessagesDownload", function (event, data) {
            var value = data.value;
            var server = servers.values[value.serverId]
            server.messages = server.messages.concat(value.messages)
            server.refresh = false
            server.down = value.messages.length < 100
        })

        var getMessageForServer = function (server) {
            $http({
                method: 'GET',
                url: '/messages',
                params: {server_id: server.id}
            }).success(function (messages) {
                    server.messages = messages;
                    server.refresh = false;
                });
        }

        $http({
            method: 'GET',
            url: '/servers'
        }).success(function (result) {
                for (var i = 0; i < result.length; i++) {
                    var server = {}
                    server.name = result[i].name
                    server.refresh = true
                    server.id = result[i].id
                    servers.values[server.id] = server
                    getMessageForServer(server)
                }
            });

        return servers

    }]);



instaloggerApp.controller('dialogController', function($scope, $modalInstance) {
    $scope.ok = function (name) {
        $modalInstance.close(name);
    };


    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };

})

instaloggerApp.controller('messagesController', ['$scope', '$http', '$sce', '$resource', 'messageServers', 'socket',
    'unreadErrorMessages', '$modal', 'repeatedMessages',
    function ($scope, $http, $sce, $resource, messageServers, socket, unreadErrorMessages, $modal, repeatedMessages) {
        $scope.servers = messageServers.values;

        $scope.unreadErrorMessages = unreadErrorMessages;

        $scope.repeatedMessages = repeatedMessages.values;

        $scope.addRepeatedMessage = function (message) {
            var modalInstance = $modal.open({
                templateUrl: 'nameDialog.html',
                controller: 'dialogController'
            });
            modalInstance.result.then(function (name) {
                messageServers.removeMessage(message);
                repeatedMessages.add(message, name);
            });
        }

        $scope.logLevels = {
            10000: {
                id: 10000,
                alertStyle: 'alert-debug',
                show: true,
                buttonName: "Debug",
                buttonStyle: 'btn-debug'
            },
            20000: {
                id: 20000,
                alertStyle: 'alert-info',
                show: true,
                buttonName: "Info",
                buttonStyle: 'btn-info'
            },
            30000: {
                id: 30000,
                alertStyle: 'alert-warning',
                show: true,
                buttonName: "Warning",
                buttonStyle: 'btn-warning'
            },
            40000: {
                id: 40000,
                alertStyle: 'alert-danger',
                show: true,
                buttonName: "Error",
                buttonStyle: 'btn-danger'
            }
        }

        $scope.$on('socketOnClose', function () {
            $modal.open({
                templateUrl: 'connectionLost.html',
                backdrop: 'static',
                controller: ''
            });
        });


        $scope.isError = function (message) {
            return isError(message);
        }

        $scope.removeRepeatedMessage = function (repeatedMessage) {
            repeatedMessages.remove(repeatedMessage);
        }

        $scope.searchTextChanged = function (text) {
            var info = {};
            info.term = text;
            info.command = 'search';
            socket.send(JSON.stringify(info));
            messageServers.refreshClear();
        }

        $scope.$watch('unreadErrorMessages', function () {
            var length = $scope.unreadErrorMessages.length;
            if (length < 100) {
                Tinycon.setBubble(length);
            } else {
                Tinycon.setBubble(99);
            }
            if (length > 0) {
                document.title = 'Errors';
            } else {
                document.title = 'Instalogger';
            }
        }, true);

        $scope.overMessage = function (message) {
            if ($scope.unreadErrorMessages.messages[message.id] != undefined) {
                $scope.unreadErrorMessages.read(message)
            }
        }

        $scope.isUnread = function (message) {
            return $scope.unreadErrorMessages.messages[message.id] != undefined;
        }

        $scope.readAll = function () {
            $scope.unreadErrorMessages.readAll();
        }

        $scope.clearServer = function (server) {
            var successFunction = function () {
                delete $scope.servers[server.id];
                server.messages = server.messages.concat(result);
                server.refresh = false;
            }
            server.refresh = true;
            $http({
                method: 'DELETE',
                url: '/server',
                params: {id: server.id}
            }).success(successFunction);
        }

        $scope.getClassOfAlert = function (message) {
            return $scope.logLevels[message.log_level].alertStyle
        }

        $scope.messageScroll = function (server) {
            if (!server.refresh) {
                server.refresh = true;
                if (!server.down) {
                    var info = {};
                    info.serverId = server.id;
                    info.offset = server.messages.length;
                    info.command = 'lazyMessagesDownload';
                    socket.send(JSON.stringify(info));
                    server.refresh = true
                } else {
                    server.refresh = false;
                }
            }
        };

        $http({
            method: 'GET',
            url: '/settings'
        }).success(function (result) {
                for (var i = 0; i < result.length; i++) {
                    $scope.logLevels[result[i].id].show = result[i].value == 'true';
                }
            });

        $scope.changeConfig = function (level) {
            level.show = !level.show;
            var info = {};
            info.id = level.id;
            info.value = level.show;
            info.command = 'changeConfig';
            socket.send(JSON.stringify(info));
            messageServers.refreshClear();
        };

    }]);

instaloggerApp.directive("instaloggerScroll", function ($window) {
    return function (scope, element, attrs) {
        element.bind("scroll", function () {
            var offset = element.scrollTop()
            var height = element[0].scrollHeight
            if (offset >= height - 1000) {
                scope.$apply(attrs.instaloggerScroll);
            }
        });
    };
});

instaloggerApp.directive('serverPing', ['serverEvents', function (serverEvents) {
    return {
        restrict: 'E',
        replace: true,
        transclude: true,
        scope: {
            server: '='
        },
        template: function ($element, $attrs) {
            return  '<i class=\"fa fa-circle fa-1 instalogger-ping\"></i>'
        },
        link: function (scope, element, attrs) {
            var timer = {
                getPing: false,
                work: false,
                tick: 0
            }
            scope.$on("serverPing", function (event, serverId) {
                if (scope.server.id == serverId) {
                    if (timer.work) {
                        timer.getPing = true
                    } else {
                        timer.work = true
                        timer.tick = 0
                        element.addClass('instalogger-ping-enable')
                    }
                }
            })

            setInterval(function () {
                timer.tick += 1
                if (timer.getPing) {
                    timer.tick = 0;
                    timer.getPing = false
                }
                if (timer.tick > 10) {
                    timer.work = false
                    timer.tick = 0;
                    element.removeClass('instalogger-ping-enable')
                }
            }, 1000);
        }
    }
}]);

function parseExceptionString(s) {
    try {
        var stackTrace = s.split(' ')[1];
        var pacckages = stackTrace.split('.');
        var clazz = (stackTrace.split('(')[1]).split(':');
        var className = clazz[0];
        var stringNumber = (clazz[1]).split(')')[0];
        var result = []
        for (var i = 0; i < pacckages.length - 3; i++) {
            result.push(pacckages[i])
            result.push("/")
        }
        result.push(className)

        var distinguishClass = s.split("(");

        return distinguishClass[0] + "(<a ng-click=\"ideOpen('" + result.join("") + "','"
            + stringNumber + "')\">" + distinguishClass[1].split(")")[0] + "</a>)"
    } catch (e) {
        return s;
    }
}


instaloggerApp.directive('logMessage', ['$http', '$compile', function ($http, $compile) {
    return {
        restrict: 'E',
        replace: true,
        transclude: true,
        scope: {
            message: '='
        },
        link: function (scope, element, attrs) {
            var message = scope.message;
            if (isError(message)) {
                var strings = scope.message.text.split('\n');
                var result = []
                result.push('[')
                result.push(message.create_time)
                result.push('] ')
                result.push("<b>")
                result.push(strings[0])
                result.push("</b>")

                scope.ideOpen = function (className, stringNumber) {
                    $http({
                        method: 'GET',
                        url: 'http://localhost:63330/file',
                        params: {
                            file: className,
                            line: stringNumber
                        }
                    })
                }

                for (var i = 1; i < strings.length; i++) {
                    result.push("<br/>")
                    if (strings[i].startsWith("\tat ")) {
                        result.push("<b>             ")
                        if (strings[i].contains('thesis')
                            || strings[i].contains('docflow')
                            || strings[i].contains('taskman')
                            || strings[i].contains('.ext.')) {
                            result.push('<span style=\"color: green\">')
                            result.push(parseExceptionString(strings[i]))
                            result.push('</span>')
                        } else {
                            if (strings[i].contains('cuba')) {
                                result.push('<span style=\"color: blue\">')
                                result.push(parseExceptionString(strings[i]))
                                result.push('</span>')
                            } else {
                                result.push(parseExceptionString(strings[i]))
                            }
                        }
                        result.push("</b>")
                    } else {
                        result.push("<b>")
                        result.push(strings[i])
                        result.push("</b>")
                    }
                }
                element.html(result.join(""));
                $compile(element.contents())(scope);
            } else {
                element.html(message.text);
            }
        }
    }
}]);


