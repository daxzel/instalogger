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

    $scope.clearMessages = function() {
        $http({
            method: 'DELETE',
            url: '/messages/delete_all'
        })
        $scope.messages = []
    }

    $http({
        method: 'GET',
        url: '/messages'
    }).success(function (result) {
        $scope.messages = result.reverse();;
         webSocketMessageFactory.on('messageAdded', function (data) {
            $scope.messages.unshift(data);
         });
    });
}]);

skylleApp.filter('showMessageLogLevel',[function() {
    return function(messages, $scope) {
        return messages.filter(function(message, index, array) {
            if (($scope.showDanger && messages.log_level == 40000) ||
                ($scope.showWarning && message.log_level == 30000) ||
                ($scope.showInfo && message.log_level == 20000) ||
                ($scope.showDebug && message.log_level == 10000)) {
                return true
            }
        });

    }
}]);

