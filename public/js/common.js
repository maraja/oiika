//Initialization
$(document).ready(function() {
  var page = window.location.pathname.substr(0, window.location.pathname.lastIndexOf('/'));
  page = (page == '') ? window.location.pathname : page;
  var popup;

  o.init();

  switch(page) {
    case "/":
      o.index.init();
      break;
    case "/search":
      o.search.init();
      break;
    case "/tutor":
      o.tutor.init();
      break;
    case "/tutor-settings":
      o.tutor_settings.init();
      break;
  }

  if(window.opener) {
    window.opener.location.reload();
    window.close();
  }
});

//Actions
o = {};
o.init = function() {
  //get user token
  if(localStorage.token) {
    o.token = localStorage.token;
  } else {
    o.token = null;
  }

  //initialize common components
  $('.social_logins .facebook').click(function () {
    var left = (screen.width/2)-(780/2);
    var top = (screen.height/2)-(600/2);
    popup = window.open("http://localhost:3000/auth/facebook", "SignIn", "width=780,height=600,toolbar=0,scrollbars=0,status=0,resizable=0,location=0,menuBar=0,left=" + left + ",top=" + top);
    //setTimeout(CheckLoginStatus, 2000);
    popup.focus();
    return false;
  });

  $('.social_logins .google').click(function () {
    var left = (screen.width/2)-(780/2);
    var top = (screen.height/2)-(600/2);
    popup = window.open("http://localhost:3000/auth/google", "SignIn", "width=780,height=600,toolbar=0,scrollbars=0,status=0,resizable=0,location=0,menuBar=0,left=" + left + ",top=" + top);
    //setTimeout(CheckLoginStatus, 2000);
    popup.focus();
    return false;
  });

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
      if(data.error) {
        //throw error
      } else {
        localStorage.token = data.token;
      }

    	location.reload();

    }).fail(function() {
      //alert( "error" );
    });
  });

  $('#signup_modal form .submit').click(function() {
    var first_name = $('#signup_modal form #signup_first_name').val();
    var last_name = $('#signup_modal form #signup_last_name').val();
    var email = $('#signup_modal form #signup_email').val();
    var password = $('#signup_modal form #signup_password').val();
    var user_type; // GET THE USER TYPE SOMEHOW

    $.ajax({
        url: "http://localhost:3000/signup",
        type: "POST",
        data: {
          first_name: first_name,
          last_name: last_name,
        	email: email,
        	password: password,
          user_type: user_type
        }
    }).done(function(data) {
      if(data.error) {
        //throw error
      } else {
        localStorage.token = data.token;
      }

    	location.reload();

    }).fail(function() {
      //alert( "error" );
    });
  });
}

o.index = {};
o.index.init = function() {
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

o.search = {};
o.search.init = function() {
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

o.user = {};
o.user.init = function() {
    //initialize user profiles
}

o.tutor = {};
o.tutor.init = function() {
    //initialize tutor profiles
    $('#datepicker').datepicker({
      minDate: 0,
      beforeShowDay: o.tutor.checkDates
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

    $(".book_session").click(function(){
        o.tutor.calendar.next(calendar_view, booking_view);
        return false;
    });
    $(".go_back").click(function(){
        o.tutor.calendar.prev(booking_view, calendar_view);
        return false;
    });

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

    $('#reviews_scroll').smoothScroll({offset: -90});

    //TODO: Trigger to load tutor reviews as user scrolls down

    //initialize map
    google.maps.event.addDomListener(window, 'load', o.tutor.initMap);
}

o.tutor.checkDates = function(date) {
  //Check for unavailable dates before rendering calendar
  var disableddates = ["05-08-2016", "12-11-2014", "12-25-2014", "12-20-2014"];
  var string = $.datepicker.formatDate('dd-mm-yy', date);
  return [disableddates.indexOf(string) == -1];
}

o.tutor.calendar = {};
o.tutor.calendar.next = function($src, $tgt) {
  //transition to next booking view
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

o.tutor.calendar.prev = function($src, $tgt) {
  //transition back to calendar view
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

o.tutor.initMap = function() {
  //initialize the tutor profile map
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

o.tutor.confirmBooking = function(data) {
  //TODO: Process the booking request and display confirmation on the page
}

o.tutor.loadReviews = function() {
  //TODO: Load tutor reviews and display them on the page
  var id; //GET TUTOR ID FROM URL

  $.ajax({
      url: "http://thehotspot.ca:10010/tutor/" + id + "/reviews",
      type: "GET",
      data: {
        tutor_id: email,
        token: token
      }
  }).done(function(data) {
    if(data.error) {
      o.alertError(data.error);
    } else {
      $('.reviews_wrapper').html(data);
    }
  }).fail(function(error) {
    o.alertError(error);
  });
}

o.tutor_settings = {};
o.tutor_settings.init = function() {
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

o.messages = {};
o.messages.init = function() {
  //initialize messages
}
