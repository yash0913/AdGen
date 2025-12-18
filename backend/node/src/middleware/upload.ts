import multer from 'multer';
import path from 'path';
import type express from 'express';

const storage = multer.diskStorage({
  destination: (_req: express.Request, _file: Express.Multer.File, cb: (error: any, destination: string) => void) => {
    cb(null, path.resolve(__dirname, '../../uploads'));
  },
  filename: (_req: express.Request, file: Express.Multer.File, cb: (error: any, filename: string) => void) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  },
});

export const upload = multer({ storage });
