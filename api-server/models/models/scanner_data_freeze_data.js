/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('scanner_data_freeze_data', {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    scanner_id: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    dtc_code: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    mileage: {
      type: 'NUMERIC',
      allowNull: true
    },
    rtc_time: {
      type: 'NUMERIC',
      allowNull: true
    },
    freeze_data: {
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
    tableName: 'scanner_data_freeze_data',
    timestamps: false,
    freezeTableName: true,
    name: {
        singular: 'scanner_data_freeze_data',
        plural: 'scanner_data_freeze_data'
    }
  });
};
