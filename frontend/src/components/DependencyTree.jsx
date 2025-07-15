import React, { useState } from "react";
import { Box, Typography, IconButton, Collapse, Paper } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

const DependencyNode = ({ node, level = 0 }) => {
  const [open, setOpen] = useState(level < 1); // Primer nivel abierto por defecto
  const hasChildren = node.children && node.children.length > 0;

  return (
    <Box sx={{ ml: level * 2, mb: 1 }}>
      <Box sx={{ display: "flex", alignItems: "center" }}>
        {hasChildren && (
          <IconButton
            size="small"
            onClick={() => setOpen((prev) => !prev)}
            aria-label={open ? "Colapsar" : "Expandir"}
            aria-expanded={open}
            sx={{ mr: 1 }}
          >
            {open ? <ExpandMoreIcon /> : <ChevronRightIcon />}
          </IconButton>
        )}
        <Typography variant="body1" sx={{ fontWeight: level === 0 ? 700 : 400 }}>
          {node.nombre} {node.codigo ? <span style={{ color: '#888', fontSize: 12 }}>({node.codigo})</span> : null}
        </Typography>
      </Box>
      {hasChildren && (
        <Collapse in={open} timeout="auto" unmountOnExit>
          <Box>
            {node.children.map((child) => (
              <DependencyNode key={child._id} node={child} level={level + 1} />
            ))}
          </Box>
        </Collapse>
      )}
    </Box>
  );
};

const DependencyTree = ({ tree }) => {
  if (!tree || tree.length === 0) {
    return <Typography color="text.secondary">No hay dependencias para mostrar.</Typography>;
  }
  return (
    <Paper sx={{ p: 2, mt: 2 }} elevation={2}>
      {tree.map((node) => (
        <DependencyNode key={node._id} node={node} />
      ))}
    </Paper>
  );
};

export default DependencyTree; 