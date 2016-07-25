//Initialization
$(document).ready(function() {
  var page = window.location.pathname;

  oiika.init();

  switch(page) {
    case "/":
      oiika.index.init();
      break;
    case "/search":
      oiika.search.init();
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

oiika.users = {};
oiika.reviews = {};
oiika.booking = {};
