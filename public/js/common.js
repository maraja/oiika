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
    case "/auth/facebook":
    case "/auth/google":
      o.auth_callback();
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
  console.log(o.token);

  //initialize common components
  $('.social_logins .facebook').click(function () {
    var left = (screen.width/2)-(780/2);
    var top = (screen.height/2)-(600/2);
    var url = $(this).attr('href');

    $('.modal.in .modal-message').remove();

    popup = window.open(url, "SignIn", "width=780,height=600,toolbar=0,scrollbars=0,status=0,resizable=0,location=0,menuBar=0,left=" + left + ",top=" + top);
    //setTimeout(CheckLoginStatus, 2000);
    popup.focus();
    return false;
  });

  $('.social_logins .google').click(function () {
    var left = (screen.width/2)-(780/2);
    var top = (screen.height/2)-(600/2);
    var url = $(this).attr('href');

    $('.modal.in .modal-message').remove();

    popup = window.open(url, "SignIn", "width=780,height=600,toolbar=0,scrollbars=0,status=0,resizable=0,location=0,menuBar=0,left=" + left + ",top=" + top);
    //setTimeout(CheckLoginStatus, 2000);
    popup.focus();
    return false;
  });

  $('#login_modal form .submit').click(function() {
    var email = $('#login_modal form #login_email').val();
    var password = $('#login_modal form #login_password').val();

    $('.modal.in .modal-message').remove();

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
    var user_type = 'tutee'; // GET THE USER TYPE SOMEHOW

    $('.modal.in .modal-message').remove();

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
      } else if(data.token) {
          localStorage.token = data.token;
      } else {
        //no token was returned, should happen in case that user signs up with email/password and needs to verify email first
      }

    	location.reload();
    }).fail(function() {
      //o.alert("An error occurred while connecting to the server. Please try again later", 2000);
    });

    return false;
  });
}

o.auth_callback = function() {
  //runs in the popup window
  var provider = $('input#provider').val();
  var status = $('input#status').val();
  var message = $('input#message').val();
  localStorage.token = $('input#token').val();

  if(window.opener) {
    window.opener.o.authPopupCallback(provider, status, message);

    if(status == 'success') {
      window.opener.location.reload();
    }

    window.close();
  }
}

o.authPopupCallback = function(provider, status, message) {
  //called from popup window
  $('.modal.in .modal-message').remove();
  $('.modal.in .modal-content').prepend('<div class="modal-message ' + status + '">' + message + '</div>').show();
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
    var reviews_top = $('.tutor_reviews').offset().top;
    var reviews_loaded = false;

    o.tutor.calendar.parseSchedule();

    $('#datepicker').datepicker({
      minDate: 0,
      onChangeMonthYear: o.tutor.calendar.parseSchedule,
      beforeShowDay: o.tutor.calendar.checkDates
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
        o.tutor.calendar.selectedDate = $.datepicker.formatDate('yy-mm-dd', $('#datepicker').datepicker('getDate'));
        o.tutor.calendar.next(calendar_view, booking_view);
        return false;
    });
    $(".go_back").click(function(){
        o.tutor.calendar.prev(booking_view, calendar_view);
        return false;
    });

    $(window).scroll(function() {
      //calendar view logic
      if(!$('.calendar').hasClass('contrast_fix') && $(window).scrollTop() > 300) {
        $('.ui-datepicker-title').css('color', '#777');
        $('.ui-datepicker-calendar thead tr th span').css('color', '#777');
        $('.calendar').addClass('contrast_fix');
        $('.selected_day').css('color', '#222');
        $('.selected_date').css('color', '#222');
      } else if($('.calendar').hasClass('contrast_fix') && $(window).scrollTop() < 190) {
        $('.ui-datepicker-title').css('color', '#AAA');
        $('.ui-datepicker-calendar thead tr th span').css('color', '#AAA');
        $('.calendar').removeClass('contrast_fix');
        $('.selected_day').css('color', '#f8f8f8');
        $('.selected_date').css('color', '#f8f8f8');
      }

      //reviews view logic
      if($(window).scrollTop() + $(window).height() > reviews_top && reviews_loaded == false) {
        reviews_loaded = true;
        o.tutor.loadReviews();
      }
    });

    $('#reviews_scroll').smoothScroll({offset: -90});

    //initialize map
    google.maps.event.addDomListener(window, 'load', o.tutor.initMap);
}

