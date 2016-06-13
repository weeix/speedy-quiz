var app = angular.module('app', ['components', 'ngRoute']);

app.controller('MainController', function($scope, $window, b64) {
  $scope.userState = {
    isAuthenticated: false,
    welcome: '',
    message: ''
  };
  if ($window.sessionStorage.token) {
    $scope.userState.isAuthenticated = true;
    var encodedProfile = $window.sessionStorage.token.split('.')[1];
    var profile = JSON.parse(b64.decode(encodedProfile));
    $scope.userState.welcome = 'Welcome ' + profile.displayName;
  }
});

app.controller('LoginController', function($scope, $http, $window, $location, b64) {
  $scope.submit = function() {
    $http
      .post('/authenticate', $scope.user)
      .success(function (data, status, headers, config) {
        $window.sessionStorage.token = data.token;
        $scope.userState.isAuthenticated = true;
        var encodedProfile = $window.sessionStorage.token.split('.')[1];
        var profile = JSON.parse(b64.decode(encodedProfile));
        $scope.userState.welcome = 'Welcome ' + profile.displayName;
        $location.url('/about');
      })
      .error(function (data, status, headers, config) {
        // Erase the token if the user fails to log in
        delete $window.sessionStorage.token;
        $scope.userState.isAuthenticated = false;

        // Handle login errors here
        $scope.error = 'Error: Invalid user or password';
        $scope.userState.welcome = '';
      });
  };
});

app.factory('b64', function () {
  return {
    encode: (str) => {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function(match, p1) {
        return String.fromCharCode('0x' + p1);
    }));
    },
    decode: (str) => {
    return decodeURIComponent(Array.prototype.map.call(atob(str), function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    }
  };
})

app.config(function($routeProvider) {
  $routeProvider.
    when('/', {
      templateUrl: 'template/test.html',
      controller: function($scope) {
        $scope.linkText = 'about';
      }
    }).
    when('/login', {
      templateUrl: 'template/login.html',
      controller: 'LoginController'
    }).
    when('/about', {
      templateUrl: 'template/test2.html'
    });
});