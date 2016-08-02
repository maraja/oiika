//Initialization
$(document).ready(function() {
  var page = window.location.pathname.substr(0, window.location.pathname.lastIndexOf('/'));

  oiika.init();

  switch(page) {
    case "/":
      oiika.index.init();
      break;
    case "/search":
      oiika.search.init();
      break;
    case "/tutor":
      oiika.tutor.init();
      break;
    case "/tutor-settings":
      oiika.tutor_settings.init();
      break;
  }
});

//Actions
oiika = {};
oiika.init = function() {
  //initialize common components
  $('#login_modal form .submit').click(function() {
    var email = $('#login_modal form #login_email').val();
    var password = $('#login_modal form #login_password').val();

    $.ajax({
        url: "http://localhost:3000/login",
        type: "POST",
        data: {
        	email: email,
        	password: password
        }
    }).done(function(data) {

    	location.reload();

    }).fail(function() {
      //alert( "error" );
    });
  });

  $('#signup_modal form .submit').click(function() {
    var email = $('#login_modal form #login_email').val();
    var password = $('#login_modal form #login_password').val();

    $.ajax({
        url: "http://localhost:3000/signup",
        type: "POST",
        data: {
        	email: email,
        	password: password
        }
    }).done(function(data) {

    	location.reload();

    }).fail(function() {
      //alert( "error" );
    });
  });
}

oiika.index = {};
oiika.index.init = function() {
  //initialize autocomplete
  google.maps.event.addDomListener(window, 'load', function() {
    var options = {
			types: ['(cities)'],
			componentRestrictions: {country: 'CA'}
		};

		var input = document.getElementById('search_location');
		var autocomplete = new google.maps.places.Autocomplete(input, options);
  });
}

oiika.search = {};
oiika.search.init = function() {
  $('.filter select').select2({
		minimumResultsForSearch: -1
	});

  //initialize map
  google.maps.event.addDomListener(window, 'load', init_map);
	google.maps.event.addListener(map, 'idle', function() {
		 search(map.getBounds());
	});

	function init_map() {
		map = new google.maps.Map(document.getElementById('map'), {
			center: {lat: -34.397, lng: 150.644},
			zoom: 8
		});
	}
}

oiika.user = {};
oiika.user.init = function() {
    //initialize user profiles
}

oiika.tutor = {};
oiika.tutor.init = function() {
    //initialize tutor profiles
    $('#datepicker').datepicker({
      minDate: 0,
      beforeShowDay: oiika.tutor.checkDates
    });
    $(".sidebar").stick_in_parent({
      offset_top: 60
    }, function() {
      setTimeout(() => {
        $('.faux_shade_over > div:last').css('position', '');
      }, 500);
    });

    var calendar_view = $('.sidebar .calendar_wrapper');
    var booking_view = $('.sidebar .booking_wrapper');
    booking_view.hide();

    $(".book_session").click(function(){
        next(calendar_view, booking_view);
        return false;
    });
    $(".go_back").click(function(){
        prev(booking_view, calendar_view);
        return false;
    });

    function next($src, $tgt){
        var $parent = $src.parent();
        var width = $parent.outerWidth();

        $src.css({position: 'absolute'});
        $src.css({width: '92%'});
        $tgt.hide().appendTo($parent).css({left: width, position: 'absolute'});

        $src.animate({left : -width}, 250, function(){
            $src.hide();
            $src.css({left: null, position: null});
        });
        $tgt.show().animate({left: 0}, 250, function(){
            $tgt.css({left: null, position: null});
        });
    }
    function prev($src, $tgt) {
        var $parent = $src.parent();
        var width = $parent.outerWidth();

        $src.animate({left: width}, 250, function(){
            $src.hide();
            $src.css({left: null, position: null});
        });
        $tgt.show().animate({left: 0, width: '98%'}, 250, function(){
            $tgt.css({left: '0', position: 'relative', width: 'auto'});
        });
    }

    $('#reviews_scroll').smoothScroll({offset: -90});

    $(document).scroll(function() {
      if(!$('.calendar').hasClass('contrast_fix') && $(document).scrollTop() > 300) {
        $('.ui-datepicker-title').css('color', '#777');
        $('.ui-datepicker-calendar thead tr th span').css('color', '#777');
        $('.calendar').addClass('contrast_fix');
      } else if($('.calendar').hasClass('contrast_fix') && $(document).scrollTop() < 190) {
        $('.ui-datepicker-title').css('color', '#AAA');
        $('.ui-datepicker-calendar thead tr th span').css('color', '#AAA');
        $('.calendar').removeClass('contrast_fix');
      }
    });

    //initialize map
    google.maps.event.addDomListener(window, 'load', init_map);

  	function init_map() {
  		map = new google.maps.Map(document.getElementById('map'), {
  			center: {lat: 43.643305, lng: -79.378686},
  			zoom: 10
  		});

      draw_circle = new google.maps.Circle({
          center: {lat: 43.643305, lng: -79.378686},
          radius: 30000,
          strokeColor: "#2ba9cc",
          strokeOpacity: 0.7,
          strokeWeight: 1,
          fillColor: "#2ba9cc",
          fillOpacity: 0.3,
          map: map
      });
  	}
}
oiika.tutor.checkDates = function(date) {
  var disableddates = ["05-08-2016", "12-11-2014", "12-25-2014", "12-20-2014"];
  var string = $.datepicker.formatDate('dd-mm-yy', date);
  return [disableddates.indexOf(string) == -1];
}

