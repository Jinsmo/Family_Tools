import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { config } from '../config';

// 逆地理编码 (经纬度 -> 地址)
export const regeo = async (req: AuthRequest, res: Response) => {
  const { latitude, longitude } = req.query;

  if (!latitude || !longitude) {
    return res.status(400).json({ error: 'Missing latitude or longitude' });
  }

  if (!config.amapKey) {
    return res.status(503).json({ error: 'Amap API key is not configured' });
  }

  try {
    const url = `https://restapi.amap.com/v3/geocode/regeo?output=json&location=${longitude},${latitude}&key=${config.amapKey}&radius=1000&extensions=all`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === '1') {
      res.json(data.regeocode);
    } else {
      res.status(400).json({ error: data.info || 'Amap API error' });
    }
  } catch (error) {
    console.error('Regeo failed:', error);
    res.status(500).json({ error: 'Failed to fetch location data' });
  }
};
