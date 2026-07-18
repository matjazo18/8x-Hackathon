import { Router } from 'express';
import { ModelManifest } from '@8x/shared-types';

const router = Router();

const model: ModelManifest = {
  id: 'qwen3-1.7b-mlx-4bit',
  name: 'Qwen3 1.7B',
  sizeBytes: 1_100_000_000,
  downloadUrl: 'https://huggingface.co/Qwen/Qwen3-1.7B-MLX-4bit',
  quantization: '4bit',
  format: 'mlx',
  repository: 'Qwen/Qwen3-1.7B-MLX-4bit',
  status: 'available',
};

router.get('/', (_req, res) => res.json({ models: [model] }));
router.get('/:id', (req, res) => {
  if (req.params.id !== model.id) {
    return res.status(404).json({ error: 'Model not found' });
  }
  return res.json(model);
});

export default router;
