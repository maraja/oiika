/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  var service_edmunds_approved = sequelize.define('service_edmunds_approved', {
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
    item: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    action: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    mileage: {
        type: DataTypes.NUMERIC,
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
    tableName: 'service_edmunds_approved',
    timestamps: false,
    freezeTableName: true,
    name: {
        singular: 'service_edmunds_approved',
        plural: 'service_edmunds_approved'
    },
    classMethods: {
        associate: function(models) {
            service_edmunds_approved.hasMany(models.service_edmunds, {
                foreignKey: 'id_service_edmunds_approved'
            })
        }
    }
  });

  return service_edmunds_approved;
};
