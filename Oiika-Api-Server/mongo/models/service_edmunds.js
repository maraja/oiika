/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  var service_edmunds = sequelize.define('service_edmunds', {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    vehicle_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    id_service_edmunds_approved: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'service_edmunds_approved',
        key: 'id'
      }
    },
    priority: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    interval_mileage: {
      type: DataTypes.NUMERIC,
      allowNull: true
    },
    interval_month: {
      type: DataTypes.NUMERIC,
      allowNull: true
    },
    fixed_mileage: {
      type: DataTypes.NUMERIC,
      allowNull: true
    },
    fixed_month: {
      type: DataTypes.NUMERIC,
      allowNull: true
    },
    engine_code: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    edmunds_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    item: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    action: {
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
    }
  }, {
    tableName: 'service_edmunds',
    timestamps: false,
    freezeTableName: true,
    name: {
        singular: 'service_edmunds',
        plural: 'service_edmunds'
    },
    classMethods: {
        associate: function(models) {
            service_edmunds.hasMany(models.car_service, {
                foreignKey: 'id_service_edmunds'
            })
            service_edmunds.belongsTo(models.service_edmunds_approved, {
                foreignKey: 'id_service_edmunds_approved'
            })
        }
    }
  });

  return service_edmunds;
};
