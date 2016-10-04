/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  var car = sequelize.define('car', {
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
    meta: {
      type: DataTypes.JSON,
      allowNull: true
    },
    mileage_base: {
      type: DataTypes.NUMERIC,
      allowNull: false
    },
    mileage_service: {
      type: DataTypes.NUMERIC,
      allowNull: false
    },
    mileage_total: {
      type: DataTypes.NUMERIC,
      allowNull: false
    },
    mileage_city: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    mileage_highway: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    car_year: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    car_make: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    car_model: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    car_trim: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    car_engine: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    car_tank: {
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
    },
    id_user: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'user',
        key: 'id'
      }
    }
  }, {
    tableName: 'car',
    timestamps: false,
    freezeTableName: true,
    name: {
        singular: 'car',
        plural: 'car'
    },
    classMethods: {
        associate: function(models) {
            car.belongsTo(models.user, {
                foreignKey: 'id_user'
            });
            car.hasMany(models.car_service, {
                foreignKey: 'id_car',
                as: 'issues'
            });
            car.hasMany(models.car_edmunds, {
                foreignKey: 'id_car'
            });
            car.hasOne(models.car_shop, {
                foreignKey: 'id_car'
            });
            car.hasMany(models.scanner, {
                foreignKey: 'id_car'
            });
        }
    }
  });

  return car;
};
