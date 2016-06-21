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

app.controller('AdminCtrl', ['$scope', '$http', '$q', 'UserAuth', function ($scope, $http, $q, UserAuth) {
  $scope.$on('quizStarted', function (event, quizID) {
    $scope.quizState = 0; // 0 = Init, 1 = Ready, 2 = Asked, 3 = Solved, 4 = Finished
    var socket = io();
    var questionIDs;
    var currentQuestion;
    var openSocket = function() {
      socket.on('connect', function () {
        return UserAuth.getToken()
          .then(function(token) {
            socket.emit('join', token, $scope.selected.gid, function (err) {
              if (err) {
                console.log(err);
                UserAuth.logout();
                UserAuth.redirect();
              }
              socket.on('question', function(question) {
                $scope.$apply(function () {
                  $scope.question = question;
                });
              });
              $scope.sendQuestion = function() {
                currentQuestion = questionIDs.shift().qid;
                socket.emit('ask', currentQuestion);
                $scope.quizState = 2; // Asked
              };
              $scope.solveQuestion = function() {
                socket.emit('solve', currentQuestion);
                $scope.quizState = 3; // Solved
              };
            });
          });
      });
    };
    var getQuestions = function () {
      return $http
        .get('/api/v1/quiz/' + quizID.toString() + '?unasked')
        .then(function (response) {
          questionIDs = response.data;
        });
    };
    $q.all([
      openSocket(),
      getQuestions()
    ]).then(function () {
      $scope.quizID = quizID;
      $scope.quizState = 1; // Ready
    });
  });
  $scope.selected = {
    cid: undefined,
    gid: undefined
  };
  $scope.startQuiz = function (pair) {
    $scope.pressedStartQuiz = true;
    $http
      .post('/api/v1/quiz', pair)
      .then(function (response) {
        $scope.$emit('quizStarted', response.data.lastID);
      });
  }
  $scope.logout = function () {
    UserAuth.logout();
    UserAuth.redirect();
  };
  $http
    .get('/api/v1/collection')
    .then(function (response) {
      $scope.collections = response.data;
      $scope.selected.cid = response.data[0].cid.toString();
    });
  $http
    .get('/api/v1/group')
    .then(function (response) {
      $scope.groups = response.data;
      $scope.selected.gid = response.data[0].gid.toString();
    });
}]);

app.controller('UserCtrl', ['$scope', '$http', 'UserAuth', function ($scope, $http, UserAuth) {
  var socket = io();
  socket.on('connect', function () {
    return UserAuth.getToken()
      .then(function(token) {
        socket.emit('join', token, null, function (err) {
          if (err) {
            console.log(err);
            UserAuth.logout();
            UserAuth.redirect();
          }
          socket.on('question', function(question) {
            $scope.$apply(function () {
              $scope.question = question;
            });
          });
        });
      });
  });
  $scope.logout = function () {
    UserAuth.logout();
    UserAuth.redirect();
  };
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
    },
    getToken: function () {
      var deferred = $q.defer();
      if ($window.sessionStorage.token) {
        deferred.resolve($window.sessionStorage.token);
      } else {
        deferred.reject('Error: Token does not exist');
      }
      return deferred.promise;
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