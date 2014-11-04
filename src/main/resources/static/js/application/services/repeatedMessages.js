define(['instaloggerApp'], function (instaloggerApp) {
    instaloggerApp.factory('repeatedMessages', function (socket, serverEvents, $rootScope) {

        var repeatedMessages = {
            values: {},
            add: function (message, name) {
                var info = {};
                info.messageId = message.id;
                info.name = name;
                info.command = 'addRepeatedMessage';
                socket.send(JSON.stringify(info));
            },
            remove: function (repeatedMessage) {
                var info = {};
                info.repeatedMessageId = repeatedMessage.id;
                info.command = 'removeRepeatedMessage';
                socket.send(JSON.stringify(info));
                delete this.values[repeatedMessage.id];
            }
        };

        $rootScope.$on('socketOnOpen', function () {
            var info = {};
            info.command = 'refreshRepeatedMessage';
            socket.send(JSON.stringify(info));

        });

        $rootScope.$on("refreshRepeatedMessage", function (event, data) {
            angular.forEach(data.value, function (item) {
                repeatedMessages.values[item.id] = item;
            });
        });

        $rootScope.$on("addRepeatedMessage", function (event, data) {
            var repeatedMessage = data.value;
            if (repeatedMessages.values[repeatedMessage.id] !== undefined) {
                repeatedMessages.values[repeatedMessage.id].count = repeatedMessage.count;
            } else {
                repeatedMessages.values[repeatedMessage.id] = repeatedMessage;
            }
        });

        return repeatedMessages;
    });
});