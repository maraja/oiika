/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  var service_archive = sequelize.define('service_archive', {
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
    content: {
      type: DataTypes.JSONB,
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
    tableName: 'service_archive',
    timestamps: false,
    freezeTableName: true,
    name: {
        singular: 'service_archive',
        plural: 'service_archive'
    },
    classMethods: {
        associate: function(models) {
            service_archive.hasMany(models.car_service, {
                foreignKey: 'id_service_archive'
            });
        }
    }
  });

  return service_archive;
};
