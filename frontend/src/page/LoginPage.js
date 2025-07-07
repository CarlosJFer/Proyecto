import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:5000/api/auth/login", {
        username,
        password,
      });
      const { token, role } = res.data;
      localStorage.setItem("token", token);
      localStorage.setItem("role", role);
      if (role === "admin") {
        navigate("/admin");
      } else {
        navigate("/dashboard/hacienda"); // o secretaría por defecto
      }
    } catch (err) {
      alert("Login inválido");
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <input placeholder="Usuario" onChange={(e) => setUsername(e.target.value)} />
      <input placeholder="Contraseña" type="password" onChange={(e) => setPassword(e.target.value)} />
      <button type="submit">Iniciar Sesión</button>
    </form>
  );
}

export default LoginPage;
