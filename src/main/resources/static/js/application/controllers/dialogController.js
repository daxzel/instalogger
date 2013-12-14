instaloggerApp.controller('dialogController', function ($scope, $modalInstance) {
    $scope.ok = function (name) {
        $modalInstance.close(name);
    };


    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };

})