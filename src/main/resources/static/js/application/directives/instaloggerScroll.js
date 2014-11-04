define(['instaloggerApp'], function (instaloggerApp) {
    instaloggerApp.directive("instaloggerScroll", function () {
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
});
