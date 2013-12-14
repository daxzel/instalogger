/**
 * Created by andreytsarevskiy on 14/12/13.
 */


instaloggerApp.controller('dialogController', function($scope, $modalInstance) {
    $scope.ok = function (name) {
        $modalInstance.close(name);
    };


    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };

})