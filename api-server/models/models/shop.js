/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  var shop = sequelize.define('shop', {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    phone_number: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    email: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    latitude: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    longitude: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    activated: {
      type: DataTypes.BOOLEAN,
      allowNull: false
    },
    activated_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    renew_at: {
      type: DataTypes.DATE,
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
    tableName: 'shop',
    timestamps: false,
    freezeTableName: true,
    name: {
        singular: 'shop',
        plural: 'shop'
    },
    classMethods: {
        associate: function(models) {
            shop.hasMany(models.car_shop, {
                foreignKey: 'id_shop'
            });
            shop.hasMany(models.service_customized, {
                foreignKey: 'id_shop'
            });
        }
    }
  });

  return shop;
};
