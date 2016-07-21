/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  var user = sequelize.define('user', {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    facebookId: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    first_name: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    last_name: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    activated: {
      type: DataTypes.BOOLEAN,
      allowNull: false
    },
    auth_data: {
      type: DataTypes.JSON,
      allowNull: true
    },
    role: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    username: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    password: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    phone_number: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    email: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    migration_state: {
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
    tableName: 'user',
    timestamps: false,
    freezeTableName: true,
    name: {
        singular: 'user',
        plural: 'user'
    },
    classMethods: {
        associate: function(models) {
            user.hasMany(models.car, {
                foreignKey: 'id_user'
            });
        }
    }
  });

  return user;
};
