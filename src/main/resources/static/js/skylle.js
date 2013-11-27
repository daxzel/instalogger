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
        return $scope.servers.default
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

skylleApp.controller('messagesController', ['$scope', 'webSocketMessageFactory', '$http', '$sce', '$resource',
function ($scope, webSocketMessageFactory, $http, $sce, $resource) {
    $scope.servers = {}
    $scope.servers.default = {}
    $scope.servers.default.refresh = true
    $scope.servers.default.id = 'default'
    $scope.servers.default.name = 'default'
    $scope.servers.default.messages = []

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

    $scope.clearMessages = function() {
        $http({
            method: 'DELETE',
            url: '/messages/delete_all'
        })

        for (var server in $scope.servers) {
            server.messages = []
        }
    }

    var sock;

    $scope.getClassOfAlert = function(message) {
        switch (message.log_level) {
            case 40000: return 'alert-danger'
            case 30000: return 'alert-warning'
            case 20000: return 'alert-info'
            case 10000: return 'alert-debug'
        }
        return ''
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

    $scope.showDanger = true;
    $scope.showWarning = true;
    $scope.showInfo = true;
    $scope.showDebug = true;

    $http({
        method: 'GET',
        url: '/settings',
    }).success(function (result) {
        for (var i=0; i< result.length; i++) {
            switch (result[i].id) {
                case '40000': $scope.showDanger = result[i].value == 'true'
                    break;
                case '30000': $scope.showWarning = result[i].value == 'true'
                    break;
                case '20000': $scope.showInfo = result[i].value == 'true'
                    break;
                case '10000': $scope.showDebug = result[i].value == 'true'
            }
        }
    });

    $scope.changeConfig = function(level) {
        var enable = false

        switch (level) {
            case 40000: $scope.showDanger = !$scope.showDanger;
                enable = $scope.showDanger
                break;
            case 30000: $scope.showWarning = !$scope.showWarning;
                enable = $scope.showWarning
                break;
            case 20000: $scope.showInfo = !$scope.showInfo;
                enable = $scope.showInfo
                break;
            case 10000: $scope.showDebug = !$scope.showDebug;
                enable = $scope.showDebug
        }

        var info = {};
        info.id = level;
        info.value = enable;
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
        url: '/messages'
    }).success(function (result) {
        $scope.servers.default.messages = result;
        $scope.servers.default.refresh = false;
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
            if (($scope.showDanger && message.log_level == 40000) ||
                ($scope.showWarning && message.log_level == 30000) ||
                ($scope.showInfo && message.log_level == 20000) ||
                ($scope.showDebug && message.log_level == 10000)) {
                return true
            }
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

