/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  var user_installation = sequelize.define('user_installation', {
    id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      primaryKey: true,
      autoIncrement: true
    },
    id_user: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    installation_id: {
      type: DataTypes.STRING,
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'user_installation',
    timestamps: false,
    freezeTableName: true,
    name: {
      singular: 'user_installation',
      plural: 'user_installation'
    },
    classMethods: {
      associate: function(models) {
        user_installation.belongsTo(models.user, {
          foreignKey: 'id_user'
        });
      }
    }
  });

  return user_installation;
};