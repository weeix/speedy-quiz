var app = angular.module('app', ['components', 'ngRoute']);

app.controller('MainController', function($scope, $http) {
  $http.get('/api/v1/me').success(function(data) {
    $scope.user = data.displayName;
  });
});

app.config(function($routeProvider) {
  $routeProvider.
    when('/', {
      templateUrl: 'template/test.html',
      controller: function($scope, $location) {
        $scope.linkText = 'about';
        $location.url('/about');
      }
    }).
    when('/about', {
      templateUrl: 'template/test2.html'
    });
});