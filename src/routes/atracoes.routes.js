import express from 'express';
import {
  listar,
  buscarPorId,
  criar,
  atualizar,
  alterarParcial,
  remover,
  avaliar,
  removerAvaliacao,
} from '../controllers/atracoes.controller.js';

const router = express.Router();

router.get('/', listar);
router.get('/:id', buscarPorId);
router.post('/', criar);
router.put('/:id', atualizar);
router.patch('/:id', alterarParcial);
router.delete('/:id', remover);

// A avaliação é um recurso dentro de uma atração
router.post('/:id/avaliacoes', avaliar);
router.delete('/:id/avaliacoes/:avaliacaoId', removerAvaliacao);

export default router;
