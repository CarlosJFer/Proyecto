import React, { useMemo } from "react";
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { TreeItem } from '@mui/x-tree-view/TreeItem';
import { Typography, useTheme } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

const renderTree = (node, textColor) => (
  <TreeItem
    key={node._id}
    itemId={node._id}
    label={
      <Typography variant="body2" sx={{ color: textColor }}>
        <b>{node.nombre}</b>
      </Typography>
    }
  >
    {Array.isArray(node.children) && node.children.length > 0
      ? node.children.map((child) => renderTree(child, textColor))
      : null}
  </TreeItem>
);

const OrganigramaTreeView = React.memo(({ tree }) => {
  const theme = useTheme();
  const treeMemo = useMemo(() => tree, [tree]);
  const bgColor = theme.palette.background.paper;
  const textColor = theme.palette.text.primary;
  if (!treeMemo || treeMemo.length === 0) {
    return <Typography color="text.secondary">No hay dependencias para mostrar.</Typography>;
  }
  return (
    <SimpleTreeView
      slots={{
        collapseIcon: ExpandMoreIcon,
        expandIcon: ChevronRightIcon,
      }}
      sx={{ flexGrow: 1, overflowY: 'auto', mt: 2, background: bgColor, borderRadius: 2, p: 2 }}
    >
      {treeMemo.map((node) => renderTree(node, textColor))}
    </SimpleTreeView>
  );
});

export default OrganigramaTreeView; 