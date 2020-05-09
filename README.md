# myVueStudy
$(function(){
      $('[name="ALLCHECKED"]').on('change', function() {
          $('.agree_bundle_list').find('input:checkbox').prop('checked', $(this).prop('checked'));
      });
      $('[name="allCheckChild"]').on('change', function () {
          var $this = $(this);
          setChildAll($this);
      });

      $('.inner_list').find('input:checkbox').not('[data-id="allCheckChild"]').on('change', function () {
          var $this = $(this);
          setCheckAll($this);
      });
  });

  function setChildAll($this) {
      var childTotal = $('[name="allCheckChild"]').length;
      var childCount = 0;
      $this.parents('li').find('input:checkbox').prop('checked', $this.prop('checked'));
      $('[name="allCheckChild"]').each(function() {
          if ($(this).prop('checked')) {
              childCount++;
          }
      });
      if ($('[name="ALLCHECKED"]').length > 0) {
          $('[name="ALLCHECKED"]').prop('checked', childTotal == childCount);
      }
  }

  function setCheckAll($this) {
      var myId = $this.attr('name');
      var checkTotal = $this.closest('.inner_list').find('input:checkbox').not('[data-id="allCheckChild"]').length;
      var checkCount = 0;
      $this.closest('.inner_list').find('input:checkbox').not('[data-id="allCheckChild"]').each(function () {
          if ($(this).prop('checked')) {
              checkCount++;
          }
      });

      $('[data-id="allCheckChild-' + myId + '"]').prop('checked', checkTotal == checkCount);

      var childTotal = $('[name="allCheckChild"]').length;
      var childCount = 0;
      $('[name="allCheckChild"]').each(function() {
          if ($(this).prop('checked')) {
              childCount++;
          }
      });
      if ($('[name="ALLCHECKED"]').length > 0) {
          $('[name="ALLCHECKED"]').prop('checked', childTotal == childCount);
      }
  }
