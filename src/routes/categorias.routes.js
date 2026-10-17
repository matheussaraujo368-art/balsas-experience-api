import express from 'express';
import { listarCategorias } from '../controllers/atracoes.controller.js';

const router = express.Router();

router.get('/', listarCategorias);

export default router;
