var instaloggerApp = angular.module('instaloggerApp', ['ngAnimate', 'ngSanitize', 'ngResource'])

if (typeof String.prototype.startsWith != 'function') {
  String.prototype.startsWith = function (str){
    return this.indexOf(str) == 0;
  };
}

if (typeof String.prototype.contains != 'function') {
  String.prototype.contains = function (str){
    return this.indexOf(str) != -1;
  };
}

instaloggerApp.factory('webSocketMessageFactory', ['$rootScope', function ($rootScope) {

  return {
    on: function (sock, callback) {
      function wrapper(msg) {
        $rootScope.$apply(function() {
          callback(jQuery.parseJSON(msg.data));
        });
      }
      sock.onopen = function() {
         sock.onmessage = wrapper;
      }
    },
  };
}]);

function getServer($http, $scope, message) {
    if ($scope.servers[message.server_id] == undefined) {
        $scope.servers[message.server_id] = {}
        var server = $scope.servers[message.server_id]
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
        return $scope.servers[message.server_id];
    }
}

instaloggerApp.controller('messagesController', ['$scope', '$http', '$sce', '$resource',
function ($scope, $http, $sce, $resource) {
    $scope.servers = {}

    $scope.unreadErrorMessages = {
        length: 0
    }

    $scope.logLevels = {
        10000: {
           id : 10000,
           alertStyle: 'alert-debug',
           show: true,
           buttonName: "Debug",
           buttonStyle: 'btn-debug'
        },
        20000: {
           id : 20000,
           alertStyle: 'alert-info',
           show: true,
           buttonName: "Info",
           buttonStyle: 'btn-info'
        },
        30000: {
           id : 30000,
           alertStyle: 'alert-warning',
           show: true,
           buttonName: "Warning",
           buttonStyle: 'btn-warning'
        },
        40000: {
           id : 40000,
           alertStyle: 'alert-danger',
           show: true,
           buttonName: "Error",
           buttonStyle: 'btn-danger'
        }
    }

    sock = new SockJS("/eventbus");

    sock.onopen = function() {
        sock.onmessage = function (response) {
            jsonResponse = jQuery.parseJSON(response.data);
            if (jsonResponse.command == 'sendMessage') {
                message = jsonResponse.value;
                var server = getServer($http, $scope, message)
                if (!server.refresh) {
                    server.messages.unshift(message);
                    if (message.log_level == 40000) {
                        $scope.unreadErrorMessages[message.id] = {};
                        $scope.unreadErrorMessages.length += 1
                    }
                    if (server.messages.length > 100) {
                        server.messages.pop();
                    }
                }
            } else {
                if (jsonResponse.command == 'refresh') {
                    var value = jsonResponse.value;
                    $scope.$apply(function() {
                        $scope.servers[value.serverId].messages = value.messages
                    });
                }
            }
        }

        $scope.$watch('searchText', function(newVal) {
            var info = {};
            info.term = newVal;
            info.command = 'search';
            sock.send(JSON.stringify(info));
        });
    };

    $scope.$watch('unreadErrorMessages', function() {
        Tinycon.setBubble($scope.unreadErrorMessages.length);
        if ($scope.unreadErrorMessages.length > 0) {
            document.title = 'Errors';
        } else {
            document.title = 'Instalogger';
        }
    }, true);

    $scope.overMessage = function(message) {
        if ($scope.unreadErrorMessages[message.id] != undefined) {
            delete $scope.unreadErrorMessages[message.id];
            $scope.unreadErrorMessages.length -= 1
        }
    }

    $scope.showMessage = function(message) {
        strings = message.text.split('\n');
        result = []
        result.push('[')
        result.push(message.create_time)
        result.push('] ')
        result.push(strings[0])

        for (var i=1; i<strings.length; i++) {
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

    $scope.clearServer = function(server) {
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

    $scope.getClassOfAlert = function(message) {
        return $scope.logLevels[message.log_level].alertStyle
    }

    $scope.messageScroll = function(server) {
        if (!server.down) {
            server.refresh = true
            $http({
                method: 'GET',
                url: '/messages',
                params: {
                    server_id: server.id,
                    offset: server.messages.length
                }
            }).success(function (result) {
                if (result.length == 0) {
                    server.down = true;
                    server.refresh = false;
                    return;
                }
                $scope.servers[server.id].messages = server.messages.concat(result);
                server.refresh = false;
            });
        } else {
             server.refresh = false;
        }
    };

    $http({
        method: 'GET',
        url: '/settings',
    }).success(function (result) {
        for (var i=0; i< result.length; i++) {
            $scope.logLevels[result[i].id]. show = result[i].value == 'true';
        }
    });

    $scope.changeConfig = function(level) {
        level.show = !level.show;
        var info = {};
        info.id = level.id;
        info.value = level.show;
        info.command = 'changeConfig';
        sock.send(JSON.stringify(info));
    };

    $http({
        method: 'GET',
        url: '/servers'
    }).success(function (result) {
        for (var i=0; i < result.length; i++) {
            var server = {}
            server.name = result[i].name
            server.refresh = true
            server.id = result[i].id
            $scope.servers[server.id] = server
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
}]);

instaloggerApp.directive("instaloggerScroll", function ($window) {
    return function(scope, element, attrs) {
        angular.element($window).bind("scroll", function() {
            var offset = this.pageYOffset;
            var server = scope.servers[attrs.instaloggerScroll];
            if (offset >= element.height() - 1000) {
                if (!server.refresh) {
                    server.refresh = true;
                    scope.messageScroll(server);
                }
            }
        });
    };
});


