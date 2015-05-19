(function() {
  'use strict';

  angular
    .module('app.widgets')
    .directive('tagsInput', tagsInput);

    /* @ngInject */
    function tagsInput() {
      var directive = {
        restrict: 'AEC',
        link: link
      };

      return directive;

      function link(scope, element, attrs) {
        element.tagsinput();
        element.on('change', function() {
          scope.$emit('tags', element.val());
        });
      }
    }
}());
