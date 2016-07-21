/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  var token_store = sequelize.define('token_store', {
    id_user: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      references: {
        model: 'user',
        key: 'id'
      }
    },
    is_valid: {
        type: DataTypes.BOOLEAN,
        allowNull: false
    },
    token: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    type: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    issuer: {
      type: DataTypes.TEXT,
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
    tableName: 'token_store',
    timestamps: false,
    freezeTableName: true,
    name: {
        singular: 'token_store',
        plural: 'token_store'
    },
    classMethods: {
        associate: function(models) {
            token_store.belongsTo(models.car, {
                foreignKey: 'id_car'
            });
        }
    }
  });

  return token_store;
};