o.tutor.calendar = {};
o.tutor.calendar.parseSchedule = function(year, month, instance) {
  //calculate monthly schedule
  var all_day_exceptions = []; //negated from available dates on calendar
  var partial_exceptions = []; //negated from available monthly schedule
  var monthly_schedule = {};
  var monthly_availability = {};

  var month = (typeof month !== 'undefined') ? (month - 1) : moment().month(); //0 indexed
  var current_month = moment().month();

  if(month == current_month) {
    var days_in_month = moment().daysInMonth();
    var day_of_month = moment().date();
  } else {
    var days_in_month = moment().daysInMonth(month);
    var day_of_month = 1;
  }

  for(var i = day_of_month; i <= days_in_month; i++) {
    var date = moment().month(month).date(i);
    var day_of_week = moment(date).day();

    for(var exception of p.exceptions) {
      if(moment(date).isSame(exception.date, 'day')) {
        //date matches a day in exceptions
        if(exception.all_day == true) {
          all_day_exceptions.push(moment(date).format('YYYY-MM-DD'));
        } else {
          partial_exceptions.push({
            'date': moment(date).format('YYYY-MM-DD'),
            'timeslots': exception.timeslots
          });
        }
      }
    }

    monthly_schedule[moment(date).format('YYYY-MM-DD')] = p.schedule[day_of_week];
  }

  monthly_availability = monthly_schedule;

  for(var date in monthly_availability) {

    if($.inArray(date, all_day_exceptions) !== -1) {

      delete monthly_availability[date];

    } else {
      for(var i = 0; i < partial_exceptions.length; i++) {
        var exc_date = moment(partial_exceptions[i].date).format('YYYY-MM-DD');

        if(date == exc_date) {
          var matches = array_intersect(monthly_availability[date], partial_exceptions[i].timeslots);
          for(var j of matches) {
            monthly_availability[date].splice(monthly_availability[date].indexOf(j), 1);
          }
        }
      }
    }
  }
  //At this point 'monthly_availability' should contain all the dates in current motnh with available timeslots
  //This will be passed on to calendar beforeShowDay event and negated to disable non-matching/empty dates;

  o.tutor.monthly_schedule = monthly_schedule;
  o.tutor.monthly_availability = monthly_availability;
  setTimeout(function() {
    o.tutor.calendar.visualize();
  }, 200);
}

o.tutor.calendar.checkDates = function(date) {
  //Check for unavailable dates before rendering calendar
  // var disableddates = ["2016-08-05", "2014-11-12", "2014-12-25", "2014-05-30"];
  // var string = $.datepicker.formatDate('yy-mm-dd', date);
  // return [disableddates.indexOf(string) == -1];
  for(var key in o.tutor.monthly_availability) {
    if (!o.tutor.monthly_availability.hasOwnProperty(key)) continue;

    if($.datepicker.formatDate('yy-mm-dd', date) == key) {
      var timeslots = o.tutor.monthly_availability[key].length.toString();
      return [true, 'available', timeslots]; //return false disables the date
    }
  }

  return false;
}

o.tutor.calendar.visualize = function() {
  $('.calendar .available').each(function() {
    var num_timeslots = parseInt($(this).attr('title'));
    $(this).removeAttr('title');
    // <span class="bar green" style="width:80%;"></span>
    // <span class="bar yellow" style="width:45%;"></span>
    // <span class="bar red" style="width:20%;"></span>
    if(num_timeslots >= 8) {
      $(this).find('a').append('<span class="bar green"></span>');
    } else if(num_timeslots >= 4) {
      $(this).find('a').append('<span class="bar yellow"></span>');
    } else {
      $(this).find('a').append('<span class="bar red"></span>');
    }
  });

  setTimeout(function() {
    $('.calendar .bar.green').css('width', '100%');
    $('.calendar .bar.yellow').css('width', '50%');
    $('.calendar .bar.red').css('width', '25%');
  }, 200);
}

