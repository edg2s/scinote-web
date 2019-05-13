/* global animateSpinner FilePreviewModal */

function setupAssetsLoading() {
  var DELAY = 2500;
  var REPETITIONS = 60;
  var cntr = 0;
  var intervalId;

  function refreshAssets() {
    var elements = $("[data-status='asset-loading']");

    if (!elements.length) {
      return false;
    }

    $.each(elements, function(_, el) {
      var $el = $(el);

      // Perform an AJAX call to present URL
      // to check if file already exists
      $.ajax({
        url: $el.data('present-url'),
        type: 'GET',
        dataType: 'json',
        success: function(data) {
          if (data.processing === true) {
            return;
          }

          if (data.processing === false) {
            $el.html(data.placeholder_html);
            $el.attr('data-status', 'asset-loaded');
            return;
          }

          $el.attr('data-status', 'asset-loaded');
          $el.find('img').hide();
          $el.next().hide();
          $el.html('');

          if (data.type === 'image') {
            $el.html(
              "<a class='file-preview-link' id='modal_link"
              + data['asset-id'] + "' data-status='asset-present' "
              + "href='" + data['download-url'] + "' data-preview-url='" + data['preview-url'] + "'>"
              + "<img src='" + data['image-tag-url'] + "'><p>" + data.filename + '</p></a>'
            );
          } else {
            $el.html(
              "<a class='file-preview-link' id='modal_link"
              + data['asset-id'] + "' data-status='asset-present' "
              + "href='" + data['download-url'] + "' data-preview-url='"
              + data['preview-url'] + "'><p>" + data.filename + '</p></a>'
            );
          }
          animateSpinner(null, false);
          FilePreviewModal.init();
        },
        error: function(data) {
          if (data.status === 403) {
            $el.find('img').hide();
            $el.next().hide();
            // Image/file exists, but user doesn't have
            // rights to download it
            if (data.type === 'image') {
              $el.html(
                "<img src='" + data['image-tag-url'] + "'><p>" + data.filename + '</p>'
              );
            } else {
              $el.html('<p>' + data.filename + '</p>');
            }
          } else {
            // Do nothing, file is not yet present
            animateSpinner(null, false);
          }
        }
      });
    });

    return true;
  }

  function finalizeAssets() {
    var elements = $("[data-status='asset-loading']");

    $.each(elements, function(_, el) {
      var $el = $(el);
      $el.attr('data-status', 'asset-failed');
      if ($el.data('filename')) {
        $el.html($el.data('filename'));
      }
    });
  }

  intervalId = window.setInterval(function() {
    cntr += 1;
    if (cntr >= REPETITIONS || !refreshAssets()) {
      finalizeAssets();
      window.clearInterval(intervalId);
    }
  }, DELAY);
}
