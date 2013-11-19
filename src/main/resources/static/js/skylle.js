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

    $http({
        method: 'GET',
        url: '/messages',
        params: {offset: $scope.messages.length}
    }).success(function (result) {
        $scope.messages = result;
         webSocketMessageFactory.on('messageAdded', function (data) {
            $scope.messages.unshift(data);
            $scope.message.pop()
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
             if (this.pageYOffset >= element.height() - 1000) {
                 if (!scope.loadingNewMessages) {
                    scope.loadingNewMessages = true;
                    scope.messageScroll();
                 }
             }
        });
    };
});

