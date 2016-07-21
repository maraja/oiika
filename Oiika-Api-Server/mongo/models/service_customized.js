/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  var service_customized = sequelize.define('service_customized', {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    priority: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    interval_mileage: {
      type: 'NUMERIC',
      allowNull: true
    },
    interval_month: {
      type: 'NUMERIC',
      allowNull: true
    },
    fixed_month: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    action: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    item: {
      type: DataTypes.TEXT,
      allowNull: true
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
    },
    id_shop: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'shop',
        key: 'id'
      }
    }
  }, {
    tableName: 'service_customized',
    timestamps: false,
    freezeTableName: true,
    name: {
        singular: 'service_customized',
        plural: 'service_customized'
    },
    classMethods: {
        associate: function(models) {
            service_customized.hasMany(models.car_service, {
                foreignKey: 'id_service_customized'
            });
            service_customized.belongsTo(models.shop, {
                foreignKey: 'id_shop'
            });
        }
    }
  });

  return service_customized;
};
