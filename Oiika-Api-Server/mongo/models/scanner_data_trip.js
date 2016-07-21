/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('scanner_data_trip', {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    trip_id_raw: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    vin: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    mileage_start: {
      type: DataTypes.NUMERIC,
      allowNull: true
    },
    mileage: {
      type: DataTypes.NUMERIC,
      allowNull: true
    },
    mileage_updated: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    },
    rtc_time_start: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    rtc_time_end: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'scanner_data_trip',
    timestamps: false,
    freezeTableName: true,
    name: {
        singular: 'scanner_data_trip',
        plural: 'scanner_data_trip'
    },
  });
};