oiika.tutor_settings = {};
oiika.tutor_settings.init = function() {
  //initialize tutor settings page
  var map;
  var tab_opened = false;
  function init_map() {
    var options = {
      center: new google.maps.LatLng(43.643305, -79.378686),
      zoom: 10
    };

    map = new google.maps.Map(document.getElementById('map'), options);

    var circle;
    var drawingManager = new google.maps.drawing.DrawingManager({
      drawingMode: google.maps.drawing.OverlayType.CIRCLE,
      drawingControl: false,
      drawingControlOptions: {
        position: google.maps.ControlPosition.TOP_CENTER,
        drawingModes: [
          google.maps.drawing.OverlayType.CIRCLE
        ]
      },
      circleOptions: {
        strokeColor: "#2ba9cc",
        strokeOpacity: 0.7,
        strokeWeight: 1,
        fillColor: "#2ba9cc",
        fillOpacity: 0.3,
        clickable: false,
        editable: true,
        zIndex: 1
      }
    });
    drawingManager.setMap(map);
    google.maps.event.addListener(drawingManager, 'overlaycomplete', function(event) {
      // Switch back to non-drawing mode after drawing a shape.
      drawingManager.setDrawingMode(null);
      console.log(event);
    });
    google.maps.event.addListener(drawingManager, 'circlecomplete', function(shape) {
      if (shape == null || (!(shape instanceof google.maps.Circle))) return;

      if (circle != null) {
          circle.setMap(null);
          circle = null;
      }

      circle = shape;
      if(circle.getRadius() > 100000) {
        circle.setRadius(100000);
      }
      console.log('radius', circle.getRadius());
      console.log('lat', circle.getCenter().lat());
      console.log('lng', circle.getCenter().lng());

      google.maps.event.addListener(circle, 'radius_changed', function() {
        if(circle.getRadius() > 100000) {
          circle.setRadius(100000);
        }
        console.log('radius', circle.getRadius());
        console.log('lat', circle.getCenter().lat());
        console.log('lng', circle.getCenter().lng());
      });
    });
  }

  google.maps.event.addDomListener(window, 'load', init_map);
  $('.vertical_nav .nav a[href="#service_regions"]').click(function() {
    if(tab_opened == false) {
      tab_opened = true;
      setTimeout(function() {
          init_map();
      }, 300);
    }
  });

  var schedule = {};

  $("#schedule_selector").dayScheduleSelector({
    interval: 60,
    startTime: '06:00',
    endTime: '23:59'
  });
  $("#schedule_selector").on('selected.artsy.dayScheduleSelector', function (e) {
    resetSchedule();
    $('#schedule_selector table tr td[data-selected]').each(function() {
      var day = $(this).data('day');
      var time = $(this).data('time');
      schedule[day].push(time);
    });
    console.log(schedule);
  });

  function resetSchedule() {
    schedule = {
      0: [],
      1: [],
      2: [],
      3: [],
      4: [],
      5: [],
      6: []
    };
  }
}

oiika.reviews = {};
oiika.reviews.init = function() {
  //initialize tutor reviews
}

oiika.booking = {};
oiika.booking.init = function() {
  //initialize booking system
}

oiika.messages = {};
oiika.messages.init = function() {
  //initialize messages
}
