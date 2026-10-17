import express from 'express';
import { listar, buscarPorId } from '../controllers/atracoes.controller.js';

const router = express.Router();

router.get('/', listar);
router.get('/:id', buscarPorId);

export default router;
