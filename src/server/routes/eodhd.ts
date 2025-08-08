import type { NextApiRequest, NextApiResponse } from 'next/server';

// Minimal ELDHD api placeholder
// Replace with real logic later if needed
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    res.status(500).json({ message: 'EODH api placeholder - replace with real logic.' });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error', detail: err });
  }
}