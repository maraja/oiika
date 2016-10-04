/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  var recall_recallmasters = sequelize.define('recall_recallmasters', {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    nhtsa_id: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    oem_id: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    type: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    name: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    risk: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    remedy: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    remedy_available: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    },
    parts_available: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    labor_difficulty: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    labor_max: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    profit_rank: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    overall_rank: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    reimbursement: {
      type: 'NUMERIC',
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
    tableName: 'recall_recallmasters',
    timestamps: false,
    freezeTableName: true,
    name: {
        singular: 'recall_recallmasters',
        plural: 'recall_recallmasters'
    },
    classMethods: {
        associate: function(models) {
            recall_recallmasters.hasMany(models.car_service, {
                foreignKey: 'id_recall_recallmasters'
            })
        }
    }
  });

  return recall_recallmasters;
};
