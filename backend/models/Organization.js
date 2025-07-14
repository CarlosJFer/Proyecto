const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  description: {
    type: String,
    maxlength: 500
  },
  logo: {
    type: String,
    default: null
  },
  settings: {
    timezone: {
      type: String,
      default: 'America/Argentina/Buenos_Aires'
    },
    dateFormat: {
      type: String,
      default: 'DD/MM/YYYY'
    },
    currency: {
      type: String,
      default: 'ARS'
    },
    language: {
      type: String,
      default: 'es'
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'light'
    },
    features: {
      dashboard: {
        type: Boolean,
        default: true
      },
      analytics: {
        type: Boolean,
        default: true
      },
      exports: {
        type: Boolean,
        default: true
      },
      integrations: {
        type: Boolean,
        default: false
      },
      audit: {
        type: Boolean,
        default: true
      },
      multiUser: {
        type: Boolean,
        default: true
      }
    },
    limits: {
      maxUsers: {
        type: Number,
        default: 50
      },
      maxFileSize: {
        type: Number,
        default: 10485760 // 10MB
      },
      maxStorage: {
        type: Number,
        default: 1073741824 // 1GB
      },
      retentionDays: {
        type: Number,
        default: 365
      }
    }
  },
  contact: {
    email: String,
    phone: String,
    address: {
      street: String,
      city: String,
      state: String,
      postalCode: String,
      country: {
        type: String,
        default: 'Argentina'
      }
    }
  },
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'basic', 'pro', 'enterprise'],
      default: 'free'
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended', 'cancelled'],
      default: 'active'
    },
    startDate: {
      type: Date,
      default: Date.now
    },
    endDate: Date,
    trialEnd: Date
  },
  integrations: {
    googleDrive: {
      enabled: {
        type: Boolean,
        default: false
      },
      clientId: String,
      refreshToken: String
    },
    dropbox: {
      enabled: {
        type: Boolean,
        default: false
      },
      accessToken: String
    },
    oneDrive: {
      enabled: {
        type: Boolean,
        default: false
      },
      clientId: String,
      refreshToken: String
    },
    slack: {
      enabled: {
        type: Boolean,
        default: false
      },
      webhookUrl: String,
      channel: String
    },
    telegram: {
      enabled: {
        type: Boolean,
        default: false
      },
      botToken: String,
      chatId: String
    },
    email: {
      enabled: {
        type: Boolean,
        default: true
      },
      smtpHost: String,
      smtpPort: Number,
      smtpSecure: Boolean,
      smtpUser: String,
      smtpPassword: String
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Índices
organizationSchema.index({ slug: 1 });
organizationSchema.index({ 'subscription.status': 1 });
organizationSchema.index({ isActive: 1 });

// Middleware para generar slug automáticamente
organizationSchema.pre('save', function(next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }
  next();
});

// Método para verificar si una funcionalidad está habilitada
organizationSchema.methods.hasFeature = function(feature) {
  return this.settings?.features?.[feature] === true;
};

// Método para verificar límites
organizationSchema.methods.withinLimit = function(limitType, currentValue) {
  const limit = this.settings?.limits?.[limitType];
  return limit ? currentValue < limit : true;
};

// Método para obtener estadísticas de uso
organizationSchema.methods.getUsageStats = async function() {
  try {
    const User = mongoose.model('User');
    const AuditLog = mongoose.model('AuditLog');
    const AnalysisData = mongoose.model('AnalysisData');

    const [userCount, logCount, dataCount] = await Promise.all([
      User.countDocuments({ organizationId: this._id, isActive: true }),
      AuditLog.countDocuments({ organizationId: this._id }),
      AnalysisData.countDocuments({ organizationId: this._id })
    ]);

    return {
      users: userCount,
      logs: logCount,
      datasets: dataCount,
      limits: this.settings.limits
    };
  } catch (error) {
    console.error('Error obteniendo estadísticas de uso:', error);
    throw error;
  }
};

const Organization = mongoose.model('Organization', organizationSchema);

module.exports = Organization;