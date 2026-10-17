import express from 'express';
import { listarTags } from '../controllers/categorias.controller.js';

const router = express.Router();

router.get('/', listarTags);

export default router;
