/**
 * Created by andreytsarevskiy on 14/12/13.
 */


instaloggerApp.factory('serverEvents', ['$rootScope', function ($rootScope) {

    $rootScope.$on('socketOnMessage', function (event, response) {
        var data = jQuery.parseJSON(response.data);
        switch (data.command) {
            case 'sendMessage':
                $rootScope.$broadcast("sendMessage", data)
                $rootScope.$broadcast("serverPing", data.value.server_id)
                break;
            case 'refresh':
                $rootScope.$broadcast("refresh", data)
                break;
            case 'lazyMessagesDownload':
                $rootScope.$broadcast("lazyMessagesDownload", data)
                break;
            case 'addRepeatedMessage':
                $rootScope.$broadcast("addRepeatedMessage", data)
                break;
            case 'serverPing':
                $rootScope.$broadcast("serverPing", data.serverId)
                break;
            case 'refreshRepeatedMessage':
                $rootScope.$broadcast("refreshRepeatedMessage", data)
                break;

        }
    });
    return { };

}]);