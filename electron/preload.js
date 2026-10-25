const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // Auth
  login: (email, password) => ipcRenderer.invoke('auth:login', { email, password }),
  logout: () => ipcRenderer.invoke('auth:logout'),
  getCurrentUser: () => ipcRenderer.invoke('auth:getCurrentUser'),
  switchUser: (userId) => ipcRenderer.invoke('auth:switchUser', { userId }),
  getDemoAccounts: () => ipcRenderer.invoke('auth:getDemoAccounts'),

  // Dissertations
  getDissertations: (filters) => ipcRenderer.invoke('dissertation:getAll', { filters }),
  getDissertationById: (id) => ipcRenderer.invoke('dissertation:getById', { id }),
  createDissertation: (data) => ipcRenderer.invoke('dissertation:create', { data }),
  updateDissertation: (id, data) => ipcRenderer.invoke('dissertation:update', { id, data }),
  transitionStatus: (id, newStatus, comments) => ipcRenderer.invoke('dissertation:transition', { id, newStatus, comments }),
  assignGuide: (dissertationId, guideId) => ipcRenderer.invoke('dissertation:assignGuide', { dissertationId, guideId }),
  checkDuplicate: (data) => ipcRenderer.invoke('dissertation:checkDuplicate', { data }),
  checkGuideCapacity: (guideId) => ipcRenderer.invoke('dissertation:checkGuideCapacity', { guideId }),

  // Ethics
  getEthicsClearance: (dissertationId) => ipcRenderer.invoke('ethics:get', { dissertationId }),
  getAllEthicsClearances: (filters) => ipcRenderer.invoke('ethics:getAll', { filters }),
  submitEthicsClearance: (data) => ipcRenderer.invoke('ethics:submit', { data }),
  reviewEthicsClearance: (data) => ipcRenderer.invoke('ethics:review', { data }),

  // Progress Monitoring
  getMilestones: (dissertationId) => ipcRenderer.invoke('progress:getMilestones', { dissertationId }),
  updateMilestone: (id, data) => ipcRenderer.invoke('progress:updateMilestone', { id, data }),
  submitProgressReport: (data) => ipcRenderer.invoke('progress:submitReport', { data }),
  reviewProgressReport: (data) => ipcRenderer.invoke('progress:reviewReport', { data }),
  getOverdueDissertations: () => ipcRenderer.invoke('progress:getOverdue'),

  // Evaluation
  getEvaluation: (dissertationId) => ipcRenderer.invoke('evaluation:get', { dissertationId }),
  submitFinalDissertation: (data) => ipcRenderer.invoke('evaluation:submitThesis', { data }),
  saveEvaluation: (data) => ipcRenderer.invoke('evaluation:save', { data }),

  // Publications
  getPublications: (filters) => ipcRenderer.invoke('publication:getAll', { filters }),
  addPublication: (data) => ipcRenderer.invoke('publication:add', { data }),
  deletePublication: (id) => ipcRenderer.invoke('publication:delete', { id }),

  // Analytics & Dashboard
  getDashboardAnalytics: () => ipcRenderer.invoke('analytics:getDashboard'),

  // Notifications
  getNotifications: () => ipcRenderer.invoke('notification:getAll'),
  getUnreadNotificationsCount: () => ipcRenderer.invoke('notification:getUnreadCount'),
  markNotificationAsRead: (id) => ipcRenderer.invoke('notification:markRead', { id }),
  markAllNotificationsAsRead: () => ipcRenderer.invoke('notification:markAllRead'),

  // Audit Logs
  getAuditLogs: (filters) => ipcRenderer.invoke('audit:getLogs', { filters }),

  // System & Settings
  getSettings: () => ipcRenderer.invoke('settings:get'),
  updateSetting: (key, value) => ipcRenderer.invoke('settings:update', { key, value }),
  getSystemMetadata: () => ipcRenderer.invoke('system:getMetadata'),
  selectSaveFile: (defaultName) => ipcRenderer.invoke('dialog:selectSaveFile', { defaultName }),
  selectOpenFile: () => ipcRenderer.invoke('dialog:selectOpenFile'),
  exportDatabase: (targetPath) => ipcRenderer.invoke('system:exportDb', { targetPath }),
  importDatabase: (sourcePath) => ipcRenderer.invoke('system:importDb', { sourcePath }),

  // Files
  uploadFile: (buffer, fileName, docType, dissertationId) => ipcRenderer.invoke('file:upload', { buffer, fileName, docType, dissertationId }),
  openFile: (filePath) => ipcRenderer.invoke('file:open', { filePath }),
  readFileBase64: (filePath) => ipcRenderer.invoke('file:readBase64', { filePath }),
});
