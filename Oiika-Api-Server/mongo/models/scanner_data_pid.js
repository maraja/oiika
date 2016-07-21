/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('scanner_data_pid', {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    vin: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    trip_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    mileage: {
      type: DataTypes.NUMERIC,
      allowNull: true
    },
    mileage_trip: {
      type: DataTypes.NUMERIC,
      allowNull: true
    },
    mileage_calculated: {
      type: DataTypes.NUMERIC,
      allowNull: true
    },
    rtc_time: {
      type: 'NUMERIC',
      allowNull: true
    },
    data: {
      type: DataTypes.JSON,
      allowNull: false
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
    tableName: 'scanner_data_pid',
    timestamps: false,
    freezeTableName: true,
    name: {
        singular: 'scanner_data_pid',
        plural: 'scanner_data_pid'
    },
  });
};
