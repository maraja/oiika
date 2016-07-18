/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('migration', {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    script: {
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
    tableName: 'migration',
    timestamps: false,
    freezeTableName: true,
    name: {
        singular: 'migration',
        plural: 'migration'
    },
  });
};
