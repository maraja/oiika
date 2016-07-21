/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  var settings = sequelize.define('settings', {
    id_user: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      references: {
        model: 'user',
        key: 'id'
      }
    },
    settings: {
      type: DataTypes.JSON,
      allowNull: false
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
    tableName: 'user_settings',
    timestamps: false,
    freezeTableName: true,
    name: {
        singular: 'settings',
        plural: 'settings'
    },
    classMethods: {
        associate: function(models) {
            settings.belongsTo(models.user, {
                foreignKey: 'id_user'
            });
        }
    }
  });

  return settings;
};
