instaloggerApp.controller('messagesController',
    function ($scope, $http, messageServers, socket, unreadErrorMessages, $modal, repeatedMessages, logLevels) {
        $scope.servers = messageServers.values;

        $scope.unreadErrorMessages = unreadErrorMessages;

        $scope.repeatedMessages = repeatedMessages.values;

        $scope.isExistsRepeatedMessage = function (repeatedMessages, server) {
            for (var key in repeatedMessages) {
                if (repeatedMessages[key].server_id === server.id) {
                    return true;
                }
            }
            return false;
        }

        $scope.addRepeatedMessage = function (message) {
            var modalInstance = $modal.open({
                templateUrl: 'nameDialog.html',
                controller: 'dialogController'
            });
            modalInstance.result.then(function (name) {
                messageServers.removeMessage(message);
                repeatedMessages.add(message, name);
            });
        }

        $scope.logLevels = logLevels

        $scope.$on('socketOnClose', function () {
            $modal.open({
                templateUrl: 'connectionLost.html',
                backdrop: 'static',
                controller: ''
            });
        });


        $scope.isError = function (message) {
            return isError(message);
        }

        $scope.removeRepeatedMessage = function (repeatedMessage) {
            repeatedMessages.remove(repeatedMessage);
        }

        $scope.searchTextChanged = function (text) {
            var info = {};
            info.term = text;
            info.command = 'search';
            socket.send(JSON.stringify(info));
            messageServers.refreshClear();
        }

        $scope.$watch('unreadErrorMessages', function () {
            var length = $scope.unreadErrorMessages.length;
            if (length < 100) {
                Tinycon.setBubble(length);
            } else {
                Tinycon.setBubble(99);
            }
            if (length > 0) {
                document.title = 'Errors';
            } else {
                document.title = 'Instalogger';
            }
        }, true);

        $scope.overMessage = function (message) {
            if ($scope.unreadErrorMessages.messages[message.id] != undefined) {
                $scope.unreadErrorMessages.read(message)
            }
        }

        $scope.isUnread = function (message) {
            return $scope.unreadErrorMessages.messages[message.id] != undefined;
        }

        $scope.readAll = function () {
            $scope.unreadErrorMessages.readAll();
        }

        $scope.clearServer = function (server) {
            var successFunction = function () {
                delete $scope.servers[server.id];
                server.messages = server.messages.concat(result);
                server.refresh = false;
            }
            server.refresh = true;
            $http({
                method: 'DELETE',
                url: '/server',
                params: {id: server.id}
            }).success(successFunction);
        }

        $scope.getClassOfAlert = function (message) {
            return $scope.logLevels[message.log_level].alertStyle
        }

        $scope.messageScroll = function (server) {
            if (!server.refresh) {
                server.refresh = true;
                if (!server.down) {
                    var info = {};
                    info.serverId = server.id;
                    info.offset = server.messages.length;
                    info.command = 'lazyMessagesDownload';
                    socket.send(JSON.stringify(info));
                    server.refresh = true
                } else {
                    server.refresh = false;
                }
            }
        };

        $http({
            method: 'GET',
            url: '/settings'
        }).success(function (result) {
                for (var i = 0; i < result.length; i++) {
                    $scope.logLevels[result[i].id].show = result[i].value == 'true';
                }
            });

        $scope.changeConfig = function (level) {
            level.show = !level.show;
            var info = {};
            info.id = level.id;
            info.value = level.show;
            info.command = 'changeConfig';
            socket.send(JSON.stringify(info));
            messageServers.refreshClear();
        };

    });