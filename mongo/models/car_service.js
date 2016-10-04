/* jshint indent: 2 */
module.exports = function(sequelize, DataTypes) {
    var car_service = sequelize.define('car_service', {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        status: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        priority: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        mileage: {
            type: DataTypes.NUMERIC,
            allowNull: true
        },
        done_at: {
            type: DataTypes.DATE,
            allowNull: true
        },
        created_at: {
            type: DataTypes.DATE,
            allowNull: true
        },
        updated_at: {
            type: DataTypes.DATE,
            allowNull: true
        },
        id_car: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'car',
                key: 'id'
            }
        },
        id_service_type: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'service_type',
                key: 'id'
            }
        },
        id_service_edmunds: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'service_edmunds',
                key: 'id'
            }
        },
        id_service_customized: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'service_customized',
                key: 'id'
            }
        },
        id_recall_recallmasters: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'recall_recallmasters',
                key: 'id'
            }
        },
        id_dtc: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'dtc',
                key: 'id'
            }
        },
        dtc_is_pending: {
            type: DataTypes.BOOLEAN,
            allowNull: true
        },
    }, {
        tableName: 'car_service',
        timestamps: false,
        freezeTableName: true,
        name: {
            singular: 'car_service',
            plural: 'car_service'
        },
        classMethods: {
            associate: function(models) {
                car_service.belongsTo(models.service_type, {
                    foreignKey: 'id_service_type'
                });
                car_service.belongsTo(models.car, {
                    foreignKey: 'id_car'
                });
                car_service.belongsTo(models.service_edmunds, {
                    foreignKey: 'id_service_edmunds'
                });
                car_service.belongsTo(models.service_customized, {
                    foreignKey: 'id_service_customized'
                });
                car_service.belongsTo(models.service_archive, {
                    foreignKey: 'id_service_archive'
                });
                car_service.belongsTo(models.dtc, {
                    foreignKey: 'id_dtc'
                });
                car_service.belongsTo(models.recall_recallmasters, {
                    foreignKey: 'id_recall_recallmasters'
                });
            }
        }
    });

    return car_service;
};
