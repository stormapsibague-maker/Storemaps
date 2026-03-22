const express = require('express');
const router = express.Router();
const Report = require('../models/Report');
const { authMiddleware, superAdminAuth } = require('../middleware/auth.middleware');

// Crear reporte
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { targetId, targetType, reason, description } = req.body;
    
    const existing = await Report.findOne({
      reporterId: req.user.userId,
      targetId,
      targetType,
      status: 'pending'
    });
    
    if (existing) {
      return res.status(400).json({ message: 'Ya reportaste este contenido' });
    }
    
    const report = new Report({
      reporterId: req.user.userId,
      targetId,
      targetType,
      reason,
      description
    });
    
    await report.save();
    res.status(201).json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Obtener reportes (solo superadmin)
router.get('/', superAdminAuth, async (req, res) => {
  try {
    const reports = await Report.find({ status: 'pending' })
      .populate('reporterId', 'displayName photoURL')
      .sort({ createdAt: -1 });
    
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Obtener conteo de reportes pendientes
router.get('/pending/count', superAdminAuth, async (req, res) => {
  try {
    const count = await Report.countDocuments({ status: 'pending' });
    res.json(count);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Resolver reporte
router.put('/:id/resolve', superAdminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    
    const report = await Report.findByIdAndUpdate(
      req.params.id,
      {
        status,
        reviewedBy: req.user.userId,
        reviewedAt: new Date()
      },
      { new: true }
    );
    
    res.json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;