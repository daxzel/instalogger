var skylleApp = angular.module('skylleApp', ['ngAnimate'])

skylleApp.factory('webSocketMessageFactory', ['$rootScope', function ($rootScope) {
  var eb = new vertx.EventBus("/eventbus");

  return {
    on: function (eventName, callback) {
      function wrapper(msg) {
        $rootScope.$apply(function() {
          callback(msg);
        });
      }
      eb.onopen = function() {
         eb.registerHandler(eventName, wrapper);
      }

      return function() {
        eb.removeHandler(eventName, wrapper);
      };
    },
  };
}]);

skylleApp.controller('messagesController', ['$scope', 'webSocketMessageFactory', '$http',
function ($scope, webSocketMessageFactory, $http) {
    $scope.messages = []

    $scope.bufferSize = 100;
    $scope.bufferNumber = 2;

    $scope.clearMessages = function() {
        $http({
            method: 'DELETE',
            url: '/messages/delete_all'
        })
        $scope.messages = []
    }

    $scope.numberChanged = function() {
        $http({
            method: 'GET',
            url: '/messages',
            params: {bufferNumber: $scope.bufferNumber}
        }).success(function (result) {
            $scope.messages = $scope.messages.concat(result);
            $scope.loadingNewMessages = false;
        })
    };

    $http({
        method: 'GET',
        url: '/messages',
        params: {bufferNumber: $scope.bufferNumber}
    }).success(function (result) {
        $scope.messages = result.reverse();
         webSocketMessageFactory.on('messageAdded', function (data) {
            $scope.messages.unshift(data);
         });
         $scope
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
             if (this.pageYOffset >= element.height() - 400) {
                 if (!scope.loadingNewMessages) {
                    scope.loadingNewMessages = true;
                    scope.bufferNumber += 1;
                    scope.numberChanged();
                 }
             }
        });
    };
});

