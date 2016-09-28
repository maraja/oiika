//var api = require('../helpers/api.js');

module.exports.loadProfile = function(req, res) {

  req.data = {
    'first_name': 'John',
    'last_name': 'Smith',
    'email': 'john.smith@gmail.com',
    'id': '57ba6b08c03a6dc4f2a06b1c',
    'profile_picture': 'http://thehotspot.ca:3000/images/reza.jpg',
    'full_desc': 'This is my about section',
    'city': 'Montreal',
    'available': ['in_person', 'online'],
    'rating': 4.6,
    'hourly_rate': 21,
    'hours_worked': 52,
    'num_students': 6,
    'num_reviews': 7,
    'skills': ['PHP', 'Node.js', 'JavaScript', 'REST'],
    'subjects': ['Computer Science', 'Calculus', 'Cryptography'],
    'currentLocation': {
      'lat': 43.83432,
      'lng': -79.94034,
      'city': 'Montreal',
      'travel_distance': 5000
    },
    'schedule': {
      '0': ['07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00'],
      '1': ['13:00', '13:30', '14:00','14:30'],
      '2': ['09:00', '09:30'],
      '3': ['12:00'],
      '4': ['09:00', '09:30'],
      '5': ['13:00', '13:30', '14:00','14:30'],
      '6': ['13:00', '13:30']
    },
    'schedule_exceptions': [
      {
        'date': '2016-08-26T04:00:00Z-04:00',
        'all_day': false,
        'timeslots': ['09:00', '09:30', '13:30', '14:00']
      },
      {
        'date': '2016-08-27T04:00:00Z-04:00',
        'all_day': false,
        'timeslots': ['14:00']
      },
      {
        'date': '2016-08-29T04:00:00Z-04:00',
        'all_day': true
      },
      {
        'date': '2016-09-03T04:00:00Z-04:00',
        'all_day': true
      },
      {
        'date': '2016-08-24T04:00:00Z-04:00',
        'all_day': true
      }
    ],
    'sessions': [
      {
        'date': '2016-08-24T00:00:00Z-04:00',
        'timeslots': ['07:00', '07:30']
      },
      {
        'date': '2016-08-25T00:00:00Z-04:00',
        'timeslots': ['13:00']
      },
      {
        'date': '2016-08-27T00:00:00Z-04:00',
        'timeslots': ['12:00']
      },
      {
        'date': '2016-08-28T00:00:00Z-04:00',
        'timeslots': ['13:00']
      }
    ]
  };

  // api.get('tutor/' + req.params.id).then(result => {
  //
  // })
  // .catch(err => {
  //
  // });
}
