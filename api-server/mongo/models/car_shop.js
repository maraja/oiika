/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  var car_shop = sequelize.define('car_shop', {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    id_shop: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'shop',
        key: 'id'
      }
    },
    id_car: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'car',
        key: 'id'
      }
    }
  }, {
    tableName: 'car_shop',
    timestamps: false,
    freezeTableName: true,
    name: {
        singular: 'car_shop',
        plural: 'car_shop'
    },
    classMethods: {
        associate: function(models) {
            car_shop.belongsTo(models.car, {
                foreignKey: 'id_car'
            });
            car_shop.belongsTo(models.shop, {
                foreignKey: 'id_shop'
            });
        }
    }
  });

  return car_shop;
};
