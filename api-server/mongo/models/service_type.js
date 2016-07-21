/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
    var service_type = sequelize.define('service_type', {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    type: {
      type: DataTypes.TEXT,
      allowNull: false
    }
  }, {
    tableName: 'service_type',
    timestamps: false,
    freezeTableName: true,
    name: {
        singular: 'service_type',
        plural: 'service_type'
    },
    classMethods: {
        associate: function(models) {
            service_type.hasMany(models.service_type, {
                foreignKey: 'id_service_type'
            });
        }
    }
});

  return service_type;
};
