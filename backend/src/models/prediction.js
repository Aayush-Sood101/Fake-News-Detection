export default (sequelize, DataTypes) => {
  const Prediction = sequelize.define("Prediction", {
    title: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    body: DataTypes.TEXT,
    imageUrl: DataTypes.TEXT,
    label: {
      type: DataTypes.STRING,
      allowNull: false
    },
    confidence: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    explanation: DataTypes.TEXT,
    userId: {
      type: DataTypes.UUID,
      allowNull: false
    }
  });

  Prediction.associate = (models) => {
    Prediction.belongsTo(models.User, { foreignKey: "userId" });
  };

  return Prediction;
};