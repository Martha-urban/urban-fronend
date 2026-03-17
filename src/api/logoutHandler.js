const navigate = useNavigate();

const handleLogout = async () => {
  try {
    await api.post("/api/v1/auth/logout");
  } catch (e) {
    console.log("Logout request failed, continuing anyway");
  }

  localStorage.removeItem("urban_access_token");
  localStorage.removeItem("urban_refresh_token");

  navigate("/login");
};