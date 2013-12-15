instaloggerApp.factory('messageServers', function ($rootScope, socket, $http) {

    getServer = function ($http, servers, message) {
        if (servers.values[message.server_id] == undefined) {
            servers.values[message.server_id] = {}
            var server = servers.values[message.server_id]
            server.messages = []
            server.id = message.server_id;
            server.refresh = false;
            server.down = false;
            $http({
                method: 'GET',
                url: '/server',
                params: {id: server.id}
            }).success(function (result) {
                    server.name = result.name
                });
            return server;
        } else {
            return servers.values[message.server_id];
        }
    }

    var servers = {}
    servers.values = {}

    servers.clear = function () {
        for (var id in servers.values) {
            servers.values[id].messages = []
        }
    }

    servers.removeMessage = function (message) {
        var server = getServer($http, servers, message)
        var index;
        for (var i = 0; i < server.messages.length; i++) {
            if (server.messages[i].id == message.id) {
                index = i;
                break;
            }
        }
        if (index != undefined) {
            server.messages.splice(index, 1);
        }
    }

    servers.lazyRefreshClearServer = function (server) {
        server.messages = [];
        server.refresh = true
    }

    servers.lazyRefreshClear = function () {
        for (var id in servers.values) {
            var server = servers.values[id];
            this.lazyRefreshClearServer(server);
        }
    }

    $rootScope.$on("sendMessage", function (event, data) {
        var message = data.value;
        var server = getServer($http, servers, message)
        if (!server.refresh) {
            server.messages.unshift(message);
            if (server.messages.length > 100) {
                server.messages.pop();
            }
        }
    })

    $rootScope.$on("refresh", function (event, data) {
        var value = data.value;
        var server = servers.values[value.serverId]
        server.messages = value.messages
        server.refresh = false
        server.down = value.messages.length < 100
    })

    $rootScope.$on("lazyMessagesDownload", function (event, data) {
        var value = data.value;
        var server = servers.values[value.serverId]
        server.messages = server.messages.concat(value.messages)
        server.refresh = false
        server.down = value.messages.length < 100
    })

    var getMessageForServer = function (server) {
        $http({
            method: 'GET',
            url: '/messages',
            params: {server_id: server.id}
        }).success(function (messages) {
                server.messages = messages;
                server.refresh = false;
            });
    }

    $http({
        method: 'GET',
        url: '/servers'
    }).success(function (result) {
            for (var i = 0; i < result.length; i++) {
                var server = {}
                server.name = result[i].name
                server.refresh = true
                server.id = result[i].id
                servers.values[server.id] = server
                getMessageForServer(server)
            }
        });

    return servers

});
