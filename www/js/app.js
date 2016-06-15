var app = angular.module('app', ['components', 'ngRoute']);

app.controller('MainCtrl', ['$scope', 'UserAuth', function ($scope, UserAuth) {
  $scope.userState = UserAuth.state;
  UserAuth.setAuth();
}]);

app.controller('LoginCtrl', ['$scope', '$location', 'UserAuth', function ($scope, $location, UserAuth) {
  $scope.submit = function (user) {
    UserAuth.login(user, function (err) {
      $scope.userState = UserAuth.state;
      if (err) {
        $scope.error = err.message;
      } else {
        $location.url('/about');
      }
    });
  };
}]);

app.factory('UserAuth', ['$http', '$window', '$q', function ($http, $window, $q) {
  var encode = function (str) {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function (match, p1) {
      return String.fromCharCode('0x' + p1);
    }));
  };
  var decode = function (str) {
    return decodeURIComponent(Array.prototype.map.call(atob(str), function (c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
  };
  return {
    state: {
      isAuthenticated: false,
      welcome: '',
      message: ''
    },
    setAuth: function () {
      var deferred = $q.defer();
      if ($window.sessionStorage.token) {
        this.state.isAuthenticated = true;
        var encodedProfile = $window.sessionStorage.token.split('.')[1];
        var profile = JSON.parse(decode(encodedProfile));
        this.state.welcome = 'Welcome ' + profile.displayName;
        deferred.resolve();
      } else {
        deferred.reject();
      }
      return deferred.promise;
    },
    login: function (user, callback) {
      var self = this;
      if (user == null || user.username == null || user.password == null) {
        var err = new Error("Error: Username/password is null");
        callback(err);
        return;
      } else {
        $http
          .post('/authenticate', user)
          .success(function (data, status, headers, config) {
            $window.sessionStorage.token = data.token;
            self.setAuth();
            callback(null);
            return;
          })
          .error(function (data, status, headers, config) {
            // Handle login errors here
            self.logout();
            var err = new Error('Error: Invalid username or password');
            callback(err);
            return;
          });
      }
    },
    logout: function () {
      this.state.welcome = '';
      this.state.message = '';
      this.state.isAuthenticated = false;
      delete $window.sessionStorage.token;
    }
  };
}]);

app.factory('authInterceptor', ['$rootScope', '$q', '$window', function ($rootScope, $q, $window) {
  return {
    request: function (config) {
      config.headers = config.headers || {};
      if ($window.sessionStorage.token) {
        config.headers.Authorization = 'Bearer ' + $window.sessionStorage.token;
      }
      return config;
    },
    responseError: function (rejection) {
      if (rejection.status === 401) {
        // handle the case where the user is not authenticated
        delete $window.sessionStorage.token;
      }
      return $q.reject(rejection);
    }
  };
}]);

app.config(['$routeProvider', '$httpProvider', function ($routeProvider, $httpProvider) {
  $routeProvider.
    when('/', {
      templateUrl: 'template/test.html'
    }).
    when('/login', {
      templateUrl: 'template/login.html',
      controller: 'LoginCtrl'
    }).
    when('/about', {
      templateUrl: 'template/test2.html'
    });
  $httpProvider.interceptors.push('authInterceptor');
}]);