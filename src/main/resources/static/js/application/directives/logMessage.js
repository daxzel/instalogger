function parseExceptionString(s) {
    try {
        var stackTrace = s.split(' ')[1];
        var pacckages = stackTrace.split('.');
        var clazz = (stackTrace.split('(')[1]).split(':');
        var className = clazz[0];
        var stringNumber = (clazz[1]).split(')')[0];
        var result = []
        for (var i = 0; i < pacckages.length - 3; i++) {
            result.push(pacckages[i])
            result.push("/")
        }
        result.push(className)

        var distinguishClass = s.split("(");

        return distinguishClass[0] + "(<a ng-click=\"ideOpen('" + result.join("") + "','"
            + stringNumber + "')\">" + distinguishClass[1].split(")")[0] + "</a>)"
    } catch (e) {
        return s;
    }
}


instaloggerApp.directive('logMessage', function ($http, $compile) {
    return {
        restrict: 'E',
        replace: true,
        transclude: true,
        scope: {
            message: '='
        },
        link: function (scope, element) {
            var message = scope.message;
            if (isError(message)) {
                var strings = scope.message.text.split('\n');
                var result = []
                result.push('[')
                result.push(message.create_time)
                result.push('] ')
                result.push("<b>")
                result.push(strings[0])
                result.push("</b>")

                scope.ideOpen = function (className, stringNumber) {
                    $http({
                        method: 'GET',
                        url: 'http://localhost:63330/file',
                        params: {
                            file: className,
                            line: stringNumber
                        }
                    })
                }

                for (var i = 1; i < strings.length; i++) {
                    result.push("<br/>")
                    if (strings[i].startsWith("\tat ")) {
                        result.push("<b>             ")
                        if (strings[i].contains('thesis')
                            || strings[i].contains('docflow')
                            || strings[i].contains('taskman')
                            || strings[i].contains('.ext.')) {
                            result.push('<span style=\"color: green\">')
                            result.push(parseExceptionString(strings[i]))
                            result.push('</span>')
                        } else {
                            if (strings[i].contains('cuba')) {
                                result.push('<span style=\"color: blue\">')
                                result.push(parseExceptionString(strings[i]))
                                result.push('</span>')
                            } else {
                                result.push(parseExceptionString(strings[i]))
                            }
                        }
                        result.push("</b>")
                    } else {
                        result.push("<b>")
                        result.push(strings[i])
                        result.push("</b>")
                    }
                }
                element.html(result.join(""));
                $compile(element.contents())(scope);
            } else {
                element.html(message.text);
            }
        }
    }
});
