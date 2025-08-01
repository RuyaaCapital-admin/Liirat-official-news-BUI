import { VercelRequest, VercelResponse } from '@vercel/node';

// In-memory storage for demo (in production, use a database)
const alerts: any[] = [];
let alertIdCounter = 1;

interface Alert {
  id: number;
  userId: string; // In production, get from authentication
  symbol: string;
  type: 'price' | 'news' | 'technical';
  condition: string;
  targetValue?: number;
  isActive: boolean;
  createdAt: string;
  triggeredAt?: string;
  notificationMethod: 'email' | 'sms' | 'push';
  contactInfo: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    switch (req.method) {
      case 'GET':
        return handleGetAlerts(req, res);
      case 'POST':
        return handleCreateAlert(req, res);
      case 'PUT':
        return handleUpdateAlert(req, res);
      case 'DELETE':
        return handleDeleteAlert(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('Alerts API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

async function handleGetAlerts(req: VercelRequest, res: VercelResponse) {
  // In production, filter by authenticated user
  const userAlerts = alerts.filter(alert => alert.isActive);
  
  return res.status(200).json({
    success: true,
    alerts: userAlerts,
    total: userAlerts.length
  });
}

async function handleCreateAlert(req: VercelRequest, res: VercelResponse) {
  const { symbol, type, condition, targetValue, notificationMethod, contactInfo } = req.body;

  // Validation
  if (!symbol || !type || !condition || !notificationMethod || !contactInfo) {
    return res.status(400).json({ 
      error: 'Missing required fields: symbol, type, condition, notificationMethod, contactInfo' 
    });
  }

  if (!['price', 'news', 'technical'].includes(type)) {
    return res.status(400).json({ error: 'Invalid alert type' });
  }

  if (!['email', 'sms', 'push'].includes(notificationMethod)) {
    return res.status(400).json({ error: 'Invalid notification method' });
  }

  // Validate contact info based on method
  if (notificationMethod === 'email' && !isValidEmail(contactInfo)) {
    return res.status(400).json({ error: 'Invalid email address' });
  }

  if (notificationMethod === 'sms' && !isValidPhone(contactInfo)) {
    return res.status(400).json({ error: 'Invalid phone number' });
  }

  const newAlert: Alert = {
    id: alertIdCounter++,
    userId: 'demo-user', // In production, get from authentication
    symbol,
    type,
    condition,
    targetValue: targetValue ? parseFloat(targetValue) : undefined,
    isActive: true,
    createdAt: new Date().toISOString(),
    notificationMethod,
    contactInfo
  };

  alerts.push(newAlert);

  // In production, you would:
  // 1. Save to database
  // 2. Set up monitoring for the alert condition
  // 3. Schedule background checks

  return res.status(201).json({
    success: true,
    alert: newAlert,
    message: 'Alert created successfully! You will be notified when conditions are met.'
  });
}

async function handleUpdateAlert(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query;
  const alertId = parseInt(id as string);
  
  const alertIndex = alerts.findIndex(alert => alert.id === alertId);
  if (alertIndex === -1) {
    return res.status(404).json({ error: 'Alert not found' });
  }

  const { isActive, ...updateData } = req.body;
  
  alerts[alertIndex] = {
    ...alerts[alertIndex],
    ...updateData,
    isActive: isActive !== undefined ? isActive : alerts[alertIndex].isActive
  };

  return res.status(200).json({
    success: true,
    alert: alerts[alertIndex],
    message: 'Alert updated successfully'
  });
}

async function handleDeleteAlert(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query;
  const alertId = parseInt(id as string);
  
  const alertIndex = alerts.findIndex(alert => alert.id === alertId);
  if (alertIndex === -1) {
    return res.status(404).json({ error: 'Alert not found' });
  }

  alerts.splice(alertIndex, 1);

  return res.status(200).json({
    success: true,
    message: 'Alert deleted successfully'
  });
}

// Utility functions
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidPhone(phone: string): boolean {
  const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
  return phoneRegex.test(phone);
}

// Background function to check alerts (would run separately in production)
export async function checkAlertConditions() {
  // This would run as a separate background job/cron
  const activeAlerts = alerts.filter(alert => alert.isActive && !alert.triggeredAt);
  
  for (const alert of activeAlerts) {
    try {
      let shouldTrigger = false;
      
      switch (alert.type) {
        case 'price':
          // In production, check real price against condition
          // shouldTrigger = await checkPriceCondition(alert);
          break;
        case 'news':
          // Check for relevant news
          // shouldTrigger = await checkNewsCondition(alert);
          break;
        case 'technical':
          // Check technical indicators
          // shouldTrigger = await checkTechnicalCondition(alert);
          break;
      }
      
      if (shouldTrigger) {
        await triggerAlert(alert);
      }
    } catch (error) {
      console.error(`Error checking alert ${alert.id}:`, error);
    }
  }
}

async function triggerAlert(alert: Alert) {
  // Mark as triggered
  alert.triggeredAt = new Date().toISOString();
  alert.isActive = false;
  
  // Send notification (implement based on method)
  switch (alert.notificationMethod) {
    case 'email':
      // await sendEmailNotification(alert);
      console.log(`Email alert triggered for ${alert.symbol}: ${alert.condition}`);
      break;
    case 'sms':
      // await sendSMSNotification(alert);
      console.log(`SMS alert triggered for ${alert.symbol}: ${alert.condition}`);
      break;
    case 'push':
      // await sendPushNotification(alert);
      console.log(`Push alert triggered for ${alert.symbol}: ${alert.condition}`);
      break;
  }
}