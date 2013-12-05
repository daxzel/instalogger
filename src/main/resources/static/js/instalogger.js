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

instaloggerApp.factory('serverEvents', ['$rootScope', 'socket', function ($rootScope, socket) {

    var onSendMessageListeners = [];
    var onRefreshListeners = [];
    var onLazyMessagesDownloadListeners = [];
    var onServerPingListeners = [];


    socket.onmessage(function (response) {
        var data = jQuery.parseJSON(response.data);
        switch (data.command) {
            case 'sendMessage':
                for (var i = 0; i < onSendMessageListeners.length; i++) {
                    onSendMessageListeners[i](data);
                }
                break;
            case 'refresh':
                for (var i = 0; i < onRefreshListeners.length; i++) {
                    onRefreshListeners[i](data);
                }
                break;
            case 'lazyMessagesDownload':
                for (var i = 0; i < onLazyMessagesDownloadListeners.length; i++) {
                    onLazyMessagesDownloadListeners[i](data);
                }
                break;
            case 'serverPing':
                for (var i = 0; i < onServerPingListeners.length; i++) {
                    onServerPingListeners[i](data);
                }
                break;

        }
    });
    return {
        onSendMessage: function (callback) {
            onSendMessageListeners.push(callback);

        },
        onRefresh: function (callback) {
            onRefreshListeners.push(callback);

        },
        onLazyMessagesDownload: function (callback) {
            onLazyMessagesDownloadListeners.push(callback);
        },
        onServerPing: function (callback) {
            onServerPingListeners.push(callback);
        }
    };

}]);


instaloggerApp.factory('unreadErrorMessages',['$rootScope', 'socket', 'serverEvents', function ($rootScope, socket,
                                                                                                serverEvents) {

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

    serverEvents.onSendMessage(function (data) {
        var message = data.value;
        if (message.log_level == 40000) {
            unreadErrorMessages.add(message);
        }
    })

    return unreadErrorMessages;
}]);


instaloggerApp.factory('messageServers', ['$rootScope', 'socket', '$http', 'unreadErrorMessages', 'serverEvents',
    function ($rootScope, socket, $http, unreadErrorMessages, serverEvents) {

        getServer = function ($http, servers, message) {
            if (servers.values[message.server_id] == undefined) {
                servers.values[message.server_id] = {}
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
                return servers.values[message.server_id];
            }
        }

        var servers = {}
        servers.values = {}

        servers.clear = function() {
            for (var id in servers.values) {
                servers.values[id].messages = []
            }
        }

        servers.refreshClear = function() {
            for (var id in servers.values) {
                var server = servers.values[id];
                servers.values[id].messages = [];
                server.refresh = true
            }
        }

        serverEvents.onSendMessage(function (data) {
            var message = data.value;
            var server = getServer($http, servers.values, message)
            if (!server.refresh) {
                server.messages.unshift(message);
                if (server.messages.length > 100) {
                    server.messages.pop();
                }
            }
        })

        serverEvents.onRefresh(function(data) {
            var value = data.value;
            var server = servers.values[value.serverId]
            server.messages = value.messages
            server.refresh = false
            server.down = value.messages.length < 100
        })

        serverEvents.onLazyMessagesDownload(function (data) {
            var value = data.value;
            var server = servers.values[value.serverId]
            server.messages = server.messages.concat(value.messages)
            server.refresh = false
            server.down = value.messages.length < 100
        })

        var getMessageForServer = function(server) {
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


instaloggerApp.controller('messagesController', ['$scope', '$http', '$sce', '$resource', 'messageServers', 'socket',
    'unreadErrorMessages', function ($scope, $http, $sce, $resource, messageServers, socket, unreadErrorMessages) {
        $scope.servers = messageServers.values;

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



        $scope.searchTextChanged = function(text) {
            var info = {};
            info.term = text;
            info.command = 'search';
            socket.send(JSON.stringify(info));
            messageServers.refreshClear();
        }

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

instaloggerApp.directive('serverPing',['serverEvents', function(serverEvents) {
    return {
        restrict: 'E',
        replace: true,
        transclude: true,
        scope: {
            server:'='
        },
        template: function ($element, $attrs) {
            return  '<i class=\"fa fa-circle fa-1 instalogger-ping\"></i>'
        },
        link: function (scope,element,attrs){
            var timer = {
                getPing : false,
                work : false,
                tick : 0
            }
            serverEvents.onServerPing(function(data) {
                if (scope.server.id == data.serverId) {
                    if (timer.work) {
                        timer.getPing = true
                    } else {
                        timer.work = true
                        timer.tick  = 0
                        element.addClass('instalogger-ping-enable')
                    }
                }
            })

            setInterval(function(){
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
            }, 100);
        }
    }
}]);


