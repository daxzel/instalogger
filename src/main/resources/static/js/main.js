requirejs.config({

    paths: {
        'angular' : 'lib/angular',
        'angular-animate' : 'lib/angular-animate',
        'angular-resource' : 'lib/angular-resource',
        'angular-route' : 'lib/angular-route',
        'angular-sanitize' : 'lib/angular-sanitize',
        'bootstrap' : 'lib/bootstrap',
        'jquery' : 'lib/jquery',
        'sockjs' : 'lib/sockjs',
        'tinycon' : 'lib/tinycon',
        'ui-bootstrap' : 'lib/ui-bootstrap',
        'vertxbus' : 'lib/vertxbus',
        'ZeroClipboard' : 'lib/ZeroClipboard',
        'application' : 'application/application'
    },
    shim: {
        'angular': {
            exports: 'angular'
        },
        'angular-animate': ['angular'],
        'angular-resource': ['angular'],
        'angular-route': ['angular'],
        'angular-sanitize': ['angular']

    },
    deps: ['application']
});

//define('angular', ['jquery']);
define('angular-modules', ['angular-animate','angular-resource','angular-route','angular-sanitize'])
//define('ui-bootstrap',['bootstrap'])