o.tutor.calendar.next = function($src, $tgt) {
  $('.selected_day').html(moment(o.tutor.calendar.selectedDate).format('dddd'));
  $('.selected_date').html(moment(o.tutor.calendar.selectedDate).format('MMMM Do, YYYY'));
  //populate with timeslots
  $('ul.timeslots').html('');
  for(var timeslot of o.tutor.monthly_availability[o.tutor.calendar.selectedDate]) {
    var timeslot_format = moment(moment(o.tutor.calendar.selectedDate).format('YYYY-MM-DD') + ' ' + timeslot + ':00').format('h:mm a');
    $('ul.timeslots').append('<li data-time="' + timeslot + '">' + timeslot_format + '</li>');
  }

  setTimeout(function() {
    $('ul.timeslots li').each(function(index) {
      $(this).delay(50*index).animate({
        height: 40,
        opacity: 1,
        duration: 50
      });
    });
  }, 200);

  $('select.timeslots').select2({
    placeholder: "Select desired timeslots",
    minimumResultsForSearch: 1000
  });

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

  $.ajax({
      url: "http://thehotspot.ca:10010/session",
      type: "POST"
  }).done(function(data) {
    if(data.error) {
      o.alert(data.error, 'error', 4000);
    } else {
      $('.booking_wrapper').fadeOut('fast', function() {
        $(this).html('');

        //Add new html to div

        $(this).fadeIn('fast');
      });
    }

  }).fail(function(error) {
    o.alert('Oops! Failed to book session. Please try again.', 'error', 4000);
  });
}

o.tutor.loadReviews = function() {
  //TODO: Load tutor reviews and display them on the page

  $('.tutor_reviews .loader').show();

  $.ajax({
      url: "http://thehotspot.ca:10010/tutor/" + p.info.id + "/reviews",
      type: "GET"
  }).done(function(data) {
    //$('.tutor_reviews .loader').fadeOut('fast');
    if(data.error) {
      o.alert(data.error, 'error', 4000);
    } else {
      $('.reviews_wrapper').html(data);
    }

    //built layout
    var html = '';
    for(var item in data) {
      html += '<div class="review_item"> \
                <table> \
                  <tr> \
                    <td><img src="' + item.profile_picture + '" title="' + item.first_name + '" /></td> \
                    <td> \
                      <p class="review_text">' + item.text + '</p> \
                      <input type="hidden" id="review_id" value="' + item.id + '" \
                      <span class="datetime">Posted on ' + item.date + ' \
                    </td> \
                  </tr> \
                </table> \
              </div>';
      //           p.review_text
      //             | Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum
      //           input#review_id(type='hidden', value='2')
      //           span.datetime Posted on: 2015/12/08
    }

    $('.reviews_wrapper').append(html);
  }).fail(function(error) {
    o.alert('Oops! Failed to load reviews. Please try again.', 'error', 4000);

    $('.reviews_wrapper').append('<p class="text-center retry_reviews"><a href="#" class="btn btn-primary">Retry</a></p>');
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

//display error to user
o.alert = function(message, type, duration) {
  $('body').append('<div class="header_alert ' + type + '">' + message + '</div>');
  $('.header_alert').fadeIn('fast').animate({
    top: '60'
  }, 400, function() {
    setTimeout(function() {
      $('.header_alert').animate({
        top: '-100'
      }, 500, function() {
        $(this).hide();
      });
    }, duration);
  });
}


//HELPER FUNCTIONS
function array_intersect(a, b) {
  var ai = bi= 0;
  var result = [];

  while( ai < a.length && bi < b.length ){
     if      (a[ai] < b[bi] ){ ai++; }
     else if (a[ai] > b[bi] ){ bi++; }
     else /* they're equal */
     {
       result.push(a[ai]);
       ai++;
       bi++;
     }
  }

  return result;
}
