var api = require('../helpers/api.js');

module.exports.loadProfile = function(req, res, next) {
  req.data = {
    'info': {
      'first_name': 'Reza',
      'last_name': 'Karami',
      'id': '1'
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
    'exceptions': [
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

  return next();
  // api.get('tutor/' + req.params.id).then(result => {
  //
  // })
  // .catch(err => {
  //
  // });
}
