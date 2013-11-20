var skylleApp = angular.module('skylleApp', ['ngAnimate'])

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

skylleApp.controller('messagesController', ['$scope', 'webSocketMessageFactory', '$http',
function ($scope, webSocketMessageFactory, $http) {
    $scope.messages = []

    $scope.clearMessages = function() {
        $http({
            method: 'DELETE',
            url: '/messages/delete_all'
        })
        $scope.messages = []
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

    $scope.messageScroll = function() {
        $http({
            method: 'GET',
            url: '/messages',
            params: {offset: $scope.messages.length}
        }).success(function (result) {
            $scope.messages = $scope.messages.concat(result);
            $scope.loadingNewMessages = false;
        })
    };

    $scope.changeConfig = function(level) {
        var refresh = false

        switch (level) {
            case 40000: $scope.showDanger = !$scope.showDanger;
                refresh = $scope.showDanger
                break;
            case 30000: $scope.showWarning = !$scope.showWarning;
                refresh = $scope.showWarning
                break;
            case 20000: $scope.showInfo = !$scope.showInfo;
                refresh = $scope.showInfo
                break;
            case 10000: $scope.showDebug = !$scope.showDebug;
                refresh = $scope.showDebug
        }

        var info = {};
        info.logLevel = level;
        info.command = 'changeConfig';
        sock.send(JSON.stringify(info));

        if (refresh) {
            $scope.refresh = true;
            $scope.messages = [];
            $http({
                method: 'GET',
                url: '/messages',
                params: {offset: $scope.messages.length}
            }).success(function (result) {
                $scope.messages = result;
                $scope.refresh = false;
            });
        }
    };

    $http({
        method: 'GET',
        url: '/messages',
        params: {offset: $scope.messages.length}
    }).success(function (result) {
        $scope.messages = result;
        sock = new SockJS("/eventbus");
        webSocketMessageFactory.on(sock, function (data) {
           if (!$scope.refresh) {
               $scope.messages.unshift(data);
               $scope.messages.pop();
           }
        });
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

