import * as admin from 'firebase-admin';
import { onRequest } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import express, { type Request, type Response } from 'express';
import { handleDeleteAccount } from './account';
import { handleAutosendCronRequest, runAutosendCron } from './autosend/cron';
import {
  handleBillingSync,
  handleConsumeCredit,
  handleRevenueCatWebhook,
} from './billing';
import {
  handleApproveScheduledSend,
  handleCancelScheduledSend,
  sweepExpiredReviews,
} from './autosend/review';

admin.initializeApp();

const db = admin.firestore();
const app = express();
app.use(express.json({ limit: '32kb' }));

/** Express 4 does not catch async rejections; without this a throw hangs the request. */
function safe(
  handler: (req: Request, res: Response) => Promise<void>,
): (req: Request, res: Response) => void {
  return (req, res) => {
    handler(req, res).catch((error: unknown) => {
      console.error('unhandled route error', req.path, error);
      if (!res.headersSent) {
        res.status(500).json({ code: 'INTERNAL' });
      }
    });
  };
}

app.post(
  '/v1/scheduled-sends/:id/approve',
  safe(async (req, res) => {
    await handleApproveScheduledSend(
      req,
      res,
      db,
      admin.messaging(),
      admin.auth(),
    );
  }),
);

app.post(
  '/v1/scheduled-sends/:id/cancel',
  safe(async (req, res) => {
    await handleCancelScheduledSend(req, res, db, admin.auth());
  }),
);

app.post(
  '/v1/internal/autosend/run',
  safe(async (req, res) => {
    await handleAutosendCronRequest(req, res, db, admin.messaging());
  }),
);

app.post(
  '/v1/billing/sync',
  safe(async (req, res) => {
    await handleBillingSync(req, res, db, admin.auth());
  }),
);

app.post(
  '/v1/billing/consume-credit',
  safe(async (req, res) => {
    await handleConsumeCredit(req, res, db, admin.auth());
  }),
);

app.post(
  '/v1/billing/webhook',
  safe(async (req, res) => {
    await handleRevenueCatWebhook(req, res, db);
  }),
);

app.delete(
  '/v1/account',
  safe(async (req, res) => {
    await handleDeleteAccount(req, res, db, admin.auth());
  }),
);

export const api = onRequest({ region: 'asia-south1' }, app);

/**
 * Creation runs twice a day: the second pass catches a failed morning run
 * (idempotent — existing sends are skipped).
 */
export const autosendDaily = onSchedule(
  {
    schedule: '0 6,12 * * *',
    timeZone: 'Asia/Kolkata',
    region: 'asia-south1',
  },
  async () => {
    await runAutosendCron(db, new Date(), admin.messaging());
  },
);

/** Dispatches lapsed review windows and retries failed deliveries. */
export const autosendSweep = onSchedule(
  {
    schedule: 'every 15 minutes',
    timeZone: 'Asia/Kolkata',
    region: 'asia-south1',
  },
  async () => {
    await sweepExpiredReviews(db, admin.messaging(), new Date());
  },
);
