define(['angular-modules'], function() {

    var instaloggerApp = angular.module('instaloggerApp', ['ngAnimate', 'ngSanitize', 'ngResource', 'ui.bootstrap']);
        //'ngClipboard']);

    if (typeof String.prototype.startsWith != 'function') {
        String.prototype.startsWith = function (str) {
            return this.indexOf(str) === 0;
        };
    }

    if (typeof String.prototype.contains != 'function') {
        String.prototype.contains = function (str) {
            return this.indexOf(str) != -1;
        };
    }

    return instaloggerApp;
});





