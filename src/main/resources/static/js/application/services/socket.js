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
            $rootScope.$broadcast('socketOnClose', data)
        });
    }

    return {
        send: function (data) {
            sock.send(data);
        }
    };
});
