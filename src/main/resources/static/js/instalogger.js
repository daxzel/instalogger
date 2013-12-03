var instaloggerApp = angular.module('instaloggerApp', ['ngAnimate', 'ngSanitize', 'ngResource'])

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

instaloggerApp.factory('socket', function ($rootScope) {
    var sock = new SockJS("/eventbus");
    var onopenListeners = [];
    sock.onopen = function () {
        $rootScope.$apply(function () {
            for (var i = 0; i < onopenListeners.length; i++) {
                onopenListeners[i]();
            }
        });
    };
    var onmessageListeners = [];
    sock.onmessage = function (data) {
        $rootScope.$apply(function () {
            for (var i = 0; i < onmessageListeners.length; i++) {
                onmessageListeners[i](data);
            }
        });
    }

    return {
        onopen: function (callback) {
            onopenListeners.push(callback);

        },
        onmessage: function (callback) {
            onmessageListeners.push(callback);

        },
        send: function (data) {
            sock.send(data);
        }
    };
});

instaloggerApp.factory('unreadErrorMessages',['$rootScope', 'socket', function ($rootScope, socket) {

    var unreadErrorMessages = {
        messages: {},
        length: 0,
        readAll: function() {
            this.messages = {}
            this.length = 0
        },
        read: function(message) {
            delete this.messages[message.id];
            this.length -= 1
        },
        add: function(message) {
            this.messages[message.id] = {};
            this.length += 1
        }
    }

    socket.onmessage(function (response) {
        var jsonResponse = jQuery.parseJSON(response.data);
        if (jsonResponse.command == 'sendMessage') {
            var message = jsonResponse.value;
            if (message.log_level == 40000) {
                unreadErrorMessages.add(message);
            }
        }
    })

    return unreadErrorMessages;
}]);


instaloggerApp.factory('messageServers', ['$rootScope', 'socket', '$http', 'unreadErrorMessages',
    function ($rootScope, socket, $http, unreadErrorMessages) {

        getServer = function ($http, servers, message) {
            if (servers[message.server_id] == undefined) {
                servers[message.server_id] = {}
                var server = servers[message.server_id]
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
                return servers[message.server_id];
            }
        }

        var servers = {}

        socket.onopen(function () {
            socket.onmessage(function (response) {
                var jsonResponse = jQuery.parseJSON(response.data);
                if (jsonResponse.command == 'sendMessage') {
                    var message = jsonResponse.value;
                    var server = getServer($http, servers, message)
                    if (!server.refresh) {
                        server.messages.unshift(message);
                        if (server.messages.length > 100) {
                            server.messages.pop();
                        }
                    }
                } else {
                    if (jsonResponse.command == 'refresh') {
                        var value = jsonResponse.value;
                        var server = servers[value.serverId]
                        server.messages = value.messages
                        server.refresh = false
                        server.down = value.messages.length < 100
                    } else {
                        if (jsonResponse.command == 'lazyMessagesDownload') {
                            var value = jsonResponse.value;
                            var server = servers[value.serverId]
                            server.messages = server.messages.concat(value.messages)
                            server.refresh = false
                            server.down = value.messages.length < 100
                        }
                    }
                }
            });
        });

        $http({
            method: 'GET',
            url: '/servers'
        }).success(function (result) {
                for (var i = 0; i < result.length; i++) {
                    var server = {}
                    server.name = result[i].name
                    server.refresh = true
                    server.id = result[i].id
                    servers[server.id] = server
                    $http({
                        method: 'GET',
                        url: '/messages',
                        params: {server_id: server.id}
                    }).success(function (result) {
                            server.messages = result;
                            server.refresh = false
                        });
                }
            });

        return servers

    }]);


instaloggerApp.controller('messagesController', ['$scope', '$http', '$sce', '$resource', 'messageServers', 'socket',
    'unreadErrorMessages', function ($scope, $http, $sce, $resource, messageServers, socket, unreadErrorMessages) {
        $scope.servers = messageServers;

        $scope.unreadErrorMessages = unreadErrorMessages;

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

        socket.onopen(function () {
            $scope.$watch('searchText', function (newVal) {
                var info = {};
                info.term = newVal;
                info.command = 'search';
                socket.send(JSON.stringify(info));
            });
        })

        $scope.$watch('unreadErrorMessages', function () {
            Tinycon.setBubble($scope.unreadErrorMessages.length);
            if ($scope.unreadErrorMessages.length > 0) {
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

        $scope.showMessage = function (message) {
            strings = message.text.split('\n');
            result = []
            result.push('[')
            result.push(message.create_time)
            result.push('] ')
            result.push(strings[0])

            for (var i = 1; i < strings.length; i++) {
                result.push("<br/>")
                if (strings[i].startsWith("\tat ")) {
                    result.push("<b>             ")
                    if (strings[i].contains('thesis')
                        || strings[i].contains('docflow')
                        || strings[i].contains('taskman')) {
                        result.push('<span style=\"color: green\">')
                        result.push(strings[i])
                        result.push('</span>')
                    } else {
                        if (strings[i].contains('cuba')) {
                            result.push('<span style=\"color: blue\">')
                            result.push(strings[i])
                            result.push('</span>')
                        } else {
                            result.push(strings[i])
                        }
                    }
                    result.push("</b>")
                } else {
                    result.push(strings[i])
                }
            }

            return $sce.trustAsHtml(result.join(""));
        }

        $scope.readAll  = function () {
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
            url: '/settings',
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
        };


    }]);

instaloggerApp.directive("instaloggerScroll", function ($window) {
    return function (scope, element, attrs) {
        angular.element($window).bind("scroll", function () {
            var offset = this.pageYOffset;
            if (offset >= element.height() - 1000) {
                scope.$apply(attrs.instaloggerScroll);
            }
        });
    };
});

instaloggerApp.directive('serverPing', function() {
    return {
        restrict: 'E',
        transclude: true,
        template: function ($element, $attrs) {
            return  '<i class=\"fa fa-circle-o fa-1\"></i>'
        }
    }
});


