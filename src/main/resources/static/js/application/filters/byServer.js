instaloggerApp.filter('byServer', function () {
    return function (repeatedMessages, server) {
        var filteredRepeatedMessage = {};
        for (var key in repeatedMessages) {
            if (repeatedMessages[key].server_id === server.id) {
                filteredRepeatedMessage[key] = repeatedMessages[key];
            }
        }
        return filteredRepeatedMessage;
    };
});