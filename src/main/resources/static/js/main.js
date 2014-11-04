requirejs.config({

    paths: {
        'angular': 'lib/angular',
        'angular-animate': 'lib/angular-animate',
        'angular-resource': 'lib/angular-resource',
        'angular-route': 'lib/angular-route',
        'angular-sanitize': 'lib/angular-sanitize',
        'bootstrap': 'lib/bootstrap',
        'jquery': 'lib/jquery',
        'sockjs': 'lib/sockjs',
        'tinycon': 'lib/tinycon',
        'ui-bootstrap': 'lib/ui-bootstrap',
        'vertxbus': 'lib/vertxbus',
        'ZeroClipboard': 'lib/ZeroClipboard',
        'instaloggerApp': 'application/application'
    },
    shim: {
        'angular': {
            exports: 'angular',
            deps: ['jquery']
        },
        'tinycon' : {
            exports: 'Tinycon'
        },
        'angular-animate': ['angular'],
        'bootstrap': ['jquery'],
        'ui-bootstrap': ['bootstrap', 'angular'],
        'angular-resource': ['angular'],
        'angular-route': ['angular'],
        'angular-sanitize': ['angular']
    },
    deps: ['all']
});

define('angular-modules', ['angular-animate', 'angular-resource', 'angular-sanitize', 'ui-bootstrap']);

define('all', ['application/controllers/messagesController',
    'application/controllers/dialogController',
    'application/filters/byServer',
    'application/services/logLevels',
    'application/services/messageServers',
    'application/services/repeatedMessages',
    'application/services/serverEvents',
    'application/services/socket',
    'application/services/unreadErrorMessages',
    'application/directives/instaloggerScroll',
    'application/directives/logMessage',
    'application/directives/serverPing'])


window.name = "NG_DEFER_BOOTSTRAP!";

require(['all',
    'instaloggerApp'
], function (all, instaloggerApp) {
    var $html = angular.element(document.getElementsByTagName('html')[0]);

    angular.element().ready(function () {
        angular.resumeBootstrap([instaloggerApp['name']]);
    });
});