/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  var scanner = sequelize.define('scanner', {
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
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false
    },
    last_data_num: {
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
    id_car: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'car',
        key: 'id'
      }
    }
  }, {
    tableName: 'scanner',
    timestamps: false,
    freezeTableName: true,
    name: {
        singular: 'scanner',
        plural: 'scanner'
    },
    classMethods: {
        associate: function(models) {
            scanner.belongsTo(models.car, {
                foreignKey: 'id_car'
            });
        }
    }
  });

  return scanner;
};
