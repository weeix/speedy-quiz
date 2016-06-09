var app = angular.module('components', []);

app.directive('mainContent', function() {
  return {
    controller: 'MainController',
    templateUrl: 'template/main.html'
  }
});