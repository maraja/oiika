/* jshint indent: 4 */
module.exports = function(sequelize, DataTypes) {
    var car_edmunds = sequelize.define('car_edmunds', {
        id_car: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'car',
                key: 'id'
            }
        },
        vehicle_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            allowNull: false
        },
        created_at: {
            type: DataTypes.DATE,
            allowNull: true
        },
        updated_at: {
            type: DataTypes.DATE,
            allowNull: true
        },

    }, {
        tableName: 'car_edmunds',
        timestamps: false,
        freezeTableName: true,
        name: {
            singular: 'car_edmunds',
            plural: 'car_edmunds'
        },
        classMethods: {
            associate: function(models) {
                car_edmunds.belongsTo(models.car, {
                    foreignKey: 'id_car'
                });
            }
        }
    });

    return car_edmunds;
};
