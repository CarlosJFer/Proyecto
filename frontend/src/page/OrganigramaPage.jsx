import React, { useEffect, useState, useMemo } from "react";
import OrganigramaTreeView from "../components/OrganigramaTreeView.jsx";
import { Box, Typography, CircularProgress, Alert, TextField, Button } from "@mui/material";
import apiClient from "../services/api";

// Construye un mapa de nodos por _id y asigna hijos correctamente
const buildTreeFromFlatList = (list) => {
  const map = {};
  const roots = [];
  list.forEach(item => {
    map[item._id] = { ...item, children: [] };
  });
  list.forEach(item => {
    if (item.idPadre && map[item.idPadre]) {
      map[item.idPadre].children.push(map[item._id]);
    } else {
      roots.push(map[item._id]);
    }
  });
  // Ordenar hijos por 'orden' si existe
  const sortChildren = (nodes) => {
    nodes.sort((a, b) => (a.orden || 999) - (b.orden || 999));
    nodes.forEach(n => n.children && sortChildren(n.children));
  };
  sortChildren(roots);
  return roots;
};

// Obtiene todos los ancestros de un nodo
const getAncestors = (list, node) => {
  const ancestors = [];
  let current = node;
  while (current && current.idPadre) {
    const parent = list.find(dep => String(dep._id) === String(current.idPadre));
    if (parent) {
      ancestors.push(parent);
      current = parent;
    } else {
      break;
    }
  }
  return ancestors;
};

const OrganigramaPage = () => {
  const [tree, setTree] = useState([]);
  const [flatList, setFlatList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [flatRes] = await Promise.all([
          apiClient.get("/dependencies/flat")
        ]);
        setFlatList(flatRes.data);
        setTree(buildTreeFromFlatList(flatRes.data));
      } catch (err) {
        setError("No se pudo cargar el árbol de dependencias");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Búsqueda y reconstrucción del árbol filtrado
  const filteredTree = useMemo(() => {
    if (!search || search.length < 2) return tree;
    const term = search.toLowerCase();
    // Filtrar dependencias que coincidan
    const found = flatList.filter(dep => dep.nombre.toLowerCase().includes(term));
    if (found.length === 0) return [];
    // Obtener todos los IDs requeridos (resultados + ancestros)
    const requiredIds = new Set();
    found.forEach(item => {
      requiredIds.add(String(item._id));
      getAncestors(flatList, item).forEach(anc => requiredIds.add(String(anc._id)));
    });
    // Filtrar la lista para solo los nodos requeridos
    const filteredList = flatList.filter(dep => requiredIds.has(String(dep._id)));
    return buildTreeFromFlatList(filteredList);
  }, [search, flatList, tree]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Organigrama de Dependencias
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <TextField
          label="Buscar dependencia"
          value={search}
          onChange={e => setSearch(e.target.value)}
          size="small"
          variant="outlined"
        />
        <Button onClick={() => setSearch("")} variant="outlined" disabled={!search}>
          Limpiar
        </Button>
      </Box>
      {loading && <CircularProgress />}
      {error && <Alert severity="error">{error}</Alert>}
      {!loading && !error && (
        filteredTree.length === 0 && search ? (
          <Alert severity="info">No se encontraron resultados para "{search}".</Alert>
        ) : (
          <OrganigramaTreeView tree={filteredTree} />
        )
      )}
    </Box>
  );
};

export default OrganigramaPage; 