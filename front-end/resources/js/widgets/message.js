(function() {
  'use strict';

  angular
    .module('app.widgets')
    .directive('messageSend', messageSend);

    /* @ngInject */
    function messageSend() {
      var directive = {
        restrict: 'A',
        link: link
      };

      return directive;

      function link(scope, element, attrs) {
        scope.$on('message', function(event, data) {
          console.log(data);
          var top = element.prop('scrollHeight');
          console.log(top);
          element.scrollTop(top + 20);
          element.html(element.html() + data.user + ': ' + data.message + '<br>');
        });
      }
    }
}());
