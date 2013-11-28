var skylleApp = angular.module('skylleApp', ['ngAnimate', 'ngSanitize', 'ngResource'])

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

skylleApp.factory('webSocketMessageFactory', ['$rootScope', function ($rootScope) {

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
    if (message.server_id == undefined) {
        if ($scope.servers.default != undefined) {
            return $scope.servers.default;
        } else {
            return createDefaultServer($scope);
        }
    } else {
        if ($scope.servers[message.server_id] == undefined) {
            $scope.servers[message.server_id] = {}
            var server = $scope.servers[message.server_id]
            server.messages = []
            server.id = message.server_id;
            server.refresh = false;
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
}

function createDefaultServer($scope) {
    $scope.servers.default = {}
    $scope.servers.default.refresh = false
    $scope.servers.default.id = 'default'
    $scope.servers.default.name = 'default'
    $scope.servers.default.messages = []
    return $scope.servers.default;
}

skylleApp.controller('messagesController', ['$scope', 'webSocketMessageFactory', '$http', '$sce', '$resource',
function ($scope, webSocketMessageFactory, $http, $sce, $resource) {
    $scope.servers = {}

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

    $http({
        method: 'GET',
        url: '/messages'
    }).success(function (result) {
        if (result.length > 0) {
            server = createDefaultServer($scope)
            server.messages = result;
        }
    });

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
            $scope.refresh = false;
        }
        $http({
            method: 'DELETE',
            url: '/server',
            params: {id: server.id}
        }).success(successFunction);
    }

    var sock;

    $scope.getClassOfAlert = function(message) {
        return $scope.logLevels[message.log_level].alertStyle
    }

    $scope.messageScroll = function(server) {
//        $http({
//            method: 'GET',
//            url: '/messages',
//            params: {offset: server.messages.length},
//            params: {name: server.name}
//        }).success(function (result) {
//            server.messages = server.messages.concat(result);
//            $scope.refresh = false;
//        })
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

//        if (enable) {
//            $scope.refresh = true;
//            $scope.messages = [];
//            $http({
//                method: 'GET',
//                url: '/messages',
//                params: {offset: $scope.messages.length}
//            }).success(function (result) {
//                $scope.messages = result;
//                $scope.refresh = false;
//            });
//        }
    };

    sock = new SockJS("/eventbus");
    webSocketMessageFactory.on(sock, function (message) {
        var server = getServer($http, $scope, message)
        if (!server.refresh) {
            server.messages.unshift(message);
            if (server.messages.length > 100) {
                server.messages.pop();
            }
        }
    });

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

skylleApp.filter('showMessageLogLevel',[function() {
    return function(messages, $scope) {
        return messages.filter(function(message, index, array) {
            return $scope.logLevels[message.log_level].show
        });

    }
}]);

skylleApp.directive("scroll", function ($window) {
    return function(scope, element, attrs) {
        angular.element($window).bind("scroll", function() {
             if (this.pageYOffset >= element.height() - 1000) {
                 if (!scope.refresh) {
                    scope.refresh = true;
                    scope.messageScroll();
                 }
             }
        });
    };
});

