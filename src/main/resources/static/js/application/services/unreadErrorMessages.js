define(['instaloggerApp'], function (instaloggerApp) {
    instaloggerApp.factory('unreadErrorMessages', function ($rootScope) {

        var unreadErrorMessages = {
            messages: {},
            length: 0,
            readAll: function () {
                this.messages = {};
                this.length = 0;
            },
            read: function (message) {
                delete this.messages[message.id];
                this.length -= 1;
            },
            add: function (message) {
                this.messages[message.id] = {};
                this.length += 1;
            }
        };

        $rootScope.$on("sendMessage", function (event, data) {
            var message = data.value;
            if (isError(message)) {
                unreadErrorMessages.add(message);
            }
        });

        return unreadErrorMessages;
    });
});
