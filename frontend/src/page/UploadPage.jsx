import React from 'react';
import { Box, Typography } from '@mui/material';
import UploadSection from '../components/UploadSection.jsx';

const UploadPage = () => {
  return (
    <Box maxWidth={700} mx="auto" p={3}>
      <Typography variant="h4" gutterBottom align="center">
        Carga de Archivos Excel
      </Typography>
      <UploadSection />
    </Box>
  );
};

export default UploadPage; 