import express from 'express';
import cors from 'cors';
import { ethers } from 'ethers';
import { createClient } from '@supabase/supabase-js';
import { Queue, Worker } from 'bullmq';
import rateLimit from 'express-rate-limit';
import IORedis from 'ioredis';

const app = express();
const port = process.env.PORT || 3001;

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL || 'https://mainnet.infura.io/v3/demo');
const relayerWallet = process.env.RELAYER_PRIVATE_KEY ? new ethers.Wallet(process.env.RELAYER_PRIVATE_KEY, provider) : null;

// Upstash Redis connection
const redis = new IORedis(process.env.UPSTASH_REDIS_URL!, {
  family: 6,
  maxRetriesPerRequest: 3,
  enableReadyCheck: false,
  lazyConnect: true,
});

const automationQueue = new Queue('guardian-automation', { connection: redis });

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});

app.use(cors());
app.use(express.json());
app.use(limiter);

const authenticateRelayer = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token !== process.env.GUARDIAN_RELAYER_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

app.post('/api/submit-automation', authenticateRelayer, async (req, res) => {
  try {
    const { log_id, user_address, smart_wallet_address, target_contract, token_address, action } = req.body;

    if (!log_id || !user_address || !target_contract || !token_address || action !== 'revoke') {
      return res.status(400).json({ error: 'Invalid request parameters' });
    }

    const request_id = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const job = await automationQueue.add('execute-revoke', {
      request_id, log_id, user_address, smart_wallet_address, target_contract, token_address, action, timestamp: Date.now()
    }, { 
      priority: 1, 
      attempts: 3, 
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: 100,
      removeOnFail: 50
    });

    res.json({ success: true, request_id, job_id: job.id });
  } catch (error) {
    console.error('Submit automation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Worker for processing automation jobs
const worker = new Worker('guardian-automation', async (job) => {
  const { request_id, log_id, user_address, target_contract, token_address } = job.data;

  if (!relayerWallet) {
    throw new Error('Relayer wallet not configured');
  }

  try {
    await supabase.from('guardian_automation_logs').update({ status: 'processing' }).eq('id', log_id);

    const erc20Interface = new ethers.Interface(['function approve(address spender, uint256 amount) external returns (bool)']);
    const revokeData = erc20Interface.encodeFunctionData('approve', [target_contract, 0]);

    const gasEstimate = await provider.estimateGas({ to: token_address, data: revokeData, from: user_address });
    const gasPrice = await provider.getFeeData();
    const maxFeePerGas = gasPrice.maxFeePerGas || ethers.parseUnits('20', 'gwei');
    const maxPriorityFeePerGas = gasPrice.maxPriorityFeePerGas || ethers.parseUnits('2', 'gwei');

    const tx = await relayerWallet.sendTransaction({
      to: token_address, data: revokeData, gasLimit: gasEstimate * 120n / 100n, maxFeePerGas, maxPriorityFeePerGas
    });

    await supabase.from('guardian_automation_logs').update({ 
      status: 'submitted', tx_hash: tx.hash, gas_cost_wei: (gasEstimate * maxFeePerGas).toString(), gas_price_gwei: ethers.formatUnits(maxFeePerGas, 'gwei')
    }).eq('id', log_id);

    const receipt = await tx.wait();

    if (receipt?.status === 1) {
      await supabase.from('guardian_automation_logs').update({ 
        status: 'confirmed', confirmed_at: new Date().toISOString(), gas_cost_wei: (receipt.gasUsed * receipt.gasPrice).toString()
      }).eq('id', log_id);
    } else {
      throw new Error('Transaction reverted');
    }

    return { success: true, tx_hash: tx.hash };
  } catch (error) {
    console.error('Automation execution error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await supabase.from('guardian_automation_logs').update({ status: 'failed', error_message: errorMessage }).eq('id', log_id);
    throw error;
  }
}, { connection: redis, concurrency: 5 });

app.get('/health', async (req, res) => {
  try {
    const redisStatus = await redis.ping();
    const queueStatus = await automationQueue.getWaiting();
    
    res.json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      redis: redisStatus === 'PONG' ? 'connected' : 'disconnected',
      queue: {
        waiting: queueStatus.length,
        active: (await automationQueue.getActive()).length,
        completed: (await automationQueue.getCompleted()).length,
        failed: (await automationQueue.getFailed()).length
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ status: 'unhealthy', error: errorMessage });
  }
});

app.get('/api/queue-status', authenticateRelayer, async (req, res) => {
  try {
    const waiting = await automationQueue.getWaiting();
    const active = await automationQueue.getActive();
    const completed = await automationQueue.getCompleted(0, 10);
    const failed = await automationQueue.getFailed(0, 10);
    
    res.json({
      waiting: waiting.length,
      active: active.length,
      recent_completed: completed.length,
      recent_failed: failed.length,
      jobs: {
        waiting: waiting.slice(0, 5).map(j => ({ id: j.id, data: j.data })),
        active: active.slice(0, 5).map(j => ({ id: j.id, data: j.data })),
        failed: failed.slice(0, 5).map(j => ({ id: j.id, failedReason: j.failedReason }))
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
});

app.listen(port, () => {
  console.log(`Guardian Relayer running on port ${port}`);
});