instaloggerApp.directive('serverPing', function () {
    return {
        restrict: 'E',
        replace: true,
        transclude: true,
        scope: {
            server: '='
        },
        template: function ($element, $attrs) {
            return  '<i class=\"fa fa-circle fa-1 instalogger-ping\"></i>'
        },
        link: function (scope, element, attrs) {
            var timer = {
                getPing: false,
                work: false,
                tick: 0
            }
            scope.$on("serverPing", function (event, serverId) {
                if (scope.server.id == serverId) {
                    if (timer.work) {
                        timer.getPing = true
                    } else {
                        timer.work = true
                        timer.tick = 0
                        element.addClass('instalogger-ping-enable')
                    }
                }
            })

            setInterval(function () {
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
            }, 1000);
        }
    }
});
