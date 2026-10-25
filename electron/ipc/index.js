const { ipcMain, dialog } = require('electron');
const authService = require('../services/authService');
const dissertationService = require('../services/dissertationService');
const ethicsService = require('../services/ethicsService');
const progressService = require('../services/progressService');
const evaluationService = require('../services/evaluationService');
const publicationService = require('../services/publicationService');
const analyticsService = require('../services/analyticsService');
const notificationService = require('../services/notificationService');
const auditService = require('../services/auditService');
const fileService = require('../services/fileService');
const backupService = require('../services/backupService');

function registerIpcHandlers() {
  // --- Auth Handlers ---
  ipcMain.handle('auth:login', async (_, { email, password }) => {
    return authService.login(email, password);
  });

  ipcMain.handle('auth:logout', async () => {
    return authService.logout();
  });

  ipcMain.handle('auth:getCurrentUser', async () => {
    return authService.getCurrentUser();
  });

  ipcMain.handle('auth:switchUser', async (_, { userId }) => {
    return authService.switchUser(userId);
  });

  ipcMain.handle('auth:getDemoAccounts', async () => {
    return authService.getDemoAccounts();
  });

  // --- Dissertation Handlers ---
  ipcMain.handle('dissertation:getAll', async (_, { filters }) => {
    const user = authService.getCurrentUser();
    return dissertationService.getDissertations(filters, user);
  });

  ipcMain.handle('dissertation:getById', async (_, { id }) => {
    return dissertationService.getDissertationById(id);
  });

  ipcMain.handle('dissertation:create', async (_, { data }) => {
    const user = authService.getCurrentUser();
    return dissertationService.createDissertation(data, user);
  });

  ipcMain.handle('dissertation:update', async (_, { id, data }) => {
    const user = authService.getCurrentUser();
    return dissertationService.updateDissertation(id, data, user);
  });

  ipcMain.handle('dissertation:transition', async (_, { id, newStatus, comments }) => {
    const user = authService.getCurrentUser();
    return dissertationService.transitionStatus(id, newStatus, comments, user);
  });

  ipcMain.handle('dissertation:assignGuide', async (_, { dissertationId, guideId }) => {
    const user = authService.getCurrentUser();
    return dissertationService.assignGuide(dissertationId, guideId, user);
  });

  ipcMain.handle('dissertation:checkDuplicate', async (_, { data }) => {
    return dissertationService.checkDuplicate(data);
  });

  ipcMain.handle('dissertation:checkGuideCapacity', async (_, { guideId }) => {
    return dissertationService.checkGuideCapacity(guideId);
  });

  // --- Ethics Handlers ---
  ipcMain.handle('ethics:get', async (_, { dissertationId }) => {
    return ethicsService.getEthicsClearance(dissertationId);
  });

  ipcMain.handle('ethics:getAll', async (_, { filters }) => {
    return ethicsService.getAllEthicsClearances(filters);
  });

  ipcMain.handle('ethics:submit', async (_, { data }) => {
    const user = authService.getCurrentUser();
    return ethicsService.submitEthicsClearance(data, user);
  });

  ipcMain.handle('ethics:review', async (_, { data }) => {
    const user = authService.getCurrentUser();
    return ethicsService.reviewEthicsClearance(data, user);
  });

  // --- Progress Handlers ---
  ipcMain.handle('progress:getMilestones', async (_, { dissertationId }) => {
    return progressService.getMilestones(dissertationId);
  });

  ipcMain.handle('progress:updateMilestone', async (_, { id, data }) => {
    const user = authService.getCurrentUser();
    return progressService.updateMilestone(id, data, user);
  });

  ipcMain.handle('progress:submitReport', async (_, { data }) => {
    const user = authService.getCurrentUser();
    return progressService.submitProgressReport(data, user);
  });

  ipcMain.handle('progress:reviewReport', async (_, { data }) => {
    const user = authService.getCurrentUser();
    return progressService.reviewProgressReport(data, user);
  });

  ipcMain.handle('progress:getOverdue', async () => {
    return progressService.getOverdueDissertations();
  });

  // --- Evaluation Handlers ---
  ipcMain.handle('evaluation:get', async (_, { dissertationId }) => {
    return evaluationService.getEvaluation(dissertationId);
  });

  ipcMain.handle('evaluation:submitThesis', async (_, { data }) => {
    const user = authService.getCurrentUser();
    return evaluationService.submitFinalDissertation(data, user);
  });

  ipcMain.handle('evaluation:save', async (_, { data }) => {
    const user = authService.getCurrentUser();
    return evaluationService.saveEvaluation(data, user);
  });

  // --- Publication Handlers ---
  ipcMain.handle('publication:getAll', async (_, { filters }) => {
    return publicationService.getPublications(filters);
  });

  ipcMain.handle('publication:add', async (_, { data }) => {
    const user = authService.getCurrentUser();
    return publicationService.addPublication(data, user);
  });

  ipcMain.handle('publication:delete', async (_, { id }) => {
    const user = authService.getCurrentUser();
    return publicationService.deletePublication(id, user);
  });

  // --- Analytics Handlers ---
  ipcMain.handle('analytics:getDashboard', async () => {
    const user = authService.getCurrentUser();
    return analyticsService.getDashboardAnalytics(user);
  });

  // --- Notification Handlers ---
  ipcMain.handle('notification:getAll', async () => {
    const user = authService.getCurrentUser();
    if (!user) return [];
    return notificationService.getNotifications(user.id);
  });

  ipcMain.handle('notification:getUnreadCount', async () => {
    const user = authService.getCurrentUser();
    if (!user) return 0;
    return notificationService.getUnreadCount(user.id);
  });

  ipcMain.handle('notification:markRead', async (_, { id }) => {
    const user = authService.getCurrentUser();
    if (!user) return { success: false };
    return notificationService.markAsRead(id, user.id);
  });

  ipcMain.handle('notification:markAllRead', async () => {
    const user = authService.getCurrentUser();
    if (!user) return { success: false };
    return notificationService.markAllAsRead(user.id);
  });

  // --- Audit Log Handlers ---
  ipcMain.handle('audit:getLogs', async (_, { filters }) => {
    return auditService.getAuditLogs(filters);
  });

  // --- Settings & System Handlers ---
  ipcMain.handle('settings:get', async () => {
    return backupService.getSettings();
  });

  ipcMain.handle('settings:update', async (_, { key, value }) => {
    const user = authService.getCurrentUser();
    return backupService.updateSetting(key, value, user);
  });

  ipcMain.handle('system:getMetadata', async () => {
    return backupService.getSystemMetadata();
  });

  ipcMain.handle('dialog:selectSaveFile', async (_, { defaultName }) => {
    const result = await dialog.showSaveDialog({
      title: 'Export AYUSH PG Database Backup',
      defaultPath: defaultName || `pgdms_backup_${Date.now()}.sqlite`,
      filters: [{ name: 'SQLite Database', extensions: ['sqlite', 'db'] }]
    });
    return result.filePath;
  });

  ipcMain.handle('dialog:selectOpenFile', async () => {
    const result = await dialog.showOpenDialog({
      title: 'Select AYUSH PG Database Backup File',
      properties: ['openFile'],
      filters: [{ name: 'SQLite Database', extensions: ['sqlite', 'db'] }]
    });
    return result.filePaths && result.filePaths.length > 0 ? result.filePaths[0] : null;
  });

  ipcMain.handle('system:exportDb', async (_, { targetPath }) => {
    return backupService.exportDatabase(targetPath);
  });

  ipcMain.handle('system:importDb', async (_, { sourcePath }) => {
    return backupService.importDatabase(sourcePath);
  });

  // --- File Handlers ---
  ipcMain.handle('file:upload', async (_, { buffer, fileName, docType, dissertationId }) => {
    const user = authService.getCurrentUser();
    return fileService.saveFileLocally(buffer, fileName, docType, dissertationId, user);
  });

  ipcMain.handle('file:open', async (_, { filePath }) => {
    return fileService.openFile(filePath);
  });

  ipcMain.handle('file:readBase64', async (_, { filePath }) => {
    return fileService.readFileBase64(filePath);
  });
}

module.exports = { registerIpcHandlers };
