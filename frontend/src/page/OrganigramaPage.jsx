import React, { useEffect, useState } from "react";
import OrganigramaTreeView from "../components/OrganigramaTreeView.jsx";
import { Box, Typography, CircularProgress, Alert } from "@mui/material";
import apiClient from "../services/api";

const OrganigramaPage = () => {
  const [tree, setTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTree = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await apiClient.get("/dependencies/tree");
        setTree(data);
      } catch (err) {
        setError("No se pudo cargar el árbol de dependencias");
      } finally {
        setLoading(false);
      }
    };
    fetchTree();
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Organigrama de Dependencias
      </Typography>
      {loading && <CircularProgress />}
      {error && <Alert severity="error">{error}</Alert>}
      {!loading && !error && <OrganigramaTreeView tree={tree} />}
    </Box>
  );
};

export default OrganigramaPage; 