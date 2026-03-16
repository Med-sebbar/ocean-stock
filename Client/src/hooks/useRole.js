// src/hooks/useRole.js
export const useRole = () => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  return {
    isAdmin: user.role === "admin",
    isEmployee: user.role === "employee",
    user,
  };
};