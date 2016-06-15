var app = angular.module('components', []);

app.directive('mainContent', function() {
  return {
    controller: 'MainCtrl',
    templateUrl: 'template/main.html'
  }
});