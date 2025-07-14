import React from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Skeleton,
  Grid,
  Typography,
  LinearProgress,
} from '@mui/material';
import { motion } from 'framer-motion';

const LoadingFallback = ({ type = 'dashboard', message = 'Cargando...' }) => {
  const SkeletonCard = ({ height = 200 }) => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card>
        <CardHeader
          title={<Skeleton variant="text" width="60%" />}
          action={<Skeleton variant="circular" width={24} height={24} />}
        />
        <CardContent>
          <Skeleton variant="rectangular" width="100%" height={height} />
        </CardContent>
      </Card>
    </motion.div>
  );

  const renderDashboardSkeleton = () => (
    <Box sx={{ p: 3 }}>
      {/* Header skeleton */}
      <Box sx={{ mb: 3 }}>
        <Skeleton variant="text" width="40%" height={40} />
        <Skeleton variant="text" width="60%" height={20} />
      </Box>

      {/* Filters skeleton */}
      <Card sx={{ mb: 3 }}>
        <CardHeader
          title={<Skeleton variant="text" width="30%" />}
          action={<Skeleton variant="circular" width={40} height={40} />}
        />
      </Card>

      {/* Stats cards skeleton */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[1, 2, 3, 4].map((i) => (
          <Grid item xs={6} md={3} key={i}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Skeleton variant="circular" width={40} height={40} sx={{ mx: 'auto', mb: 1 }} />
                <Skeleton variant="text" width="80%" />
                <Skeleton variant="text" width="60%" />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Charts skeleton */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <SkeletonCard height={300} />
        </Grid>
        <Grid item xs={12} md={6}>
          <SkeletonCard height={300} />
        </Grid>
        <Grid item xs={12}>
          <SkeletonCard height={200} />
        </Grid>
      </Grid>
    </Box>
  );

  const renderTableSkeleton = () => (
    <Box sx={{ p: 3 }}>
      <Card>
        <CardHeader
          title={<Skeleton variant="text" width="30%" />}
          action={<Skeleton variant="rectangular" width={100} height={36} />}
        />
        <CardContent>
          {[1, 2, 3, 4, 5].map((i) => (
            <Box key={i} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
              <Box sx={{ flexGrow: 1 }}>
                <Skeleton variant="text" width="80%" />
                <Skeleton variant="text" width="60%" />
              </Box>
              <Skeleton variant="rectangular" width={80} height={32} />
            </Box>
          ))}
        </CardContent>
      </Card>
    </Box>
  );

  const renderFormSkeleton = () => (
    <Box sx={{ p: 3 }}>
      <Card>
        <CardHeader title={<Skeleton variant="text" width="40%" />} />
        <CardContent>
          <Grid container spacing={3}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Grid item xs={12} md={6} key={i}>
                <Skeleton variant="text" width="30%" height={20} />
                <Skeleton variant="rectangular" width="100%" height={56} />
              </Grid>
            ))}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Skeleton variant="rectangular" width={100} height={36} />
                <Skeleton variant="rectangular" width={100} height={36} />
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );

  const renderContent = () => {
    switch (type) {
      case 'table':
        return renderTableSkeleton();
      case 'form':
        return renderFormSkeleton();
      case 'dashboard':
      default:
        return renderDashboardSkeleton();
    }
  };

  return (
    <Box sx={{ width: '100%', minHeight: '60vh' }}>
      {/* Progress bar */}
      <Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999 }}>
        <LinearProgress />
      </Box>

      {/* Loading message */}
      <Box sx={{ textAlign: 'center', py: 2 }}>
        <Typography variant="h6" color="text.secondary">
          {message}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Por favor espera mientras cargamos la información...
        </Typography>
      </Box>

      {/* Content skeleton */}
      {renderContent()}
    </Box>
  );
};

export default LoadingFallback;