var app = angular.module('app', ['components', 'ngRoute']);

app.controller('MainCtrl', ['$scope', 'UserAuth', function ($scope, UserAuth) {
  $scope.$on('$locationChangeStart', function(event, newUrl) {
    UserAuth.redirect();
  });
  UserAuth.setAuth()
    .finally(function() {
      $scope.userState = UserAuth.state;
      UserAuth.redirect();
    });
}]);

app.controller('LoginCtrl', ['$scope', 'UserAuth', function ($scope, UserAuth) {
  $scope.submit = function (user) {
    UserAuth.login(user, function (err) {
      $scope.userState = UserAuth.state;
      if (err) {
        $scope.error = err.message;
      } else {
        UserAuth.redirect();
      }
    });
  };
}]);

app.controller('AdminCtrl', ['$scope', 'UserAuth', function ($scope, UserAuth) {
  $scope.logout = function () {
    UserAuth.logout();
    UserAuth.redirect();
  };
}]);

app.factory('UserAuth', ['$http', '$window', '$location', '$q', function ($http, $window, $location, $q) {
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
      message: '',
      role: undefined
    },
    setAuth: function () {
      var deferred = $q.defer();
      if ($window.sessionStorage.token) {
        this.state.isAuthenticated = true;
        var encodedProfile = $window.sessionStorage.token.split('.')[1];
        var profile = JSON.parse(decode(encodedProfile));
        this.state.welcome = 'Welcome ' + profile.displayName;
        this.state.role = profile.role;
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
          .then(function (response) {
            $window.sessionStorage.token = response.data.token;
            self.setAuth();
            callback(null);
          }, function (response) {
            // Handle login errors here
            self.logout();
            var err = new Error('Error: Invalid username or password');
            callback(err);
          });
      }
    },
    logout: function () {
      this.state.welcome = '';
      this.state.message = '';
      this.state.isAuthenticated = false;
      this.state.role = undefined;
      delete $window.sessionStorage.token;
    },
    redirect: function () {
      if (this.state.role === 0) {
        $location.path('/admin');
      } else if (this.state.role === 1) {
        $location.path('/about');
      } else {
        $location.path('/login');
      }
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
    }).
    when('/admin', {
      templateUrl: 'template/admin.html',
      controller: 'AdminCtrl'
    });
  $httpProvider.interceptors.push('authInterceptor');
}]);