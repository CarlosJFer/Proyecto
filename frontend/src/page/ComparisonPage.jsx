import React from "react";
import { Box, Typography, Paper, Grid } from "@mui/material";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const data = {
  labels: ["Secretaría A", "Secretaría B", "Secretaría C"],
  datasets: [
    {
      label: "Dotación",
      data: [120, 90, 150],
      backgroundColor: ["#1976d2", "#388e3c", "#fbc02d"],
    },
    {
      label: "Vacantes",
      data: [10, 5, 8],
      backgroundColor: ["#90caf9", "#a5d6a7", "#fff59d"],
    },
  ],
};

const options = {
  responsive: true,
  plugins: {
    legend: {
      position: "top",
    },
    title: {
      display: true,
      text: "Comparación entre Secretarías",
    },
  },
};

const ComparisonPage = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Comparación entre Secretarías
      </Typography>
      <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
        <Typography variant="body1" gutterBottom>
          Visualiza y compara la dotación y vacantes entre diferentes secretarías. Puedes personalizar los filtros y los datos mostrados.
        </Typography>
      </Paper>
      <Grid container spacing={2}>
        <Grid item xs={12} md={8}>
          <Bar data={data} options={options} />
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <Typography variant="h6">Filtros avanzados</Typography>
            {/* Aquí puedes agregar filtros por secretaría, rango de fechas, etc. */}
            <Typography variant="body2" color="text.secondary">
              (Próximamente: filtros interactivos)
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ComparisonPage; 