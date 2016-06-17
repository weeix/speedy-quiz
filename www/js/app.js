var app = angular.module('app', ['components', 'ngRoute']);

app.controller('MainCtrl', ['$scope', 'UserAuth', function ($scope, UserAuth) {
  $scope.$on('$locationChangeStart', function(event, newUrl) {
    UserAuth.redirect();
  });
  UserAuth.setAuth()
    .finally(function() {
      $scope.userState = UserAuth.state;
    });
}]);

app.controller('LoginCtrl', ['$scope', 'UserAuth', function ($scope, UserAuth) {
  $scope.userState = UserAuth.state;
  $scope.submit = function (user) {
    UserAuth.login(user)
      .then(function () {
        UserAuth.redirect();
      }, function(err) {
        $scope.error = err;
      });
    };
}]);

app.controller('AdminCtrl', ['$scope', '$http', 'UserAuth', function ($scope, $http, UserAuth) {
  $scope.logout = function () {
    UserAuth.logout();
    UserAuth.redirect();
  };
  $http
    .get('/api/v1/group')
    .then(function (response) {
      $scope.groups = response.data;
    });
}]);

app.factory('UserAuth', ['$http', '$window', '$location', '$timeout', '$q', function ($http, $window, $location, $timeout, $q) {
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
    login: function (user) {
      var deferred = $q.defer();
      var self = this;
      if (user == null || user.username == null || user.password == null) {
        deferred.reject('Error: Username/password is null');
      } else {
        $http
          .post('/authenticate', user)
          .then(function (response) {
            $window.sessionStorage.token = response.data.token;
            self.setAuth();
            deferred.resolve();
          }, function (response) {
            // Handle login errors here
            self.logout();
            deferred.reject('Error: Invalid username or password');
          });
      }
      return deferred.promise;
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

app.factory('authInterceptor', ['$rootScope', '$q', '$window', '$injector', function ($rootScope, $q, $window, $injector) {
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
        var UserAuth = $injector.get('UserAuth');
        UserAuth.logout();
        UserAuth.redirect();
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