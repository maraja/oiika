var map;
function initMap() {
	map = new google.maps.Map(document.getElementById('map'), {
		center: {lat: -34.397, lng: 150.644},
		zoom: 8
	});
}

$(document).ready(function() {
	function init_autocomplete() {

		//var country = $('#c').val();

		var options = {
			types: ['(cities)'],
			componentRestrictions: {country: 'CA'}
		};

		var input = document.getElementById('search_location');
		var autocomplete = new google.maps.places.Autocomplete(input, options);
	}

	google.maps.event.addDomListener(window, 'load', init_autocomplete);
});