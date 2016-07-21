/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  var installation = sequelize.define('installation', {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    GCMSenderId: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    device_token: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    localeIdentifier: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    badge: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    parseVersion: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'user',
        key: 'id'
      }
    },
    appIdentifier: {
      type: DataTypes.STRING,
      allowNull: true
    },
    appName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    device_type: {
      type: DataTypes.STRING,
      allowNull: false
    },
    channels: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    push_type: {
      type: DataTypes.STRING,
      allowNull: false
    },
    installation_id: {
      type: DataTypes.STRING,
      allowNull: false
    },
    app_version: {
      type: DataTypes.STRING,
      allowNull: false
    },
    timeZone: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'installation',
    timestamps: false,
    freezeTableName: true,
    name: {
        singular: 'installation',
        plural: 'installation'
    },
    classMethods: {}
  });

  return installation;
};