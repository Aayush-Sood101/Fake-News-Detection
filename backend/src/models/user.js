// models/user.js
export default (sequelize, DataTypes) => {
  const User = sequelize.define("User", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    name: DataTypes.STRING,
    role: {
      type: DataTypes.STRING,
      defaultValue: "user",
    },
  });

  User.associate = (models) => {
    if (models.Prediction) {  // 👈 guard: only associate if model exists
      User.hasMany(models.Prediction, { foreignKey: "userId" });
    }
  };

  return User;
};