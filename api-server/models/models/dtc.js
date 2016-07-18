/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  var dtc = sequelize.define('dtc', {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    dtc_code: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
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
    tableName: 'dtc',
    timestamps: false,
    freezeTableName: true,
    name: {
        singular: 'dtc',
        plural: 'dtc'
    },
    classMethods: {
        associate: function(models) {
            dtc.hasMany(models.car_service, {
                foreignKey: 'id_dtc'
            });
        }
    }
  });

  return dtc;
};
